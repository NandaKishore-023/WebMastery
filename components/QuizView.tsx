
import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
}

interface QuizViewProps {
  rawContent: string;
}

const QuizView: React.FC<QuizViewProps> = ({ rawContent }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [parseError, setParseError] = useState(false);

  useEffect(() => {
    try {
      const parsedQuestions: QuizQuestion[] = [];
      const blocks = rawContent.split('---').map(s => s.trim()).filter(s => s.length > 0);

      blocks.forEach((block, index) => {
        // Extract Question
        const questionMatch = block.match(/\*\*Q\d*\.\s*(.*?)\*\*/s) || block.match(/\*\*(.*?)\*\*/s);
        const questionText = questionMatch ? questionMatch[1].trim() : "Question text not found";

        // Extract Options
        const options: { id: string; text: string }[] = [];
        const optionRegex = /-\s*([A-Z])\.\s*(.*)/g;
        let match;
        while ((match = optionRegex.exec(block)) !== null) {
          options.push({ id: match[1], text: match[2].trim() });
        }

        // Extract Answer
        const answerMatch = block.match(/Correct Answer:\s*([A-Z])/i);
        const correctAnswer = answerMatch ? answerMatch[1].toUpperCase() : '';

        if (options.length > 0 && correctAnswer) {
          parsedQuestions.push({
            id: index,
            question: questionText,
            options,
            correctAnswer
          });
        }
      });

      if (parsedQuestions.length === 0) {
        // Fallback for when regex fails (try simple line splitting)
        setParseError(true);
      } else {
        setQuestions(parsedQuestions);
        setParseError(false);
      }
    } catch (e) {
      console.error("Quiz Parsing Error", e);
      setParseError(true);
    }
  }, [rawContent]);

  if (parseError) {
    return <div className="text-red-500">Error loading quiz format. Please regenerate.</div>;
  }

  return (
    <div className="space-y-8">
      {questions.map((q) => (
        <QuizItem key={q.id} question={q} />
      ))}
    </div>
  );
};

interface QuizItemProps {
  question: QuizQuestion;
}

const QuizItem: React.FC<QuizItemProps> = ({ question }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [status, setStatus] = useState<'neutral' | 'correct' | 'wrong'>('neutral');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (status === 'wrong') {
      timer = setTimeout(() => {
        setStatus('neutral');
        setSelectedOption(null);
      }, 1500); // Reset after 1.5 seconds
    }
    return () => clearTimeout(timer);
  }, [status]);

  const handleSelect = (optionId: string) => {
    if (status === 'correct') return; // Lock if already correct

    setSelectedOption(optionId);
    if (optionId === question.correctAnswer) {
      setStatus('correct');
    } else {
      setStatus('wrong');
    }
  };

  return (
    <div className="bg-white/60 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
        {question.id + 1}. {question.question}
      </h3>

      <div className="space-y-3">
        {question.options.map((opt) => {
          let stateStyles = "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5";
          
          if (selectedOption === opt.id) {
             if (status === 'correct') {
               stateStyles = "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-300 ring-1 ring-green-500";
             } else if (status === 'wrong') {
               stateStyles = "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-300 ring-1 ring-red-500";
             }
          } else if (status === 'correct' && opt.id === question.correctAnswer) {
             // Optional: Highlight correct answer even if not selected (not requested, but good UX)
             // But user asked to lock it. Let's keep it simple.
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={status === 'correct' || (status === 'wrong' && selectedOption === opt.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center justify-between group ${stateStyles} ${status === 'neutral' ? 'hover:border-indigo-400 dark:hover:border-indigo-500' : ''}`}
            >
              <div className="flex items-center gap-3">
                 <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                   selectedOption === opt.id && status !== 'neutral'
                    ? 'border-transparent bg-white/20' 
                    : 'border-slate-300 text-slate-500'
                 }`}>
                   {opt.id}
                 </span>
                 <span className="font-medium">{opt.text}</span>
              </div>

              {selectedOption === opt.id && status === 'correct' && (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400 animate-bounce" />
              )}
              {selectedOption === opt.id && status === 'wrong' && (
                <X className="w-5 h-5 text-red-600 dark:text-red-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      <div className="h-6 mt-2 flex items-center justify-end">
        {status === 'correct' && (
           <span className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1 animate-fade-in">
             Correct! Great job.
           </span>
        )}
        {status === 'wrong' && (
           <span className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1 animate-fade-in">
             <AlertCircle className="w-4 h-4" /> Wrong! Try again...
           </span>
        )}
      </div>
    </div>
  );
};

export default QuizView;
