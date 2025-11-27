
import React, { useEffect, useState, useRef, useLayoutEffect, useMemo } from 'react';
import { SubTopic, Chapter, Subject } from '../types';
import { generateTopicContentById, generateSummaryForTopic, generateQuizForTopic, generateSpeechForText } from '../services/geminiService';
import MarkdownRenderer from './MarkdownRenderer';
import QuizView from './QuizView';
import { Loader2, BookOpenCheck, RefreshCw, Volume2, StopCircle, Play, Pause, FileText, BookOpen, Settings, Sparkles, Copy, Check } from 'lucide-react';

interface TopicContentProps {
  topic: SubTopic;
  chapter: Chapter;
  subject: Subject;
}

// Gemini Voices
const GEMINI_VOICES = [
  { name: 'Kore', label: 'Kore (Balanced)' },
  { name: 'Puck', label: 'Puck (Energetic)' },
  { name: 'Charon', label: 'Charon (Deep)' },
  { name: 'Fenrir', label: 'Fenrir (Authoritative)' },
  { name: 'Zephyr', label: 'Zephyr (Calm)' },
];

interface AudioSegment {
  id: number;
  text: string;
  words: string[];
  audioBuffer: AudioBuffer | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
}

type PlaybackStatus = 'idle' | 'playing' | 'paused';

const TopicContent: React.FC<TopicContentProps> = ({ topic, chapter, subject }) => {
  const [activeTab, setActiveTab] = useState<'lesson' | 'summary'>('lesson');
  const [content, setContent] = useState<string | null>(null);
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizContent, setQuizContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // --- AUDIO STATE ---
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');
  const [isBuffering, setIsBuffering] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(-1);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number>(-1);
  
  // Settings
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('Kore');
  const [showSettings, setShowSettings] = useState(false);

  // Refs for persistent state inside async loops (Fixes volume reset bug)
  const rateRef = useRef(rate);
  const volumeRef = useRef(volume);

  // Data Structures
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  
  // Refs for Audio Engine
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  const processingRef = useRef(false); // Guard for loop
  const currentSegmentIndexRef = useRef<number>(-1); // Sync ref for loop
  const playbackSessionIdRef = useRef(0); // Unique session ID for race condition handling

  const transcriptListRef = useRef<HTMLDivElement>(null);

  // Cache: Key = "VoiceName-SegmentTextHash" -> Buffer
  const audioCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  // Pending Requests: Key -> Promise (Deduplication)
  const pendingRequestsRef = useRef<Map<string, Promise<AudioBuffer | null>>>(new Map());

  // --- INITIALIZATION ---

  useEffect(() => {
    // Reset everything when topic changes
    stopAudio();
    audioCacheRef.current.clear(); // Clear cache to prevent memory leaks
    pendingRequestsRef.current.clear();
    setQuizContent(null);
    setActiveTab('lesson'); 
    setCopied(false);
    
    const loadContent = async () => {
      setLoading(true);
      const text = await generateTopicContentById(topic.id, topic.title, chapter.title, subject.id);
      setContent(text);
      setLoading(false);
    };

    loadContent();
  }, [topic.id]);

  // When content loads, parse it into segments immediately
  useEffect(() => {
    const textToParse = activeTab === 'lesson' ? content : summaryContent;
    if (textToParse) {
      parseTextToSegments(textToParse);
    } else {
      setSegments([]);
    }
    stopAudio();
  }, [content, summaryContent, activeTab]);

  // Sync refs with state for async loop access
  useEffect(() => {
    rateRef.current = rate;
    volumeRef.current = volume;
    
    // Real-time update for current node if playing
    if (sourceNodeRef.current) {
        try { sourceNodeRef.current.playbackRate.value = rate; } catch(e) {}
    }
    // Instant volume update
    if (gainNodeRef.current && audioContextRef.current) {
        try { 
            gainNodeRef.current.gain.setTargetAtTime(volume, audioContextRef.current.currentTime, 0.1); 
        } catch(e) {}
    }
  }, [rate, volume]);

  // When Voice Changes, restart playback seamlessly if playing
  useEffect(() => {
    if (playbackStatus !== 'idle') {
      const currentIndex = activeSegmentIndex >= 0 ? activeSegmentIndex : 0;
      stopAudio();
      // Slight delay to ensure cleanup
      setTimeout(() => {
         playFromSegment(currentIndex);
      }, 50);
    }
  }, [selectedVoiceName]);

  // --- OPTIMIZATION: PRE-WARMING CACHE ---
  // Automatically start fetching the first few chunks as soon as segments are ready
  useEffect(() => {
    if (segments.length > 0 && selectedVoiceName) {
      // Pre-fetch the first 3 segments immediately
      // This ensures that when the user clicks play, audio is likely already there
      fetchAudioForSegment(0);
      fetchAudioForSegment(1);
      fetchAudioForSegment(2);
    }
  }, [segments, selectedVoiceName]);


  // --- PARSING LOGIC ---

  const parseTextToSegments = (markdown: string) => {
    // Remove code blocks to avoid reading syntax
    const noCode = markdown.replace(/```[\s\S]*?```/g, '');
    
    // Clean Markdown symbols
    const cleanText = noCode
      .replace(/[#*`_\[\]]/g, '') // remove formatting chars
      .replace(/\n+/g, ' ')       // replace newlines with spaces
      .replace(/\s+/g, ' ')       // collapse spaces
      .trim();

    // 1. Initial Split by Sentence
    const rawSentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
    
    // 2. OPTIMIZATION: Smart Merge
    // Merging short sentences into larger chunks (e.g., paragraphs) 
    // reduces the number of API requests significantly (less buffering).
    // Target Chunk Size: ~150-200 chars
    const mergedSentences: string[] = [];
    let currentChunk = "";
    
    for (const sentence of rawSentences) {
        const trimmed = sentence.trim();
        if (!trimmed) continue;
        
        // If current chunk is small, append next sentence
        if (currentChunk.length + trimmed.length < 180) {
            currentChunk += (currentChunk ? " " : "") + trimmed;
        } else {
            // Push current chunk and start new one
            if (currentChunk) mergedSentences.push(currentChunk);
            currentChunk = trimmed;
        }
    }
    if (currentChunk) mergedSentences.push(currentChunk);

    const newSegments: AudioSegment[] = mergedSentences
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map((text, idx) => ({
        id: idx,
        text: text,
        words: text.split(' '),
        audioBuffer: null,
        status: 'idle'
      }));

    setSegments(newSegments);
  };

  // --- AUDIO ENGINE ---

  // 1. Get Context (Passive) - Does NOT resume if suspended
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  // 2. Resume Context (Active) - Call this only on explicit user Play/Resume
  const resumeAudioContext = async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx;
  };

  const decodeAudio = async (base64: string, ctx: AudioContext) => {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    
    const pcmData = new Int16Array(bytes.buffer);
    const audioBuffer = ctx.createBuffer(1, pcmData.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 32768.0;
    }
    return audioBuffer;
  };

  const fetchAudioForSegment = async (index: number): Promise<AudioBuffer | null> => {
    if (index < 0 || index >= segments.length) return null;
    
    const segment = segments[index];
    // Hash-like key to separate voices and content
    const cacheKey = `${selectedVoiceName}-${segment.text.substring(0, 30)}-${index}`;

    // 1. Check Result Cache
    if (audioCacheRef.current.has(cacheKey)) {
      return audioCacheRef.current.get(cacheKey)!;
    }

    // 2. Check Pending Request Cache (Deduplication)
    if (pendingRequestsRef.current.has(cacheKey)) {
      return pendingRequestsRef.current.get(cacheKey)!;
    }

    // Only fetch if we have text
    if (!segment.text) return null;

    // 3. Initiate New Request
    const fetchPromise = (async () => {
      try {
        const base64 = await generateSpeechForText(segment.text, selectedVoiceName);
        if (!base64) return null;

        // Use getAudioContext() so we don't accidentally resume the context while buffering in background
        const ctx = getAudioContext();
        const buffer = await decodeAudio(base64, ctx);
        
        audioCacheRef.current.set(cacheKey, buffer);
        return buffer;
      } catch (err) {
        console.error("Fetch audio error:", err);
        return null;
      } finally {
        // Clean up pending request
        pendingRequestsRef.current.delete(cacheKey);
      }
    })();

    pendingRequestsRef.current.set(cacheKey, fetchPromise);
    return fetchPromise;
  };

  // The Main Loop
  const playFromSegment = async (startIndex: number) => {
    // Invalidate previous sessions
    playbackSessionIdRef.current += 1;
    const currentSessionId = playbackSessionIdRef.current;

    processingRef.current = true;
    
    // Explicitly resume context here because user requested playback
    const ctx = await resumeAudioContext();

    currentSegmentIndexRef.current = startIndex;
    setPlaybackStatus('playing');

    try {
      while (currentSegmentIndexRef.current < segments.length) {
        // RACE CHECK: If session changed, abort immediately
        if (currentSessionId !== playbackSessionIdRef.current) break;

        const index = currentSegmentIndexRef.current;
        setActiveSegmentIndex(index);
        
        // 1. Fetch Current (Buffering State)
        const segment = segments[index];
        const cacheKey = `${selectedVoiceName}-${segment.text.substring(0, 30)}-${index}`;
        
        if (!audioCacheRef.current.has(cacheKey)) {
             setIsBuffering(true);
        }

        let buffer = await fetchAudioForSegment(index);
        
        setIsBuffering(false);

        // RACE CHECK
        if (currentSessionId !== playbackSessionIdRef.current) break;

        // 2. OPTIMIZATION: Aggressive Look-Ahead (Background)
        // Fetch next 5 segments to prevent buffering gaps
        for (let i = 1; i <= 5; i++) {
           fetchAudioForSegment(index + i);
        }

        if (!buffer) {
          // If fetch failed, skip segment
          currentSegmentIndexRef.current++;
          continue;
        }

        // 3. Play
        await new Promise<void>((resolve) => {
          if (currentSessionId !== playbackSessionIdRef.current) {
            resolve();
            return;
          }

          const source = ctx.createBufferSource();
          source.buffer = buffer;
          
          source.playbackRate.value = rateRef.current;
          
          const gainNode = ctx.createGain();
          gainNode.gain.value = volumeRef.current;
          gainNodeRef.current = gainNode; // Store ref for instant update

          source.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          sourceNodeRef.current = source;
          
          // Heuristic Animation
          const startTime = ctx.currentTime;
          const duration = buffer.duration / rateRef.current;
          const wordCount = segments[index].words.length;
          
          let animationFrameId: number;
          
          const updateHighlight = () => {
            if (currentSessionId !== playbackSessionIdRef.current) return;
            
            // Handle Pause State (Suspended Context)
            if (ctx.state === 'suspended') {
                 animationFrameId = requestAnimationFrame(updateHighlight);
                 return;
            }

            const elapsed = ctx.currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Map progress to word index
            const wordIdx = Math.floor(progress * wordCount);
            setHighlightedWordIndex(wordIdx);

            if (progress < 1) {
              animationFrameId = requestAnimationFrame(updateHighlight);
            }
          };
          
          animationFrameId = requestAnimationFrame(updateHighlight);

          source.onended = () => {
            cancelAnimationFrame(animationFrameId);
            setHighlightedWordIndex(-1);
            sourceNodeRef.current = null;
            gainNodeRef.current = null;
            resolve(); // Next sentence
          };

          source.start(0);
        });

        // 4. Advance
        if (currentSessionId === playbackSessionIdRef.current) {
           currentSegmentIndexRef.current++;
        }
      }
    } catch (e) {
      console.error("Playback error", e);
    } finally {
      // Only reset UI if this session is the active one and it finished naturally
      if (currentSessionId === playbackSessionIdRef.current) {
          setPlaybackStatus('idle');
          setActiveSegmentIndex(-1);
          setIsBuffering(false);
      }
      if (currentSessionId === playbackSessionIdRef.current) {
          processingRef.current = false;
      }
    }
  };

  const handlePause = async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'running') {
      await ctx.suspend();
      setPlaybackStatus('paused');
    }
  };

  const handleResume = async () => {
    const ctx = getAudioContext();
    
    if (ctx.state === 'suspended') {
      await ctx.resume();
      setPlaybackStatus('playing');
    } else if (playbackStatus === 'idle') {
      playFromSegment(0);
    }
  };

  const stopAudio = () => {
    // Increment session ID to invalidate any running loops
    playbackSessionIdRef.current += 1;
    
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e){}
    }
    if (audioContextRef.current) {
       try { audioContextRef.current.suspend(); } catch(e){}
    }
    
    sourceNodeRef.current = null;
    gainNodeRef.current = null;
    
    setPlaybackStatus('idle');
    setActiveSegmentIndex(-1);
    setHighlightedWordIndex(-1);
    setIsBuffering(false);
    processingRef.current = false;
  };

  const handleTogglePlay = () => {
    if (playbackStatus === 'playing') {
      stopAudio(); // Stop button action
    } else {
      // Start a new session
      playFromSegment(0);
    }
  };
  
  const handleSegmentClick = (index: number) => {
    stopAudio();
    // Allow state to clear
    setTimeout(() => {
      playFromSegment(index);
    }, 10);
  };

  // --- AUTO SCROLL ---
  useEffect(() => {
    if (activeSegmentIndex >= 0 && transcriptListRef.current) {
       const container = transcriptListRef.current;
       const activeEl = container.children[activeSegmentIndex] as HTMLElement;
       
       if (activeEl) {
         // Calculate scroll position manually to avoid scrolling the main window
         // We center the active element within the container
         const elementTop = activeEl.offsetTop;
         const elementHeight = activeEl.clientHeight;
         const containerHeight = container.clientHeight;
         
         container.scrollTo({
           top: elementTop - containerHeight / 2 + elementHeight / 2,
           behavior: 'smooth'
         });
       }
    }
  }, [activeSegmentIndex]);

  // --- HELPER FETCHERS ---
  const fetchSummary = async () => {
    if (summaryContent) return;
    setSummaryLoading(true);
    const text = await generateSummaryForTopic(topic.title, chapter.title);
    setSummaryContent(text);
    setSummaryLoading(false);
  };

  const handleTabChange = (tab: 'lesson' | 'summary') => {
    setActiveTab(tab);
    if (tab === 'summary' && !summaryContent) fetchSummary();
  };

  const handleGenerateQuiz = async () => {
    if (quizContent) return;
    setQuizLoading(true);
    const quiz = await generateQuizForTopic(topic.title);
    setQuizContent(quiz);
    setQuizLoading(false);
  };

  const handleCopy = async (text: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- REUSABLE COMPONENTS ---

  const renderTranscriptList = () => (
    <div className="my-8 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md">
       <div className="p-3 bg-indigo-50/50 dark:bg-white/5 border-b border-indigo-100 dark:border-white/5 flex justify-between items-center">
         <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase flex items-center gap-2">
           <Volume2 size={14} /> Interactive Transcript
         </h4>
         <div className="flex items-center gap-3">
            {isBuffering && (
               <span className="text-xs font-bold text-indigo-500 animate-pulse flex items-center gap-1">
                 <Loader2 size={12} className="animate-spin" /> Buffering...
               </span>
            )}
            <span className="text-xs text-slate-400">{segments.length} Segments</span>
         </div>
       </div>
       {/* Added relative positioning to container for correct offsetTop calculations */}
       <div ref={transcriptListRef} className="max-h-[300px] overflow-y-auto p-4 space-y-2 scroll-smooth relative">
          {segments.map((seg, idx) => {
             const isActive = idx === activeSegmentIndex;
             return (
               <div 
                 key={idx}
                 onClick={() => handleSegmentClick(idx)}
                 className={`p-3 rounded-lg cursor-pointer transition-all duration-300 text-sm leading-relaxed border ${
                   isActive 
                     ? 'bg-indigo-600 text-white shadow-lg scale-[1.02] border-indigo-500 z-10' 
                     : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-white/5'
                 }`}
               >
                 {isActive ? (
                    <span>
                      {seg.words.map((word, wIdx) => (
                        <span 
                          key={wIdx} 
                          className={`transition-opacity duration-200 ${wIdx === highlightedWordIndex ? 'bg-yellow-400/30 text-white font-bold px-0.5 rounded' : 'opacity-90'}`}
                        >
                          {word}{' '}
                        </span>
                      ))}
                    </span>
                 ) : (
                    <span>{seg.text}</span>
                 )}
               </div>
             );
          })}
          {segments.length === 0 && <p className="text-slate-400 text-center italic p-4">Audio transcript not available.</p>}
       </div>
    </div>
  );

  const renderAudioControlSection = (label: string) => (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* PLAY / PAUSE / RESUME */}
        {playbackStatus === 'idle' ? (
             <button
                onClick={handleTogglePlay}
                disabled={segments.length === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Play className="w-5 h-5 fill-current" />
                <span>Listen to {label}</span>
             </button>
        ) : (
            <>
               {/* Pause / Resume Button */}
               <button
                  onClick={playbackStatus === 'playing' ? handlePause : handleResume}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                    playbackStatus === 'playing' 
                       ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' 
                       : 'bg-green-500 hover:bg-green-600 shadow-green-500/30'
                  }`}
               >
                  {playbackStatus === 'playing' ? (
                     <>
                        <Pause className="w-5 h-5 fill-current" />
                        <span>Pause</span>
                     </>
                  ) : (
                     <>
                        <Play className="w-5 h-5 fill-current" />
                        <span>Resume</span>
                     </>
                  )}
               </button>

               {/* Stop Button */}
               <button
                  onClick={stopAudio}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg bg-red-500 hover:bg-red-600 shadow-red-500/30 transition-all transform hover:scale-105 active:scale-95"
               >
                  <StopCircle className="w-5 h-5" />
                  <span>Stop</span>
               </button>
            </>
        )}

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-3 rounded-xl border transition-all ${showSettings ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
          title="Audio Settings"
        >
          <Settings className={`w-5 h-5 ${showSettings ? 'rotate-90' : ''} transition-transform`} />
        </button>

        {isBuffering && (
            <div className="flex items-center gap-2 text-indigo-500 animate-pulse ml-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm font-medium">Buffering audio...</span>
            </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-6 shadow-xl animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Speed: {rate}x</label>
            <input type="range" min="0.5" max="2" step="0.25" value={rate} onChange={e => setRate(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Volume: {Math.round(volume*100)}%</label>
            <input type="range" min="0" max="1" step="0.1" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">AI Voice</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GEMINI_VOICES.map(v => (
                <button 
                  key={v.name}
                  onClick={() => setSelectedVoiceName(v.name)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${selectedVoiceName === v.name ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-300'}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Always show transcript if playing or paused */}
      {playbackStatus !== 'idle' && renderTranscriptList()}
    </div>
  );

  // --- RENDER MAIN ---
  
  if (loading) {
     return (
       <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
         <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
         <p className="text-lg text-slate-500 animate-pulse">Generating your lesson...</p>
       </div>
     );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> {chapter.title}
        </h3>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-8 leading-tight">
          {topic.title}
        </h1>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-800/50 rounded-xl w-fit border border-slate-200 dark:border-white/5 backdrop-blur-sm mb-8 shadow-sm">
           <button
             onClick={() => handleTabChange('lesson')}
             className={`px-6 py-2.5 text-sm font-bold transition-all rounded-lg flex items-center gap-2 ${
               activeTab === 'lesson' 
                 ? 'bg-indigo-600 text-white shadow-lg' 
                 : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
             }`}
           >
             <BookOpen size={16} />
             Lesson
           </button>
           <button
             onClick={() => handleTabChange('summary')}
             className={`px-6 py-2.5 text-sm font-bold transition-all rounded-lg flex items-center gap-2 ${
               activeTab === 'summary' 
                 ? 'bg-purple-600 text-white shadow-lg' 
                 : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
             }`}
           >
             <FileText size={16} />
             Summary
           </button>
        </div>
      </div>

      {/* LESSON TAB */}
      {activeTab === 'lesson' && (
        <div className="animate-fade-in">
          
          {renderAudioControlSection('Lesson')}

          <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 md:p-10 border border-slate-200 dark:border-white/5 shadow-2xl relative group">
             <button
               onClick={() => handleCopy(content)}
               className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-lg transition-all opacity-0 group-hover:opacity-100"
             >
               {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
             </button>
             <MarkdownRenderer content={content || ''} />
          </div>

          {/* Quiz */}
          <div className="mt-16 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-8 border border-indigo-200 dark:border-indigo-500/20">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
                 <BookOpenCheck className="text-green-500" /> Knowledge Check
               </h2>
               {!quizContent && (
                  <button 
                    onClick={handleGenerateQuiz}
                    disabled={quizLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {quizLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />} Generate Quiz
                  </button>
               )}
            </div>
            {quizContent && <QuizView rawContent={quizContent} />}
          </div>
        </div>
      )}

      {/* SUMMARY TAB */}
      {activeTab === 'summary' && (
        <div className="animate-fade-in">
           {summaryLoading ? (
             <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
                <p className="text-slate-500 animate-pulse font-medium">Generating Summary...</p>
             </div>
           ) : (
             <>
               {renderAudioControlSection('Summary')}
               
               <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                     <Sparkles className="w-32 h-32 text-purple-500" />
                  </div>
                  <button
                    onClick={() => handleCopy(summaryContent)}
                    className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-purple-600 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                  {summaryContent ? <MarkdownRenderer content={summaryContent} /> : <p>No summary available.</p>}
               </div>
             </>
           )}
        </div>
      )}
    </div>
  );
};

export default TopicContent;
