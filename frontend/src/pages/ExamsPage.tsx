import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Calendar, Award, ChevronRight, Edit3, Trash2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { examsService, type Exam } from '../api/services/examsService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Skeleton } from '../components/ui/Skeleton';

interface ExamCardProps {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_published: boolean;
  term: string;
  onDelete?: () => void;
}

const ExamCard = ({ id, name, start_date, end_date, is_published, term, onDelete }: ExamCardProps) => (
  <div className="glass-dark p-6 rounded-3xl border border-white/5 hover:bg-white/[0.02] transition-all group">
    <div className="flex items-center gap-4">
      <div className="p-4 bg-primary-500/10 rounded-2xl">
        <ClipboardList className="w-6 h-6 text-primary-400" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-white">{name}</h3>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${is_published
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
              {is_published ? 'Published' : 'Draft'}
            </span>
            <Link
              to={`/exams/entry?exam=${id}`}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 text-xs font-medium"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Enter Marks
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete?.();
              }}
              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title="Delete Exam"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {start_date} to {end_date}
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            {term}
          </div>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
    </div>
  </div>
);

export const ExamsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    term: 'TERM_1',
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
      setFormData({ name: '', term: 'TERM_1', start_date: '', end_date: '', grading_system: '' });
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

  const handleScheduleExam = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isModalOpen) {
      setIsModalOpen(true);
      return;
    }
    createExamMutation.mutate(formData);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Examinations</h1>
          <p className="text-slate-400">Schedule exams, record results and track performance.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              placeholder="Search exams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-primary-500 h-12"
            />
          </div>
          <Button onClick={handleScheduleExam} className="gap-2 w-full md:w-auto h-12 shrink-0">
            <Calendar className="w-5 h-5" />
            Schedule Exam
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Upcoming & Recent</h2>
        {examsLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="glass-dark p-6 rounded-3xl border border-white/5 flex items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-48 h-6" />
                  <Skeleton className="w-64 h-4" />
                </div>
              </div>
            ))}
          </div>
        ) : exams.length > 0 ? (
          exams.map((exam: Exam) => (
            <ExamCard key={exam.id} {...exam} onDelete={() => setExamToDelete(exam)} />
          ))
        ) : (
          <div className="py-12 text-center text-slate-500">No exams found.</div>
        )}
      </div>

      <div className="glass-dark p-8 rounded-3xl border border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-white">Performance Analytics</h2>
            <p className="text-sm text-slate-400">Overall school performance trend across subjects.</p>
          </div>
          <select className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500 h-10">
            <option>All Classes</option>
            <option>Grade 6</option>
            <option>Grade 5</option>
          </select>
        </div>

        <div className="h-64 mt-6">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Area type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
              Not enough data for performance charts
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Examination"
        className="max-w-lg bg-slate-900 border-white/10"
      >
        <form onSubmit={handleScheduleExam} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Examination Name</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. End of Term 1 Exams"
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Academic Term</label>
              <select
                value={formData.term}
                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-all"
              >
                <option value="TERM_1">Term 1</option>
                <option value="TERM_2">Term 2</option>
                <option value="TERM_3">Term 3</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Start Date</label>
                <Input
                  required
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">End Date</label>
                <Input
                  required
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Grading System</label>
              <select
                required
                value={formData.grading_system}
                onChange={(e) => setFormData({ ...formData, grading_system: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-all"
              >
                <option value="">Select Grading System...</option>
                {gradingSystems.map((gs: any) => (
                  <option key={gs.id} value={gs.id}>{gs.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-[2]" disabled={createExamMutation.isPending}>
              {createExamMutation.isPending ? 'Scheduling...' : 'Schedule Exam'}
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
        title="Delete Examination"
        description={`Are you sure you want to delete "${examToDelete?.name}"? This will remove all recorded marks for this exam.`}
      />
    </div>
  );
};
