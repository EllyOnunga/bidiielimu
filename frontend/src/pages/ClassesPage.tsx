import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Users, ChevronRight, GraduationCap, Trash2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { classesService, type GradeLevel } from '../api/services/classesService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Skeleton } from '../components/ui/Skeleton';

export const ClassesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeName, setGradeName] = useState('');

  const [showStreamModal, setShowStreamModal] = useState(false);
  const [streamName, setStreamName] = useState('');
  const [targetGradeId, setTargetGradeId] = useState<number | null>(null);
  const [targetGradeName, setTargetGradeName] = useState('');

  const [gradeToDelete, setGradeToDelete] = useState<GradeLevel | null>(null);
  const [streamToDelete, setStreamToDelete] = useState<{id: number, name: string} | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['grades', debouncedSearch],
    queryFn: () => classesService.getGrades(debouncedSearch),
    select: (data) => Array.isArray(data) ? data : (data.results || []),
  });

  const createGradeMutation = useMutation({
    mutationFn: classesService.createGrade,
    onSuccess: () => {
      toast.success('Grade level created!');
      setShowGradeModal(false);
      setGradeName('');
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create grade');
    }
  });

  const createStreamMutation = useMutation({
    mutationFn: classesService.createStream,
    onSuccess: () => {
      toast.success(`Stream added to ${targetGradeName}!`);
      setShowStreamModal(false);
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create stream');
    }
  });

  const deleteGradeMutation = useMutation({
    mutationFn: classesService.deleteGrade,
    onSuccess: () => {
      toast.success('Grade deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete grade');
    }
  });

  const deleteStreamMutation = useMutation({
    mutationFn: classesService.deleteStream,
    onSuccess: () => {
      toast.success('Stream deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete stream');
    }
  });

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    createGradeMutation.mutate({ name: gradeName });
  };

  const openAddStream = (grade: GradeLevel) => {
    setTargetGradeId(grade.id);
    setTargetGradeName(grade.name);
    setStreamName('');
    setShowStreamModal(true);
  };

  const handleAddStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetGradeId) {
      createStreamMutation.mutate({ grade_level: targetGradeId, name: streamName });
    }
  };
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectData, setSubjectData] = useState({ name: '', code: '' });
  const [subjectToDelete, setSubjectToDelete] = useState<{id: number, name: string} | null>(null);

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => classesService.getSubjects(),
    select: (data) => Array.isArray(data) ? data : (data.results || []),
  });

  const createSubjectMutation = useMutation({
    mutationFn: classesService.createSubject,
    onSuccess: () => {
      toast.success('Subject added!');
      setShowSubjectModal(false);
      setSubjectData({ name: '', code: '' });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    }
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: classesService.deleteSubject,
    onSuccess: () => {
      toast.success('Subject deleted');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    }
  });

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    createSubjectMutation.mutate(subjectData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">Academic <span className="text-gradient">Architecture</span></h1>
          <p className="text-primary-200/50 text-base font-medium max-w-xl">
            Engineer your school's structural hierarchy from grades to specialized learning streams.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/30" />
            <input
              placeholder="Query grade systems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-white/5 border border-white/5 rounded-2xl text-white text-sm outline-none focus:bg-white/10 transition-all h-14 font-medium"
            />
          </div>
          <Button onClick={() => setShowGradeModal(true)} className="gap-2 w-full md:w-auto h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium shrink-0">
            <Plus className="w-5 h-5" /> Initialize Grade
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-8">
          {[1, 2].map(i => (
            <div key={i} className="glass rounded-[40px] border-white/5 p-8 space-y-6">
              <div className="flex items-center gap-6">
                <Skeleton className="w-16 h-16 rounded-[24px]" />
                <div className="space-y-3">
                  <Skeleton className="w-48 h-8" />
                  <Skeleton className="w-64 h-4" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <Skeleton className="h-32 rounded-[32px]" />
                <Skeleton className="h-32 rounded-[32px]" />
                <Skeleton className="h-32 rounded-[32px]" />
                <Skeleton className="h-32 rounded-[32px]" />
              </div>
            </div>
          ))}
        </div>
      ) : grades.length === 0 ? (
        <div className="glass rounded-[40px] border-white/5 p-24 text-center">
          <GraduationCap className="w-20 h-20 text-primary-200/10 mx-auto mb-8" />
          <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-4">No Academic Records</h3>
          <p className="text-primary-200/40 text-sm font-medium mb-10 max-w-md mx-auto">Establish your school's foundation by defining the primary grade levels and their operational streams.</p>
          <Button onClick={() => setShowGradeModal(true)} className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium">
            Launch First Grade System
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {grades.map((grade: GradeLevel, gi: number) => (
            <motion.div
              key={grade.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: gi * 0.1 }}
              className="glass rounded-[40px] border-white/5 overflow-hidden group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-8 gap-6 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary-600/20 rounded-[24px] flex items-center justify-center border border-primary-500/20 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-8 h-8 text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">{grade.name}</h2>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                        <Users className="w-3.5 h-3.5 text-primary-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{grade.student_count} Enrolled</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                        <Users className="w-3.5 h-3.5 text-accent-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{grade.streams.length} Operations</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => openAddStream(grade)}
                    className="gap-2 h-12 px-6 bg-white/5 border-white/5 text-primary-200/60 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Stream
                  </Button>
                  <button 
                    onClick={() => setGradeToDelete(grade)}
                    className="p-3.5 hover:bg-rose-500/10 text-primary-200/20 hover:text-rose-400 rounded-2xl transition-all border border-transparent hover:border-rose-500/20"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-8">
                {grade.streams.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-[32px]">
                    <p className="text-xs font-black text-primary-200/20 uppercase tracking-[0.3em]">No Active Streams Defined</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {grade.streams.map((stream: any) => (
                      <button
                        key={stream.id}
                        onClick={() => navigate(`/classes/${stream.id}`)}
                        className="group/stream text-left p-6 rounded-[32px] border border-white/5 hover:border-primary-500/40 bg-white/[0.03] hover:bg-primary-500/5 transition-all relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-base font-black text-white uppercase tracking-tight">{grade.name} {stream.name}</span>
                          <ChevronRight className="w-4 h-4 text-primary-200/20 group-hover/stream:text-primary-400 group-hover/stream:translate-x-1 transition-all" />
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                          <span className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest">
                            <span className="text-white">{stream.student_count}</span> Operational Units
                          </span>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <div className="text-[9px] font-black text-primary-200/30 uppercase tracking-widest truncate max-w-[120px]">
                            Lead: {stream.teacher_name || 'Unassigned'}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setStreamToDelete({id: stream.id, name: `${grade.name} ${stream.name}`});
                            }}
                            className="p-2 hover:bg-rose-500/10 text-primary-200/20 hover:text-rose-400 rounded-xl transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </button>
                    ))}

                    <button
                      onClick={() => openAddStream(grade)}
                      className="p-6 rounded-[32px] border-4 border-dashed border-white/5 text-primary-200/20 hover:border-primary-500/40 hover:text-primary-400 transition-all flex flex-col items-center justify-center gap-3 group/add"
                    >
                      <Plus className="w-8 h-8 group-hover/add:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deploy Stream</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Subjects Management Section */}
      <div className="pt-16 border-t border-white/5 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">Intelligence <span className="text-gradient">Domains</span></h2>
            <p className="text-primary-200/30 text-xs font-black uppercase tracking-[0.2em] mt-1">Manage the core curriculum infrastructure.</p>
          </div>
          <Button onClick={() => setShowSubjectModal(true)} variant="outline" className="gap-2 h-12 px-6 bg-primary-500/5 border-primary-500/20 text-primary-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary-500/10 transition-all">
            <Plus className="w-4 h-4" /> Add Knowledge Domain
          </Button>
        </div>

        {subjects.length === 0 ? (
          <div className="p-16 text-center glass rounded-[40px] border border-dashed border-white/5 opacity-30">
            <BookOpen className="w-16 h-16 text-white/10 mx-auto mb-6" />
            <p className="text-sm font-black uppercase tracking-widest">No Intelligence Domains Established</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {subjects.map((sub: any, idx: number) => (
              <motion.div 
                key={sub.id} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="glass p-6 rounded-[32px] border-white/5 flex flex-col items-center justify-center text-center group relative hover:border-primary-500/40 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400 mb-4 font-black text-xs border border-primary-500/10 group-hover:scale-110 transition-transform">
                  {sub.code || sub.name.substring(0, 3).toUpperCase()}
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest truncate w-full">{sub.name}</span>
                
                <button 
                  onClick={() => setSubjectToDelete({id: sub.id, name: sub.name})}
                  className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-primary-200/20 hover:text-rose-400 rounded-xl transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        title="New Intelligence Domain"
        className="max-w-md glass border-white/10"
      >
        <form onSubmit={handleAddSubject} className="space-y-8 mt-6 pb-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Domain Title</label>
              <Input
                required autoFocus
                value={subjectData.name}
                onChange={e => setSubjectData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Quantum Computing"
                className="bg-white/5 border-white/5 rounded-xl h-14"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Registry Code (Short)</label>
              <Input
                value={subjectData.code}
                onChange={e => setSubjectData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="e.g. QNT"
                className="bg-white/5 border-white/5 rounded-xl h-14 uppercase"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Button type="button" variant="outline" className="flex-1 h-14 bg-white/5 border-white/5 text-primary-200/50 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={() => setShowSubjectModal(false)}>
              Discard
            </Button>
            <Button type="submit" className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium" disabled={createSubjectMutation.isPending}>
              {createSubjectMutation.isPending ? 'Syncing...' : 'Establish Domain'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showStreamModal}
        onClose={() => setShowStreamModal(false)}
        title="Deploy Learning Stream"
        description={`Integration targeted for ${targetGradeName}`}
        className="max-w-md glass border-white/10"
      >
        <form onSubmit={handleAddStream} className="space-y-8 mt-6 pb-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Stream Identifier</label>
            <Input
              required autoFocus
              value={streamName}
              onChange={e => setStreamName(e.target.value)}
              placeholder="e.g. Alpha-X, Omega"
              className="bg-white/5 border-white/5 rounded-xl h-14"
            />
          </div>
          <div className="flex gap-4">
            <Button type="button" variant="outline" className="flex-1 h-14 bg-white/5 border-white/5 text-primary-200/50 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={() => setShowStreamModal(false)}>
              Discard
            </Button>
            <Button type="submit" className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium" disabled={createStreamMutation.isPending}>
              {createStreamMutation.isPending ? 'Deploying...' : 'Execute Deployment'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showGradeModal}
        onClose={() => setShowGradeModal(false)}
        title="Initialize Grade System"
        className="max-w-md glass border-white/10"
      >
        <form onSubmit={handleAddGrade} className="space-y-8 mt-6 pb-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">System Level Title</label>
            <Input
              required autoFocus
              value={gradeName}
              onChange={e => setGradeName(e.target.value)}
              placeholder="e.g. Senior Phase, Level 9"
              className="bg-white/5 border-white/5 rounded-xl h-14"
            />
          </div>
          <div className="flex gap-4">
            <Button type="button" variant="outline" className="flex-1 h-14 bg-white/5 border-white/5 text-primary-200/50 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={() => setShowGradeModal(false)}>
              Discard
            </Button>
            <Button type="submit" className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium" disabled={createGradeMutation.isPending}>
              {createGradeMutation.isPending ? 'Initializing...' : 'Confirm System'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={gradeToDelete !== null}
        onClose={() => setGradeToDelete(null)}
        onConfirm={() => {
          if (gradeToDelete) deleteGradeMutation.mutate(gradeToDelete.id);
        }}
        title="System Decommission"
        description={`This will permanently purge ${gradeToDelete?.name} and all associated stream operational units from the network.`}
      />

      <ConfirmModal 
        isOpen={streamToDelete !== null}
        onClose={() => setStreamToDelete(null)}
        onConfirm={() => {
          if (streamToDelete) deleteStreamMutation.mutate(streamToDelete.id);
        }}
        title="Stream Termination"
        description={`Execute termination protocol for ${streamToDelete?.name}?`}
      />

      <ConfirmModal 
        isOpen={subjectToDelete !== null}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={() => {
          if (subjectToDelete) deleteSubjectMutation.mutate(subjectToDelete.id);
          setSubjectToDelete(null);
        }}
        title="Domain Deletion"
        description={`Permanently purge ${subjectToDelete?.name} from the academic intelligence matrix?`}
      />
    </motion.div>
  );
};
