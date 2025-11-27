import React from 'react';
import { BookOpen, Code, Terminal, Briefcase, Monitor, Brain, AlertCircle, Sparkles } from 'lucide-react';
import { SUBJECTS } from '../constants';

interface WelcomeProps {
  onSelectSubject: (subjectId: string) => void;
}

const ICON_MAP: Record<string, React.FC<any>> = {
  Code: Code,
  Terminal: Terminal,
  Monitor: Monitor,
  Brain: Brain,
  Briefcase: Briefcase,
};

const CARD_COLORS: Record<string, string> = {
  'web-design': 'from-blue-500 to-cyan-400',
  'python': 'from-yellow-400 to-orange-500',
  'dotnet': 'from-purple-500 to-indigo-500',
  'ai': 'from-emerald-400 to-teal-500',
  'management': 'from-rose-400 to-pink-500',
};

const Welcome: React.FC<WelcomeProps> = ({ onSelectSubject }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6 animate-fade-in">
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-20 dark:opacity-30 rounded-full animate-pulse-slow"></div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl shadow-2xl relative z-10 transform hover:scale-105 transition-transform duration-500">
           <BookOpen className="w-16 h-16 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 bg-pink-500 p-2 rounded-full shadow-lg z-20 animate-bounce">
           <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>
      
      <h1 className="text-5xl md:text-6xl font-extrabold text-slate-800 dark:text-white mb-6 tracking-tight">
        Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">WebMastery</span>
      </h1>
      <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mb-12 leading-relaxed font-medium dark:font-normal">
        Your advanced AI-powered learning hub. Select a subject below to dive into interactive lessons, real-time quizzes, and personalized notes.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full px-4">
        {SUBJECTS.map((subject, index) => {
          const IconComponent = subject.icon && ICON_MAP[subject.icon] ? ICON_MAP[subject.icon] : AlertCircle;
          const gradient = CARD_COLORS[subject.id] || 'from-slate-500 to-slate-400';
          
          return (
            <div 
              key={subject.id} 
              onClick={() => onSelectSubject(subject.id)}
              className="group relative p-1 rounded-2xl bg-gradient-to-br from-white/40 to-white/10 dark:from-white/10 dark:to-white/5 hover:from-indigo-500/50 hover:to-purple-500/50 transition-all duration-300 cursor-pointer hover:-translate-y-2 shadow-lg hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl"></div>
              
              <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl h-full rounded-xl p-6 border border-slate-200 dark:border-white/10 group-hover:border-transparent relative z-10 flex flex-col items-center text-center">
                <div className={`p-4 rounded-full bg-gradient-to-br ${gradient} mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-slate-800 dark:text-white font-bold text-xl mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 dark:group-hover:from-white dark:group-hover:to-indigo-200 transition-colors">
                  {subject.title}
                </h3>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4 group-hover:text-slate-800 dark:group-hover:text-slate-300">
                  {subject.description}
                </p>

                <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/5 w-full">
                  <span className={`text-xs font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r ${gradient}`}>
                    {subject.chapters.length} Chapters
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Welcome;