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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Classes</h1>
          <p className="text-slate-400 mt-1">
            Navigate: <span className="text-primary-400 font-bold">School</span>
            <ChevronRight className="inline w-3 h-3 mx-1 text-slate-600" />
            <span className="text-slate-300 font-bold">Grade</span>
            <ChevronRight className="inline w-3 h-3 mx-1 text-slate-600" />
            <span className="text-slate-300 font-bold">Stream</span>
            <ChevronRight className="inline w-3 h-3 mx-1 text-slate-600" />
            <span className="text-slate-300 font-bold">Students</span>
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              placeholder="Search grades..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-primary-500 h-12"
            />
          </div>
          <Button onClick={() => setShowGradeModal(true)} className="gap-2 w-full md:w-auto h-12 shrink-0">
            <Plus className="w-5 h-5" /> Add Grade Level
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-dark rounded-3xl border border-white/5 p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="w-32 h-6" />
                  <Skeleton className="w-48 h-4" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 pt-4">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      ) : grades.length === 0 ? (
        <div className="glass-dark rounded-3xl border border-white/5 p-16 text-center">
          <GraduationCap className="w-16 h-16 text-slate-700 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-slate-400 mb-2">No Grade Levels Yet</h3>
          <p className="text-slate-500 text-sm mb-6">Start by creating your first grade level (e.g. Grade 9), then add streams to it.</p>
          <Button onClick={() => setShowGradeModal(true)} className="h-12 px-6">
            Create First Grade
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {grades.map((grade: GradeLevel, gi: number) => (
            <motion.div
              key={grade.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05 }}
              className="glass-dark rounded-3xl border border-white/5 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-600/10 rounded-2xl">
                    <BookOpen className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{grade.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-sm text-slate-400">
                        <span className="text-primary-400 font-bold">{grade.student_count}</span> students total
                        {' · '}
                        <span className="text-slate-400">{grade.streams.length} stream{grade.streams.length !== 1 ? 's' : ''}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openAddStream(grade)}
                    className="gap-1.5 bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                  >
                    <Plus className="w-4 h-4" /> Add Stream
                  </Button>
                  <button 
                    onClick={() => setGradeToDelete(grade)}
                    className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {grade.streams.length === 0 ? (
                  <div className="text-center py-8 text-slate-600">
                    <p className="text-sm">No streams yet. Click "Add Stream" to create one (e.g. East, West, Alpha).</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {grade.streams.map((stream: any) => (
                      <button
                        key={stream.id}
                        onClick={() => navigate(`/classes/${stream.id}`)}
                        className="group text-left p-5 rounded-2xl border border-white/5 hover:border-primary-500/40 bg-slate-900/50 hover:bg-primary-500/5 transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-black text-white">{grade.name} {stream.name}</span>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary-400 transition-colors" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Users className="w-3 h-3" />
                          <span className="font-bold text-slate-300">{stream.student_count}</span> students
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                          <div className="text-[11px] text-slate-600 truncate">
                            Teacher: {stream.teacher_name || 'Unassigned'}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setStreamToDelete({id: stream.id, name: `${grade.name} ${stream.name}`});
                            }}
                            className="p-1 hover:bg-rose-500/10 text-slate-700 hover:text-rose-400 rounded transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </button>
                    ))}

                    <button
                      onClick={() => openAddStream(grade)}
                      className="p-5 rounded-2xl border-2 border-dashed border-slate-800 text-slate-600 hover:border-primary-500/40 hover:text-primary-400 transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-xs font-bold">New Stream</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Subjects Management Section */}
      <div className="pt-8 border-t border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Subjects</h2>
            <p className="text-slate-500 text-sm">Manage the subjects taught in your school.</p>
          </div>
          <Button onClick={() => setShowSubjectModal(true)} variant="outline" className="gap-2 border-primary-500/30 text-primary-400 hover:bg-primary-500/10">
            <Plus className="w-4 h-4" /> Add Subject
          </Button>
        </div>

        {subjects.length === 0 ? (
          <div className="p-8 text-center glass-dark rounded-2xl border border-white/5">
            <BookOpen className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm italic">No subjects added yet. Add subjects to assign them to teachers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {subjects.map((sub: any) => (
              <div key={sub.id} className="glass-dark p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center group relative hover:border-primary-500/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 mb-2 font-bold text-xs">
                  {sub.code || sub.name.substring(0, 3).toUpperCase()}
                </div>
                <span className="text-sm font-bold text-slate-300 truncate w-full">{sub.name}</span>
                
                <button 
                  onClick={() => setSubjectToDelete({id: sub.id, name: sub.name})}
                  className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        title="Add New Subject"
        className="max-w-md bg-slate-900 border-white/10"
      >
        <form onSubmit={handleAddSubject} className="space-y-5 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Subject Name</label>
            <Input
              required autoFocus
              value={subjectData.name}
              onChange={e => setSubjectData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Mathematics, English, Kiswahili"
              className="bg-slate-800/50 border-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Subject Code (Optional)</label>
            <Input
              value={subjectData.code}
              onChange={e => setSubjectData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="e.g. MAT, ENG, BIO"
              className="bg-slate-800/50 border-slate-700 uppercase"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700" onClick={() => setShowSubjectModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-[2]" disabled={createSubjectMutation.isPending}>
              {createSubjectMutation.isPending ? 'Adding...' : 'Add Subject'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!subjectToDelete}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={() => {
          if (subjectToDelete) deleteSubjectMutation.mutate(subjectToDelete.id);
          setSubjectToDelete(null);
        }}
        title="Delete Subject"
        description={`Are you sure you want to delete ${subjectToDelete?.name}? This will remove all its assignments.`}
      />

      <Modal
        isOpen={showStreamModal}
        onClose={() => setShowStreamModal(false)}
        title="Add Stream"
        description={`to ${targetGradeName}`}
        className="max-w-md bg-slate-900 border-white/10"
      >
        <form onSubmit={handleAddStream} className="space-y-5 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Stream Name</label>
            <Input
              required autoFocus
              value={streamName}
              onChange={e => setStreamName(e.target.value)}
              placeholder="e.g. East, West, Alpha, Blue"
              className="bg-slate-800/50 border-slate-700"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700" onClick={() => setShowStreamModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-[2]" disabled={createStreamMutation.isPending}>
              {createStreamMutation.isPending ? 'Adding...' : 'Add Stream'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showGradeModal}
        onClose={() => setShowGradeModal(false)}
        title="Add Grade Level"
        className="max-w-md bg-slate-900 border-white/10"
      >
        <form onSubmit={handleAddGrade} className="space-y-5 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Grade Name</label>
            <Input
              required autoFocus
              value={gradeName}
              onChange={e => setGradeName(e.target.value)}
              placeholder="e.g. Grade 9, Form 3, Class 8"
              className="bg-slate-800/50 border-slate-700"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700" onClick={() => setShowGradeModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-[2]" disabled={createGradeMutation.isPending}>
              {createGradeMutation.isPending ? 'Creating...' : 'Create Grade'}
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
        title="Delete Grade Level"
        description={`Are you sure you want to delete ${gradeToDelete?.name}? This will delete all streams and student assignments under this grade.`}
      />

      <ConfirmModal 
        isOpen={streamToDelete !== null}
        onClose={() => setStreamToDelete(null)}
        onConfirm={() => {
          if (streamToDelete) deleteStreamMutation.mutate(streamToDelete.id);
        }}
        title="Delete Stream"
        description={`Are you sure you want to delete ${streamToDelete?.name}?`}
      />
    </div>
  );
};
