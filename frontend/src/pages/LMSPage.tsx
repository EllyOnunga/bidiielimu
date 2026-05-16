import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  FileText,
  HelpCircle,
  Plus,
  Clock,
  Settings,
  ChevronRight,
  Zap,
  Target,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { AssignmentList } from "../components/lms/AssignmentList";
import { ResourceLibrary } from "../components/lms/ResourceLibrary";
import { QuizInterface } from "../components/lms/QuizInterface";
import { QuizBuilder } from "../components/lms/QuizBuilder";
import { useAuthStore } from "../store/authStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { lmsService } from "../api/services/lmsService";

type TabType = "assignments" | "resources" | "quizzes";

export const LMSPage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isTeacher =
    user?.role === "TEACHER" ||
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN";

  const [activeTab, setActiveTab] = useState<TabType>("assignments");
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);

  const { data: quizzes = [], isLoading: loadingQuizzes } = useQuery({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const res = await lmsService.getQuizzes();
      return Array.isArray(res) ? res : (res as any).results || [];
    },
    enabled: activeTab === "quizzes",
  });

  const tabs = [
    {
      id: "assignments",
      label: "Operational Tasks",
      icon: FileText,
      color: "text-primary-400",
      glow: "shadow-primary-500/20",
    },
    {
      id: "resources",
      label: "Intelligence Hub",
      icon: BookOpen,
      color: "text-emerald-400",
      glow: "shadow-emerald-500/20",
    },
    {
      id: "quizzes",
      label: "Assessment Matrix",
      icon: HelpCircle,
      color: "text-amber-400",
      glow: "shadow-amber-500/20",
    },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-20"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-none">
            Learning <span className="text-gradient">Ecosystem</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm md:text-base font-medium max-w-xl leading-relaxed">
            Proprietary educational environment for elite knowledge distribution
            and cognitive assessment.
          </p>
        </div>

        <div className="flex p-1.5 bg-white/5 rounded-[28px] border border-white/5 backdrop-blur-md">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-label={tab.label}
                role="tab"
                aria-selected={isActive}
                className={`relative flex items-center gap-3 px-6 py-3.5 rounded-[22px] transition-all duration-500 ${
                  isActive ? "text-white" : "text-muted hover:text-primary"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="lms-tab-bg"
                    className={`absolute inset-0 bg-primary-600 rounded-[22px] shadow-glow-sm ${tab.glow}`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon
                  className={`relative z-10 w-4 h-4 ${isActive ? "text-white" : tab.color}`}
                />
                <span className="relative z-10 text-[10px] font-black uppercase tracking-widest">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {activeTab === "assignments" && <AssignmentList />}
          {activeTab === "resources" && <ResourceLibrary />}
          {activeTab === "quizzes" && (
            <div className="space-y-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-black text-primary uppercase tracking-tight flex items-center gap-3">
                    <Target className="w-6 h-6 text-amber-400" />
                    Active Assessment Matrix
                  </h2>
                  <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-1">
                    Temporal examinations and intelligence validation modules
                  </p>
                </div>
                {isTeacher && (
                  <Button
                    onClick={() => {
                      setEditingQuiz(null);
                      setIsBuilderOpen(true);
                    }}
                    className="gap-3 h-14 px-8 rounded-2xl bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Initialize Node
                    </span>
                  </Button>
                )}
              </div>

              {loadingQuizzes ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-72 bg-white/5 rounded-[40px] animate-pulse"
                    />
                  ))}
                </div>
              ) : quizzes.length === 0 ? (
                <div className="premium-card p-24 border-dashed border-white/10 text-center flex flex-col items-center">
                  <Zap className="w-16 h-16 text-amber-500/20 mb-6" />
                  <p className="text-lg font-black uppercase tracking-[0.3em] opacity-20 italic">
                    No Assessment Signals Detected
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {quizzes.map((q: any) => (
                    <motion.div
                      key={q.id}
                      whileHover={{ y: -5 }}
                      className="premium-card group hover:border-amber-500/30 overflow-hidden"
                    >
                      <div className="flex items-start justify-between mb-8">
                        <div className="w-16 h-16 rounded-[24px] bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500 shadow-glow-sm">
                          <HelpCircle className="w-8 h-8" />
                        </div>
                        {isTeacher && (
                          <button
                            onClick={() => {
                              setEditingQuiz(q);
                              setIsBuilderOpen(true);
                            }}
                            className="p-3 bg-white/5 rounded-xl border border-white/5 text-amber-500/20 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <h3 className="text-xl font-black text-primary uppercase tracking-tight mb-3 leading-none">
                        {q.title}
                      </h3>
                      <p className="text-xs font-medium text-muted mb-8 leading-relaxed line-clamp-2 uppercase tracking-wide opacity-60">
                        {q.description ||
                          "Spectral validation of core conceptual frameworks within this operational module."}
                      </p>

                      <div className="flex items-center gap-4 mb-10">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                            {q.duration_minutes}m
                          </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                          <FileText className="w-3.5 h-3.5 text-primary-400" />
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                            {q.question_count || 0} Nodes
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => setActiveQuizId(q.id)}
                        variant="ghost"
                        className="w-full h-14 rounded-2xl border border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white group-hover:shadow-amber-500/20"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          Launch Ingress Protocol{" "}
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {activeQuizId && (
          <QuizInterface
            quizId={activeQuizId}
            onComplete={() => setActiveQuizId(null)}
          />
        )}
      </AnimatePresence>

      <QuizBuilder
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setEditingQuiz(null);
        }}
        initialData={editingQuiz}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["quizzes"] });
        }}
      />

      {/* Mobile Bottom Tabs for UX scalability */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 border-t border-border z-50 flex justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              className={`flex flex-col items-center p-2 ${isActive ? "text-primary" : "text-muted"}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] mt-0.5">{tab.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default LMSPage;
