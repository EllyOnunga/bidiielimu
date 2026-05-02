import { useState, useEffect, useCallback } from 'react';
import { Clock, ChevronLeft, ChevronRight, Send, HelpCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Question {
  id: string;
  text: string;
  options: string[];
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  duration_minutes: number;
  questions: Question[];
}

export const QuizInterface = ({ quizId, onComplete }: { quizId: string, onComplete: () => void }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const res = await axios.get(`/api/v1/lms/quizzes/${quizId}/`);
      setQuiz(res.data);
      setTimeLeft(res.data.duration_minutes * 60);
    } catch (err) {
      toast.error('Failed to load quiz');
    }
  };

  const submitQuiz = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading('Marking your quiz...');
    try {
      const res = await axios.post(`/api/v1/lms/quizzes/${quizId}/attempt/`, { answers });
      toast.success(`Quiz completed! Your score: ${res.data.score}/${res.data.max_score}`, { id: toastId, duration: 5000 });
      onComplete();
    } catch (err) {
      toast.error('Failed to submit quiz', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }, [quizId, answers, isSubmitting, onComplete]);

  useEffect(() => {
    if (timeLeft <= 0 && quiz) {
      submitQuiz();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, quiz, submitQuiz]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!quiz) return null;

  const currentQuestion = quiz.questions[currentIdx];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="h-20 bg-white/5 border-b border-white/10 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-white font-black">{quiz.title}</h2>
            <p className="text-xs text-primary-200/40 uppercase tracking-widest font-black">Question {currentIdx + 1} of {quiz.questions.length}</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-3 px-6 py-2 rounded-2xl border font-black transition-colors ${
          timeLeft < 60 ? 'bg-rose-500/10 border-rose-500 text-rose-400 animate-pulse' : 'bg-white/5 border-white/10 text-white'
        }`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8 lg:p-20 flex flex-col items-center">
        <div className="max-w-3xl w-full">
          <div className="glass p-12 rounded-[48px] border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
              <div 
                className="h-full bg-primary-500 transition-all duration-500" 
                style={{ width: `${((currentIdx + 1) / quiz.questions.length) * 100}%` }} 
              />
            </div>

            <div className="space-y-12">
              <h3 className="text-2xl lg:text-3xl font-black text-white leading-tight">
                {currentQuestion.text}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAnswers({ ...answers, [currentQuestion.id]: String(idx) })}
                    className={`w-full p-6 rounded-3xl text-left font-bold transition-all border flex items-center justify-between group ${
                      answers[currentQuestion.id] === String(idx)
                        ? 'bg-primary-500 border-primary-400 text-white shadow-xl'
                        : 'bg-white/5 border-white/10 text-primary-200 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span>{option}</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      answers[currentQuestion.id] === String(idx) ? 'border-white bg-white/20' : 'border-white/10'
                    }`}>
                      {answers[currentQuestion.id] === String(idx) && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-12 flex items-center justify-between w-full px-4">
            <button
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-2 text-white/40 hover:text-white font-bold transition-colors disabled:opacity-0"
            >
              <ChevronLeft className="w-5 h-5" /> Previous
            </button>

            {currentIdx === quiz.questions.length - 1 ? (
              <button
                onClick={submitQuiz}
                disabled={isSubmitting}
                className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-3"
              >
                <Send className="w-5 h-5" />
                Finish Quiz
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx(currentIdx + 1)}
                className="flex items-center gap-2 text-white/40 hover:text-white font-bold transition-colors"
              >
                Next <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Footer */}
      <div className="h-6 bg-white/5 flex">
        {quiz.questions.map((_, idx) => (
          <div 
            key={idx} 
            className={`flex-1 transition-colors ${
              answers[quiz.questions[idx].id] !== undefined ? 'bg-primary-500' : 'bg-transparent'
            }`} 
          />
        ))}
      </div>
    </div>
  );
};
