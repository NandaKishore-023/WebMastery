import React from 'react';
import { Subject, Chapter, SubTopic } from '../types';
import { Book, FileText, ChevronRight, Layers } from 'lucide-react';

interface SubjectTocProps {
  subject: Subject;
  onSelectTopic: (topic: SubTopic, chapter: Chapter) => void;
}

const SubjectToc: React.FC<SubjectTocProps> = ({ subject, onSelectTopic }) => {
  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-12">
      <div className="mb-10 relative">
        <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
        <div className="pl-6">
           <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
             {subject.title}
           </h1>
           <p className="text-xl text-indigo-600 dark:text-indigo-200 max-w-3xl leading-relaxed opacity-90 dark:opacity-80 font-medium dark:font-normal">
             {subject.description}
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {subject.chapters.map((chapter, index) => (
          <div key={chapter.id} className="group bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-900/20 backdrop-blur-sm">
            <div className="p-5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-800/30 border-b border-slate-100 dark:border-white/5 flex items-center gap-4 group-hover:from-indigo-50 dark:group-hover:from-indigo-900/20 group-hover:to-purple-50 dark:group-hover:to-purple-900/20 transition-all">
              <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl shadow-lg transform group-hover:rotate-3 transition-transform">
                <Book className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-bold text-slate-800 dark:text-white text-lg tracking-wide group-hover:text-indigo-700 dark:group-hover:text-indigo-200 transition-colors">
                {chapter.title}
              </h2>
            </div>
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {chapter.topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => onSelectTopic(topic, chapter)}
                  className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-600/20 dark:hover:to-purple-600/10 text-slate-600 dark:text-slate-300 hover:text-indigo-900 dark:hover:text-white transition-all group/topic border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/20"
                >
                  <div className="bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-lg group-hover/topic:bg-indigo-100 dark:group-hover/topic:bg-indigo-500/20 transition-colors">
                     <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover/topic:text-indigo-600 dark:group-hover/topic:text-indigo-400 transition-colors" />
                  </div>
                  <span className="text-sm font-medium leading-relaxed flex-1">{topic.title}</span>
                  <ChevronRight className="w-4 h-4 text-indigo-400/50 dark:text-indigo-500/50 opacity-0 group-hover/topic:opacity-100 transform translate-x-[-5px] group-hover/topic:translate-x-0 transition-all" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectToc;