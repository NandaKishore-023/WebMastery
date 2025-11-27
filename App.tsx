
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopicContent from './components/TopicContent';
import Welcome from './components/Welcome';
import SubjectToc from './components/SubjectToc';
import { SUBJECTS } from './constants';
import { Chapter, SubTopic, Subject } from './types';
import { Menu, GraduationCap } from 'lucide-react';

type ViewMode = 'welcome' | 'subject' | 'topic';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('welcome');
  const [currentSubject, setCurrentSubject] = useState<Subject>(SUBJECTS[0]);
  const [selectedTopic, setSelectedTopic] = useState<SubTopic | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Initialize Theme
  useEffect(() => {
    // Check system preference or default to dark
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
       // Optional: Default to light if preferred, but for this app dark is default
       // setTheme('light'); 
    }
    document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  };

  const handleSelectSubject = (subjectId: string) => {
    const subject = SUBJECTS.find(s => s.id === subjectId);
    if (subject) {
      setCurrentSubject(subject);
      setCurrentView('subject'); 
      setSelectedTopic(null);
      setSelectedChapter(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectTopic = (topic: SubTopic, chapter: Chapter) => {
    setSelectedTopic(topic);
    setSelectedChapter(chapter);
    setCurrentView('topic');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setCurrentView('welcome');
    setSelectedTopic(null);
    setSelectedChapter(null);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'welcome':
        return <Welcome onSelectSubject={handleSelectSubject} />;
      case 'subject':
        return <SubjectToc subject={currentSubject} onSelectTopic={handleSelectTopic} />;
      case 'topic':
        if (selectedTopic && selectedChapter) {
          return (
            <TopicContent 
              topic={selectedTopic} 
              chapter={selectedChapter}
              subject={currentSubject}
            />
          );
        }
        return <SubjectToc subject={currentSubject} onSelectTopic={handleSelectTopic} />;
      default:
        return <Welcome onSelectSubject={handleSelectSubject} />;
    }
  };

  return (
    <div className={`flex min-h-screen font-sans transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-200' 
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-slate-800'
    }`}>
      <Sidebar 
        subjects={SUBJECTS}
        currentSubject={currentSubject}
        onSelectSubject={handleSelectSubject}
        onSelectTopic={handleSelectTopic} 
        onGoHome={handleGoHome}
        selectedTopicId={selectedTopic?.id || null}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Background ambient light */}
        <div className="absolute top-0 left-0 w-full h-96 bg-indigo-600/10 dark:bg-indigo-600/10 blur-[100px] pointer-events-none rounded-full transform -translate-y-1/2"></div>

        {/* Mobile Header */}
        <header className="lg:hidden p-4 border-b border-slate-200 dark:border-white/10 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur z-20 justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white"
            >
              <Menu size={24} />
            </button>
            <button 
              onClick={handleGoHome}
              className="ml-3 flex items-center gap-2 group"
            >
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-lg shadow-md group-hover:shadow-indigo-500/30 transition-all">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                WebMastery
              </span>
            </button>
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30 truncate max-w-[120px] sm:max-w-none">
            {currentSubject.title}
          </span>
        </header>

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 relative scroll-smooth flex flex-col z-10">
          <div className="flex-1">
            {renderContent()}
          </div>
          
          <footer className="mt-12 py-8 border-t border-slate-200 dark:border-white/5 text-center">
            <p className="text-slate-500 dark:text-slate-500 text-sm">
              Made by <span className="text-indigo-600 dark:text-indigo-400 font-medium">Nanda Kishore</span>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;
