import React, { useState, useEffect } from 'react';
import { Subject, Chapter, SubTopic } from '../types';
import { ChevronDown, ChevronRight, BookOpen, FileCode, GraduationCap, Home, Sun, Moon } from 'lucide-react';

interface SidebarProps {
  subjects: Subject[];
  currentSubject: Subject;
  onSelectSubject: (subjectId: string) => void;
  onSelectTopic: (topic: SubTopic, chapter: Chapter) => void;
  onGoHome: () => void;
  selectedTopicId: string | null;
  isOpen: boolean;
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  subjects,
  currentSubject,
  onSelectSubject,
  onSelectTopic, 
  onGoHome,
  selectedTopicId, 
  isOpen, 
  toggleSidebar,
  theme,
  toggleTheme
}) => {
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpandedChapters({});
  }, [currentSubject.id]);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-20 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      {/* Sidebar Content */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 h-screen w-80 
        bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl 
        border-r border-slate-200 dark:border-white/10 
        overflow-y-auto z-30 transition-transform duration-300 transform 
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-2xl`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-white/10 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10 space-y-4">
          <div 
            onClick={() => {
              onGoHome();
              if (window.innerWidth < 1024) toggleSidebar();
            }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400 group-hover:from-indigo-600 group-hover:to-purple-600 dark:group-hover:from-indigo-300 dark:group-hover:to-purple-300 transition-all">
              WebMastery
            </span>
          </div>

          <button
            onClick={() => {
              onGoHome();
              if (window.innerWidth < 1024) toggleSidebar();
            }}
            className="w-full flex items-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 py-2.5 px-3 rounded-lg transition-all border border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30 font-medium text-sm group"
          >
            <Home className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300" />
            Home Dashboard
          </button>
          
          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-2 ml-1 tracking-wider">
              Select Subject:
            </label>
            <div className="relative group">
              <select
                value={currentSubject.id}
                onChange={(e) => onSelectSubject(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white py-2.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm cursor-pointer hover:border-indigo-500/50 transition-colors"
              >
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {subject.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-indigo-500 dark:text-indigo-400 pointer-events-none group-hover:text-indigo-700 dark:group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        <div className="p-2 space-y-1">
          {currentSubject.chapters.map((chapter) => (
            <div key={chapter.id} className="mb-1">
              <button
                onClick={() => toggleChapter(chapter.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 ${
                  expandedChapters[chapter.id] 
                  ? 'bg-indigo-50 dark:bg-white/5 text-indigo-700 dark:text-indigo-300' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 pr-2 overflow-hidden">
                  <div className={`p-1 rounded ${expandedChapters[chapter.id] ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'bg-slate-200 dark:bg-slate-800'}`}>
                    <BookOpen size={14} className={expandedChapters[chapter.id] ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'} />
                  </div>
                  <span className="font-semibold text-sm line-clamp-1" title={chapter.title}>
                    {chapter.title}
                  </span>
                </div>
                {expandedChapters[chapter.id] ? <ChevronDown size={14} className="shrink-0 text-indigo-500 dark:text-indigo-400" /> : <ChevronRight size={14} className="shrink-0 opacity-50" />}
              </button>

              {expandedChapters[chapter.id] && (
                <div className="ml-4 mt-1 border-l border-indigo-200 dark:border-indigo-500/20 pl-2 space-y-1 animate-fade-in">
                  {chapter.topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => {
                        onSelectTopic(topic, chapter);
                        if (window.innerWidth < 1024) toggleSidebar();
                      }}
                      className={`w-full flex items-start gap-2 p-2 rounded-md text-sm transition-all text-left group ${
                        selectedTopicId === topic.id 
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30 dark:shadow-indigo-900/50' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <FileCode size={14} className={`mt-0.5 shrink-0 transition-colors ${selectedTopicId === topic.id ? 'text-indigo-100' : 'text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'}`} />
                      <span className="line-clamp-2">{topic.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-white/5 text-center text-xs text-slate-500 mt-auto bg-slate-50 dark:bg-slate-900/50">
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-center gap-2 w-full p-2 mb-4 rounded-lg border border-slate-300 dark:border-white/10 hover:bg-white dark:hover:bg-white/5 transition-all text-slate-600 dark:text-slate-300 font-medium"
          >
             {theme === 'dark' ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-indigo-600" />}
             Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>

          <div className="mb-2">
            Current Course: <span className="text-indigo-600 dark:text-indigo-400 font-semibold block sm:inline">{currentSubject.title}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500 font-medium">
            Made by Nanda Kishore
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;