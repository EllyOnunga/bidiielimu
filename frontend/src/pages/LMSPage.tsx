import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, FileText, HelpCircle,
  Sparkles, Plus, Clock, Settings
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AssignmentList } from '../components/lms/AssignmentList';
import { ResourceLibrary } from '../components/lms/ResourceLibrary';
import { QuizInterface } from '../components/lms/QuizInterface';
import { QuizBuilder } from '../components/lms/QuizBuilder';
import { useAuthStore } from '../store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

type TabType = 'assignments' | 'resources' | 'quizzes';

export const LMSPage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<TabType>('assignments');
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);

  const { data: quizzes = [], isLoading: loadingQuizzes } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const res = await client.get('lms/quizzes/');
      return Array.isArray(res.data) ? res.data : (res.data.results || []);
    },
    enabled: activeTab === 'quizzes'
  });

  const tabs = [
    { id: 'assignments', label: 'Assignments', icon: FileText, color: 'text-primary-400' },
    { id: 'resources', label: 'Resource Hub', icon: BookOpen, color: 'text-emerald-400' },
    { id: 'quizzes', label: 'Assessment Center', icon: HelpCircle, color: 'text-amber-400' },
  ] as const;

  return (
    <div className="space-y-8 md:space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-[9px] font-black text-primary-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              LMS Environment v2.0
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
            Learning <span className="text-gradient">Ecosystem</span>
          </h1>
          <p className="text-primary-200/40 text-sm md:text-base font-medium max-w-xl leading-relaxed">
            Access curated materials, submit assessments, and track your progression through a unified digital environment.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white/5 p-1.5 rounded-[24px] border border-white/5 flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-5 py-3 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex-1 sm:flex-none justify-center ${isActive
                  ? 'bg-primary-600 text-white shadow-premium'
                  : 'text-primary-200/40 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'assignments' && <AssignmentList />}
          {activeTab === 'resources' && <ResourceLibrary />}
          {activeTab === 'quizzes' && (
            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Active <span className="text-amber-400">Assessments</span></h2>
                  <p className="text-primary-200/40 text-xs font-bold uppercase tracking-widest mt-1">Timed examinations and knowledge validation modules.</p>
                </div>
                {isTeacher && (
                  <Button 
                    onClick={() => {
                      setEditingQuiz(null);
                      setIsBuilderOpen(true);
                    }} 
                    className="gap-2 rounded-2xl px-6 bg-amber-500 hover:bg-amber-600"
                  >
                    <Plus className="w-5 h-5" />
                    Initialize Assessment
                  </Button>
                )}
              </div>

              {loadingQuizzes ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="glass h-64 rounded-[32px] border border-white/5 animate-pulse" />
                  ))}
                </div>
              ) : quizzes.length === 0 ? (
                <div className="glass p-20 rounded-[40px] border border-dashed border-white/10 text-center opacity-40">
                  <HelpCircle className="w-16 h-16 mx-auto mb-6 text-amber-500/50" />
                  <p className="text-sm font-black uppercase tracking-widest italic">No Assessments Currently Deployed</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {quizzes.map((q: any) => (
                    <div key={q.id} className="premium-card group hover:border-amber-500/30">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform shadow-glow">
                        <HelpCircle className="w-6 h-6" />
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">{q.title}</h3>
                        {isTeacher && (
                          <button 
                            onClick={() => {
                              setEditingQuiz(q);
                              setIsBuilderOpen(true);
                            }}
                            className="p-2 bg-white/5 rounded-lg border border-white/5 text-amber-500/40 hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                            title="Configure Assessment"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-medium text-primary-200/40 mb-8 leading-relaxed line-clamp-2">{q.description || 'Validate your comprehension of the core concepts covered in this module.'}</p>
                      <div className="flex items-center gap-4 mb-8">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span className="text-[10px] font-black text-white uppercase">{q.duration_minutes}m</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
                          <FileText className="w-3 h-3 text-primary-400" />
                          <span className="text-[10px] font-black text-white uppercase">{q.question_count || 0} Questions</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => setActiveQuizId(q.id)}
                        variant="outline"
                        className="w-full border-amber-600/20 text-amber-400 hover:bg-amber-600 hover:text-white rounded-2xl h-12"
                      >
                        Launch Mission
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Quiz Overlay */}
      <AnimatePresence>
        {activeQuizId && (
          <QuizInterface
            quizId={activeQuizId}
            onComplete={() => setActiveQuizId(null)}
          />
        )}
      </AnimatePresence>

      {/* Quiz Builder Modal */}
      <QuizBuilder 
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setEditingQuiz(null);
        }}
        initialData={editingQuiz}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['quizzes'] });
        }}
      />
    </div>
  );
};
