
import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { SubTopic, Chapter, Subject } from '../types';
import { generateTopicContentById, generateSummaryForTopic, generateQuizForTopic } from '../services/geminiService';
import MarkdownRenderer from './MarkdownRenderer';
import QuizView from './QuizView';
import { Loader2, BookOpenCheck, RefreshCw, Volume2, StopCircle, Play, Pause, FileText, BookOpen, Settings, Sparkles, Copy, Check } from 'lucide-react';

interface TopicContentProps {
  topic: SubTopic;
  chapter: Chapter;
  subject: Subject;
}

const TopicContent: React.FC<TopicContentProps> = ({ topic, chapter, subject }) => {
  const [activeTab, setActiveTab] = useState<'lesson' | 'summary'>('lesson');
  const [content, setContent] = useState<string | null>(null);
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizContent, setQuizContent] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [highlightRange, setHighlightRange] = useState<[number, number] | null>(null);

  const [copied, setCopied] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synth = window.speechSynthesis;
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  
  const currentTextRef = useRef<string>("");
  const currentCharIndexRef = useRef<number>(0);
  const isSwitchingSettings = useRef<boolean>(false);

  const [cache, setCache] = useState<Record<string, string>>({});
  const [summaryCache, setSummaryCache] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = synth.getVoices();
      setVoices(allVoices);
      
      if (allVoices.length > 0 && !selectedVoice) {
        const preferred = allVoices.find(v => v.name.includes('Google US English')) || 
                          allVoices.find(v => v.lang.startsWith('en')) || 
                          allVoices[0];
        setSelectedVoice(preferred);
      }
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [topic]);

  useLayoutEffect(() => {
    if (activeWordRef.current && transcriptContainerRef.current) {
      const container = transcriptContainerRef.current;
      const element = activeWordRef.current;
      const containerHeight = container.clientHeight;
      const elementTop = element.offsetTop;
      const elementHeight = element.clientHeight;
      
      const scrollPos = elementTop - (containerHeight / 2) + (elementHeight / 2);
      
      container.scrollTo({
        top: scrollPos,
        behavior: 'smooth'
      });
    }
  }, [highlightRange]);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      const timeoutId = setTimeout(() => {
        isSwitchingSettings.current = true;
        synth.cancel();
        
        const previousText = currentTextRef.current;
        const lastIndex = currentCharIndexRef.current;
        
        if (lastIndex < previousText.length) {
            const remainingText = previousText.substring(lastIndex);
            
            currentTextRef.current = remainingText;
            setTranscriptText(remainingText); 
            currentCharIndexRef.current = 0;
            speakChunk(remainingText);
            
            setTimeout(() => {
              isSwitchingSettings.current = false;
            }, 100);
        } else {
            isSwitchingSettings.current = false;
            setIsPlaying(false);
        }
      }, 300); 

      return () => clearTimeout(timeoutId);
    }
  }, [rate, volume, selectedVoice]);

  const stopAudio = () => {
    isSwitchingSettings.current = false;
    if (synth.speaking || synth.pending || isPaused) {
      synth.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setTranscriptText("");
    setHighlightRange(null);
    currentTextRef.current = "";
    currentCharIndexRef.current = 0;
  };

  const pauseAudio = () => {
    if (synth.speaking && !synth.paused) {
      synth.pause();
      setIsPaused(true);
    }
  };

  const resumeAudio = () => {
    if (synth.paused) {
      synth.resume();
      setIsPaused(false);
    }
  };

  const fetchContent = async () => {
    stopAudio();
    setQuizContent(null);
    setTranscriptText("");
    setHighlightRange(null);
    setActiveTab('lesson'); 
    setCopied(false);
    
    if (cache[topic.id]) {
      setContent(cache[topic.id]);
      return;
    }

    setLoading(true);
    const generatedText = await generateTopicContentById(topic.id, topic.title, chapter.title, subject.id);
    setContent(generatedText);
    setCache(prev => ({ ...prev, [topic.id]: generatedText }));
    setLoading(false);
  };

  const fetchSummary = async () => {
    if (summaryCache[topic.id]) {
      setSummaryContent(summaryCache[topic.id]);
      return;
    }

    setSummaryLoading(true);
    const summaryText = await generateSummaryForTopic(topic.title, chapter.title);
    setSummaryContent(summaryText);
    setSummaryCache(prev => ({ ...prev, [topic.id]: summaryText }));
    setSummaryLoading(false);
  };

  useEffect(() => {
    fetchContent();
  }, [topic, chapter, subject.id]);

  const handleTabChange = (tab: 'lesson' | 'summary') => {
    stopAudio(); 
    setActiveTab(tab);
    setCopied(false);
    if (tab === 'summary' && !summaryContent) {
      fetchSummary();
    }
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
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const cleanTextForSpeech = (rawText: string): string => {
    return rawText
      .replace(/[*#`_\[\]]/g, '') 
      .replace(/<[^>]*>?/gm, '') 
      .replace(/\n\s*\n/g, '. ') 
      .trim();
  };

  const speakChunk = (text: string) => {
      if (!text.trim()) {
          setIsPlaying(false);
          return;
      }

      setTranscriptText(text);
      setHighlightRange(null);

      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = rate;
      utterance.volume = volume;
      utterance.pitch = 1;

      utterance.onboundary = (event) => {
        currentCharIndexRef.current = event.charIndex;
        const charIndex = event.charIndex;
        let nextSpace = text.indexOf(' ', charIndex);
        if (nextSpace === -1) nextSpace = text.length;
        setHighlightRange([charIndex, nextSpace]);
      };

      utterance.onend = () => {
        if (isSwitchingSettings.current) return;
        setIsPlaying(false);
        setIsPaused(false);
        setHighlightRange(null);
        currentCharIndexRef.current = 0;
      };

      utterance.onerror = (e) => {
          console.error("Speech Error:", e);
          if (!isSwitchingSettings.current) {
            setIsPlaying(false);
          }
      }

      utteranceRef.current = utterance;
      synth.speak(utterance);
  };

  const handleSpeak = () => {
    const textToSpeak = activeTab === 'lesson' ? content : summaryContent;

    if (isPlaying) {
      if (isPaused) {
          resumeAudio();
      } else {
          pauseAudio();
      }
      return;
    }

    if (!textToSpeak) return;

    stopAudio();
    setTimeout(() => {
        setIsPlaying(true);
        const cleanText = cleanTextForSpeech(textToSpeak);
        currentTextRef.current = cleanText;
        currentCharIndexRef.current = 0;
        speakChunk(cleanText);
    }, 50);
  };

  const renderTranscript = () => {
    if (!transcriptText || !isPlaying) return null;

    let before = transcriptText;
    let highlight = "";
    let after = "";

    if (highlightRange) {
        const [start, end] = highlightRange;
        before = transcriptText.substring(0, start);
        highlight = transcriptText.substring(start, end);
        after = transcriptText.substring(end);
    }

    return (
      <div className="bg-white/80 dark:bg-slate-900/40 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl overflow-hidden mb-8 shadow-2xl backdrop-blur-xl flex flex-col relative group transition-colors">
         <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
         
         <div className="p-3 bg-white/90 dark:bg-slate-900/60 border-b border-indigo-100 dark:border-white/5 flex justify-between items-center">
             <h4 className="text-xs text-indigo-600 dark:text-indigo-300 uppercase font-bold flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400 animate-pulse" /> Live Transcript
             </h4>
         </div>

         <div 
           ref={transcriptContainerRef}
           className="h-48 overflow-y-auto p-6 scroll-smooth text-lg leading-relaxed font-medium font-serif"
         >
           <p className="text-slate-500 dark:text-slate-300/60 transition-colors duration-300">
             {before}
             {highlight && (
                 <span 
                   ref={activeWordRef}
                   className="bg-indigo-500 text-white px-1 py-0.5 rounded shadow-[0_0_15px_rgba(99,102,241,0.5)] mx-0.5 inline-block scale-110 transition-all duration-200 ease-out"
                 >
                   {highlight}
                 </span>
             )}
             {after}
           </p>
         </div>
         
         <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white dark:from-slate-900/80 to-transparent pointer-events-none"></div>
      </div>
    );
  };

  const renderAudioControls = (textAvailable: boolean) => (
    <>
      <div className="mb-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              {textAvailable && (
                <>
                  <button
                    onClick={handleSpeak}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg min-w-[130px] justify-center transform hover:scale-105 ${
                      isPlaying && !isPaused
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-500/30' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-indigo-500/30'
                    }`}
                  >
                    {isPlaying && !isPaused ? (
                      <>
                        <Pause className="w-5 h-5 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current" />
                        <span>{isPlaying && isPaused ? 'Resume' : 'Listen'}</span>
                      </>
                    )}
                  </button>
                  
                  {isPlaying && (
                      <button
                      onClick={stopAudio}
                      className="p-2.5 rounded-xl bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20 border border-red-300 dark:border-red-500/30 hover:border-red-400 dark:hover:border-red-500/50 transition-all"
                      title="Stop Audio"
                    >
                      <StopCircle className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2.5 rounded-xl border transition-all ${
                      showSettings 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-300 dark:hover:border-slate-500'
                    }`}
                    title="Audio Settings"
                  >
                    <Settings className={`w-5 h-5 ${showSettings ? 'animate-spin-slow' : ''}`} />
                  </button>
                </>
              )}
            </div>
        </div>

        {showSettings && textAvailable && (
          <div className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-md border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-6 mb-6 animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8 shadow-2xl">
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">Speed</label>
                <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold shadow">{rate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.25"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">Volume</label>
                <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold shadow">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
            
            <div className="md:col-span-2 border-t border-slate-200 dark:border-white/10 pt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">Voice</label>
                <span className="text-xs text-slate-500 dark:text-slate-400">{voices.length} Available</span>
              </div>
              <select
                value={selectedVoice?.name || ""}
                onChange={(e) => {
                  const voice = voices.find(v => v.name === e.target.value);
                  if (voice) setSelectedVoice(voice);
                }}
                className="w-full bg-slate-100 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 text-sm rounded-xl p-3 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                {voices.length === 0 && <option>Loading voices...</option>}
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {renderTranscript()}
    </>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
        <p className="text-lg animate-pulse">Generating comprehensive notes...</p>
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

      {/* LESSON TAB CONTENT */}
      {activeTab === 'lesson' && (
        <div className="animate-fade-in">
          {renderAudioControls(!!content)}

          {/* Main Content */}
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 md:p-10 border border-slate-200 dark:border-white/5 shadow-2xl backdrop-blur-sm relative group">
            {content && (
              <button
                onClick={() => handleCopy(content)}
                className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-200 dark:border-white/10 shadow-lg z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
            )}
            {content && <MarkdownRenderer content={content} />}
          </div>

          {/* Quiz Section */}
          <div className="mt-16 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-8 border border-indigo-200 dark:border-indigo-500/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-500/20 p-2 rounded-lg">
                  <BookOpenCheck className="text-green-600 dark:text-green-400 w-6 h-6" />
                </div>
                Knowledge Check
              </h2>
              {!quizContent && (
                <button
                  onClick={handleGenerateQuiz}
                  disabled={quizLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5"
                >
                  {quizLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                  Generate Quiz
                </button>
              )}
            </div>

            {quizContent && (
              <div className="animate-fade-in shadow-inner">
                 <QuizView rawContent={quizContent} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUMMARY TAB CONTENT */}
      {activeTab === 'summary' && (
        <div className="animate-fade-in">
          {summaryLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
               <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
               <p className="text-lg animate-pulse">Synthesizing key points...</p>
            </div>
          ) : (
            <>
              {renderAudioControls(!!summaryContent)}

              <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 md:p-10 border border-slate-200 dark:border-white/5 shadow-2xl backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Sparkles className="w-32 h-32 text-purple-500" />
                </div>
                {summaryContent && (
                  <button
                    onClick={() => handleCopy(summaryContent)}
                    className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-purple-600 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-200 dark:border-white/10 shadow-lg z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    title="Copy summary"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                )}
                 {summaryContent ? (
                    <MarkdownRenderer content={summaryContent} />
                 ) : (
                   <div className="text-center py-10 text-slate-500">
                      Failed to load summary.
                   </div>
                 )}
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default TopicContent;
