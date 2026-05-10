import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Calendar, Award, ChevronRight, Edit3, Trash2, Search, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { examsService, type Exam } from '../api/services/examsService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Skeleton } from '../components/ui/Skeleton';
import { motion } from 'framer-motion';
interface ExamCardProps {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_published: boolean;
  term: string;
  onDelete?: () => void;
  onRank?: () => void;
}

const ExamCard = ({ id, name, start_date, end_date, is_published, term, onDelete, onRank }: ExamCardProps) => (
  <div className="premium-card group hover:bg-white/[0.03]">
    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-primary-600/10 flex items-center justify-center text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-glow shrink-0">
        <ClipboardList className="w-8 h-8" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <h3 className="text-xl font-black text-white uppercase tracking-tight truncate">{name}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${is_published
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
              {is_published ? 'Live' : 'Draft'}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onRank?.();
                }}
                className="p-2.5 bg-primary-500/10 hover:bg-primary-600 hover:text-white text-primary-400 rounded-xl transition-all"
                title="Compute Rankings"
              >
                <Award className="w-4 h-4" />
              </button>
              <Link
                to={`/exams/entry?exam=${id}`}
                className="p-2.5 bg-white/5 hover:bg-white/20 text-white rounded-xl transition-all"
              >
                <Edit3 className="w-4 h-4" />
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onDelete?.();
                }}
                className="p-2.5 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-primary-200/20 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-primary-500" />
            {start_date} — {end_date}
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            {term.replace('_', ' ')}
          </div>
        </div>
      </div>
      <ChevronRight className="w-6 h-6 text-primary-200/10 group-hover:text-primary-400 group-hover:translate-x-2 transition-all hidden sm:block" />
    </div>
  </div>
);

export const ExamsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    term: 'TERM_1',
    exam_type: 'END_TERM',
    start_date: '',
    end_date: '',
    grading_system: '',
  });
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');


  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ['exams', debouncedSearch],
    queryFn: () => examsService.getExams(debouncedSearch),
    select: (data) => Array.isArray(data) ? data : (data.results || []),
  });

  const { data: gradingSystems = [] } = useQuery({
    queryKey: ['grading-systems'],
    queryFn: () => examsService.getGradingSystems(),
    select: (data) => Array.isArray(data) ? data : (data.results || []),
  });

  const { data: chartData = [] } = useQuery({
    queryKey: ['exams_analytics'],
    queryFn: examsService.getAnalytics,
  });

  const createExamMutation = useMutation({
    mutationFn: examsService.createExam,
    onSuccess: () => {
      toast.success('Examination scheduled successfully!');
      setIsModalOpen(false);
      setFormData({ name: '', term: 'TERM_1', exam_type: 'END_TERM', start_date: '', end_date: '', grading_system: '' });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exams_analytics'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to schedule exam');
    }
  });

  const deleteExamMutation = useMutation({
    mutationFn: examsService.deleteExam,
    onSuccess: () => {
      toast.success('Examination deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete examination');
    }
  });

  const computeRanksMutation = useMutation({
    mutationFn: (id: number) => examsService.computeRanks(id),
    onSuccess: (data) => {
      toast.success(data.detail || 'Rankings computed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to compute rankings');
    }
  });

  const handleScheduleExam = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isModalOpen) {
      setIsModalOpen(true);
      return;
    }
    createExamMutation.mutate(formData);
  };

  return (
    <div className="space-y-8 md:space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">Assessment <span className="text-gradient">Control</span></h1>
          <p className="text-primary-200/40 text-sm md:text-base font-medium max-w-xl">Comprehensive evaluation framework and performance analytics for all modules.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Link to="/grading" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full gap-2">
              <Layers className="w-4 h-4" /> Systems
            </Button>
          </Link>
          <Button onClick={handleScheduleExam} className="flex-1 sm:flex-none gap-2">
            <Calendar className="w-4 h-4" /> Schedule Exam
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">Operational Queue</h2>
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary-200/20" />
              <Input
                placeholder="Filter exams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 text-[10px] bg-white/5 border-white/5"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {examsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="premium-card flex items-center gap-6">
                  <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="w-48 h-4" />
                    <Skeleton className="w-32 h-2" />
                  </div>
                </div>
              ))
            ) : exams.length > 0 ? (
              exams.map((exam: Exam) => (
                <ExamCard
                  key={exam.id}
                  {...exam}
                  onDelete={() => setExamToDelete(exam)}
                  onRank={() => computeRanksMutation.mutate(exam.id)}
                />
              ))
            ) : (
              <div className="premium-card text-center py-20 text-primary-200/10 italic text-[10px] font-black uppercase tracking-widest">
                No active assessment protocols found.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">Performance Matrix</h2>
          <div className="premium-card">
            <div className="h-64 md:h-80 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.1)" fontSize={9} tickLine={false} axisLine={false} fontWeight="800" />
                    <YAxis stroke="rgba(255, 255, 255, 0.1)" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} fontWeight="800" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#14b8a6', fontWeight: '900', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-primary-200/10 border-2 border-dashed border-white/5 rounded-[32px]">
                  <Layers className="w-10 h-10 mb-4 opacity-10" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Insufficient Data</p>
                </div>
              )}
            </div>
            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Average Proficiency</span>
                <span className="text-xl font-black text-white">74.2%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '74.2%' }}
                  className="h-full bg-gradient-to-r from-primary-600 to-indigo-600 shadow-glow"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assessment Initialization"
        className="max-w-xl glass border-white/10 !rounded-[32px]"
      >
        <form onSubmit={handleScheduleExam} className="space-y-8 mt-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Protocol Name</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. End of Phase 01 Evaluation"
                className="h-12 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Academic Cycle</label>
                <select
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  className="flex h-12 w-full rounded-xl border border-white/5 bg-white/5 px-4 text-sm text-white outline-none focus:border-primary-500 transition-all"
                >
                  <option value="TERM_1">Term 01</option>
                  <option value="TERM_2">Term 02</option>
                  <option value="TERM_3">Term 03</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Assessment Class</label>
                <select
                  value={formData.exam_type}
                  onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                  className="flex h-12 w-full rounded-xl border border-white/5 bg-white/5 px-4 text-sm text-white outline-none focus:border-primary-500 transition-all"
                >
                  <option value="CAT">CAT</option>
                  <option value="MID_TERM">Mid-Term</option>
                  <option value="END_TERM">End-Term</option>
                  <option value="MOCK">Mock</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Start Phase</label>
                <Input
                  required
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="h-12 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">End Phase</label>
                <Input
                  required
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="h-12 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Grading Matrix</label>
              <select
                required
                value={formData.grading_system}
                onChange={(e) => setFormData({ ...formData, grading_system: e.target.value })}
                className="flex h-12 w-full rounded-xl border border-white/5 bg-white/5 px-4 text-sm text-white outline-none focus:border-primary-500 transition-all"
              >
                <option value="">Select Protocol System...</option>
                {gradingSystems.map((gs: any) => (
                  <option key={gs.id} value={gs.id}>{gs.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4 pb-2">
            <Button type="button" variant="ghost" className="flex-1 h-12 text-[10px]" onClick={() => setIsModalOpen(false)}>
              Discard
            </Button>
            <Button type="submit" className="flex-[2] h-12 text-[10px]" disabled={createExamMutation.isPending}>
              {createExamMutation.isPending ? 'Synchronizing...' : 'Initialize Assessment'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={examToDelete !== null}
        onClose={() => setExamToDelete(null)}
        onConfirm={() => {
          if (examToDelete) deleteExamMutation.mutate(examToDelete.id);
        }}
        title="Protocol Termination"
        description={`Execute permanent purge of "${examToDelete?.name}"? All associated data will be terminated.`}
      />
    </div>
  );
};
