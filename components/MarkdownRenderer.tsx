import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
  content: string;
  isQuiz?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isQuiz = false }) => {
  return (
    <div className="markdown-body font-sans">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({node, ...props}) => <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-600 dark:from-white dark:to-indigo-200 mb-8 pb-4 border-b border-slate-200 dark:border-indigo-500/20 mt-4" {...props} />,
          h2: ({node, ...props}) => (
            <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-12 mb-6 flex items-center gap-3" {...props}>
               {!isQuiz && <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>}
               {props.children}
            </h2>
          ),
          h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-purple-700 dark:text-purple-300 mt-8 mb-4 tracking-wide border-l-4 border-purple-500/30 pl-4" {...props} />,
          p: ({node, ...props}) => <p className="text-slate-700 dark:text-slate-300 leading-9 mb-6 text-[1.05rem] font-normal tracking-wide" {...props} />,
          
          // Conditional styling for Lists based on isQuiz prop
          ul: ({node, ...props}) => isQuiz ? (
            <ul className="space-y-3 mb-8 w-full" {...props} />
          ) : (
            <ul className="list-disc list-outside space-y-3 mb-8 ml-6 text-slate-700 dark:text-slate-300 marker:text-indigo-500 dark:marker:text-indigo-400 marker:text-lg" {...props} />
          ),
          
          ol: ({node, ...props}) => <ol className="list-decimal list-outside space-y-3 mb-8 ml-6 text-slate-700 dark:text-slate-300 marker:text-purple-600 dark:marker:text-purple-400 marker:font-bold" {...props} />,
          
          li: ({node, ...props}) => isQuiz ? (
            <li className="list-none bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-white/5 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all cursor-pointer shadow-sm flex items-start gap-3 font-medium text-slate-700 dark:text-slate-200 group active:scale-[0.99]" {...props}>
                <div className="mt-1 w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-500 group-hover:border-indigo-500 dark:group-hover:border-indigo-400 shrink-0"></div>
                <span>{props.children}</span>
            </li>
          ) : (
            <li className="pl-2" {...props} />
          ),

          code: ({node, className, children, ...props}) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match && !String(children).includes('\n');
            
            return isInline ? (
              <code className="bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-200 px-1.5 py-0.5 rounded text-[0.9em] font-mono border border-indigo-200 dark:border-indigo-500/20 align-middle" {...props}>
                {children}
              </code>
            ) : (
              <div className="my-8 rounded-xl overflow-hidden border border-slate-300 dark:border-white/10 shadow-2xl bg-[#0f111a] group">
                  <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                     </div>
                     <span className="text-xs text-slate-500 font-mono uppercase tracking-wider opacity-50 group-hover:opacity-100 transition-opacity">Example Code</span>
                  </div>
                  <code className="block p-6 text-slate-200 font-mono text-sm overflow-x-auto leading-relaxed" {...props}>
                    {children}
                  </code>
              </div>
            )
          },
          blockquote: ({node, ...props}) => (
              <blockquote className="relative border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-white dark:from-purple-500/10 dark:to-transparent p-6 rounded-r-xl my-10 text-purple-900 dark:text-purple-100 shadow-sm" {...props}>
                  <div className="text-lg italic leading-relaxed opacity-90">{props.children}</div>
              </blockquote>
          ),
          a: ({node, ...props}) => <a className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-200 font-medium underline underline-offset-4 decoration-cyan-500/30 hover:decoration-cyan-300 transition-all" {...props} />,
          table: ({node, ...props}) => (
            <div className="overflow-x-auto my-10 rounded-xl border border-slate-200 dark:border-white/10 shadow-xl bg-white dark:bg-slate-900/40">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10" {...props} />
            </div>
          ),
          th: ({node, ...props}) => <th className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-left text-xs font-bold text-slate-700 dark:text-white uppercase tracking-wider sticky top-0" {...props} />,
          td: ({node, ...props}) => <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/30" {...props} />,
          strong: ({node, ...props}) => <strong className="text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-white/5 px-1 rounded" {...props} />,
          hr: ({node, ...props}) => <hr className="my-12 border-t border-slate-200 dark:border-white/10 w-full" {...props} />,
          
          // Custom interactive styling for Quiz components (Details/Summary)
          details: ({node, ...props}) => (
            <details className="group border border-emerald-200 dark:border-emerald-500/30 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 overflow-hidden mb-8 shadow-sm transition-all duration-300 hover:shadow-md open:ring-1 open:ring-emerald-500/50 mt-2" {...props} />
          ),
          summary: ({node, ...props}) => (
            <summary className="cursor-pointer p-4 font-bold text-emerald-800 dark:text-emerald-300 select-none bg-emerald-100/50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors flex items-center justify-between gap-3 list-none outline-none" {...props}>
                <span className="flex items-center gap-2">
                  <span className="bg-emerald-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-[10px]">?</span>
                  {props.children}
                </span>
                <div className="bg-emerald-200 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-1.5 rounded-lg group-open:rotate-180 transition-transform duration-300">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
            </summary>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;