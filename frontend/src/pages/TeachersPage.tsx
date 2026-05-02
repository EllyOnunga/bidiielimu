import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Mail, Phone, Trash2, Plus, BookOpen, X, Settings, UserPlus, Filter, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { teachersService, type Teacher } from '../api/services/teachersService';
import { classesService } from '../api/services/classesService';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';

export const TeachersPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    specialization: '',
    joining_date: new Date().toISOString().split('T')[0],
    email: '',
    password: '',
  });
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<number | null>(null);
  const [assignmentTeacher, setAssignmentTeacher] = useState<Teacher | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: teachersData = [], isLoading: loading } = useQuery({
    queryKey: ['teachers', debouncedSearch],
    queryFn: () => teachersService.getAll(debouncedSearch),
    select: (data) => Array.isArray(data) ? data : (data.results || []),
  });

  const createTeacherMutation = useMutation({
    mutationFn: (data: any) => teachersService.create(data),
    onSuccess: () => {
      toast.success('Teacher registered successfully!');
      setIsModalOpen(false);
      setFormData({
        employee_id: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        specialization: '',
        joining_date: new Date().toISOString().split('T')[0],
        email: '',
        password: '',
      });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to register teacher');
    }
  });

  const updateTeacherMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => teachersService.update(id, data),
    onSuccess: () => {
      toast.success('Teacher updated successfully!');
      setIsModalOpen(false);
      setEditingTeacher(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update teacher');
    }
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: (id: number) => teachersService.delete(id),
    onSuccess: () => {
      toast.success('Teacher deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete teacher');
    }
  });

  const resetForm = () => {
    setFormData({
      employee_id: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      specialization: '',
      joining_date: new Date().toISOString().split('T')[0],
      email: '',
      password: '',
    });
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      employee_id: teacher.employee_id,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      phone_number: teacher.phone_number,
      specialization: teacher.specialization,
      joining_date: teacher.joining_date || new Date().toISOString().split('T')[0],
      email: teacher.email || '',
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleAddTeacher = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isModalOpen) {
      setEditingTeacher(null);
      resetForm();
      setIsModalOpen(true);
      return;
    }

    if (editingTeacher) {
      const { email, password, ...updateData } = formData;
      const finalData: any = { ...updateData };
      if (email && email.trim() !== '' && email !== editingTeacher.email) finalData.email = email;
      if (password && password.trim() !== '') finalData.password = password;
      updateTeacherMutation.mutate({ id: editingTeacher.id, data: finalData });
    } else {
      createTeacherMutation.mutate(formData);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return toast.error('Please select a CSV file first.');

    const formDataObj = new FormData();
    formDataObj.append('file', csvFile);

    setIsUploading(true);
    try {
      const res = await teachersService.bulkUpload(formDataObj);
      toast.success(res.detail);
      setIsBulkModalOpen(false);
      setCsvFile(null);
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to bulk upload teachers');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-12"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">Faculty <span className="text-gradient">Network</span></h1>
          <p className="text-primary-200/50 text-base font-medium">Coordinate educators and cross-functional assignments.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button variant="secondary" onClick={() => setIsBulkModalOpen(true)} className="gap-2 rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-xs">
            <UploadCloud className="w-4 h-4" /> Import CSV
          </Button>
          <Button onClick={handleAddTeacher} className="gap-2 rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-xs shadow-premium">
            <UserPlus className="w-5 h-5" />
            Register Teacher
          </Button>
        </div>
      </div>

      <div className="glass rounded-[40px] overflow-hidden border-white/5">
        <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative w-full md:w-[450px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/30" />
            <Input
              type="text"
              placeholder="Query name, ID, or specialization..."
              className="pl-11 h-12 bg-white/5 border-white/5 rounded-2xl focus:bg-white/10 transition-all font-medium text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 h-12 px-6 bg-white/5 border-white/5 text-primary-200/60 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all">
            <Filter className="w-4 h-4" /> Advanced Filters
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-white/5">
              <TableRow className="border-0 hover:bg-transparent h-16">
                <TableHead className="text-primary-200/40 text-[10px] font-black uppercase tracking-widest pl-8">Educator</TableHead>
                <TableHead className="text-primary-200/40 text-[10px] font-black uppercase tracking-widest">Communication Channel</TableHead>
                <TableHead className="text-primary-200/40 text-[10px] font-black uppercase tracking-widest">Core Domain</TableHead>
                <TableHead className="text-primary-200/40 text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-right text-primary-200/40 text-[10px] font-black uppercase tracking-widest pr-8">Operations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-white/5">
              {loading ? (
                <TableSkeleton rows={10} cols={5} />
              ) : teachersData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-32 opacity-20">
                    <UserPlus className="w-20 h-20 mx-auto mb-4" />
                    <p className="text-lg font-black uppercase tracking-widest">No Faculty Records</p>
                  </TableCell>
                </TableRow>
              ) : (
                teachersData.map((teacher: Teacher, idx: number) => (
                  <motion.tr
                    key={teacher.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group transition-all h-20 border-white/5 hover:bg-white/5"
                  >
                    <TableCell className="pl-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-600/20 flex items-center justify-center text-primary-400 font-black text-xs border border-primary-500/20 group-hover:scale-110 transition-transform">
                          {teacher.first_name[0]}{teacher.last_name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-black text-white uppercase tracking-tight">{teacher.first_name} {teacher.last_name}</div>
                          <div className="text-[10px] font-black text-primary-200/30 uppercase tracking-tighter">{teacher.employee_id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-black text-primary-200/50 uppercase tracking-tight">
                          <Mail className="w-3 h-3 text-primary-500" />
                          {teacher.email || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-primary-200/30 uppercase tracking-tight">
                          <Phone className="w-3 h-3" />
                          {teacher.phone_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-3 py-1.5 rounded-xl bg-white/5 text-primary-200/60 text-[10px] font-black uppercase tracking-widest border border-white/5">
                        {teacher.specialization || 'Generalist'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${teacher.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                        {teacher.is_active ? 'Operational' : 'Standby'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setAssignmentTeacher(teacher);
                            setIsAssignmentModalOpen(true);
                          }}
                          className="p-3 hover:bg-white/10 text-primary-200/40 hover:text-white rounded-xl transition-all group-hover:scale-110"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditTeacher(teacher)}
                          className="p-3 hover:bg-white/10 text-primary-200/40 hover:text-white rounded-xl transition-all group-hover:scale-110"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTeacherToDelete(teacher.id)}
                          className="p-3 hover:bg-rose-500/10 text-primary-200/40 hover:text-rose-400 rounded-xl transition-all group-hover:scale-110"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTeacher(null);
        }}
        title={editingTeacher ? "Operational Identity Modification" : "New Faculty Induction"}
        className="max-w-3xl glass border-white/10"
      >
        <form onSubmit={handleAddTeacher} className="space-y-10 mt-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <Plus className="w-4 h-4 text-primary-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Deployment Identity</h3>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Identifier (Employee ID)</label>
                <Input required value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} placeholder="EMP-XXX" className="bg-white/5 border-white/5 rounded-xl h-12" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">First Name</label>
                  <Input required value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="bg-white/5 border-white/5 rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Last Name</label>
                  <Input required value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="bg-white/5 border-white/5 rounded-xl h-12" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <Settings className="w-4 h-4 text-accent-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Operational Scope</h3>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Domain Specialization</label>
                <Input required value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} placeholder="e.g. Theoretical Physics" className="bg-white/5 border-white/5 rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Induction Date</label>
                <Input required type="date" value={formData.joining_date} onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })} className="bg-white/5 border-white/5 rounded-xl h-12 text-white" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <Phone className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Transmission Channel</h3>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Secure Line (Phone)</label>
                <Input required type="tel" value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} className="bg-white/5 border-white/5 rounded-xl h-12" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <Mail className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Access Credentials</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">System Email</label>
                  <Input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-white/5 border-white/5 rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Encryption Key (Password)</label>
                  <Input required={!editingTeacher} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={editingTeacher ? "Current" : "Min 8 chars"} className="bg-white/5 border-white/5 rounded-xl h-12" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" className="flex-1 h-14 bg-white/5 border-white/5 text-primary-200/50 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={() => setIsModalOpen(false)}>
              Discard
            </Button>
            <Button type="submit" className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium" disabled={createTeacherMutation.isPending || updateTeacherMutation.isPending}>
              {createTeacherMutation.isPending || updateTeacherMutation.isPending
                ? 'Syncing...'
                : (editingTeacher ? 'Commit Changes' : 'Execute Induction')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Mass Protocol Induction"
        description="Ingest multiple faculty records via CSV data stream."
        className="max-w-xl glass border-white/10"
      >
        <div className="mt-8 space-y-8">
          <div
            className={`border-4 border-dashed rounded-[32px] p-12 text-center transition-all cursor-pointer ${csvFile ? 'border-primary-500 bg-primary-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'
              }`}
            onClick={() => document.getElementById('teacher-csv-input')?.click()}
          >
            <input id="teacher-csv-input" type="file" accept=".csv" className="hidden" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
            <UploadCloud className={`w-16 h-16 mx-auto mb-6 ${csvFile ? 'text-primary-400' : 'text-primary-200/20'}`} />
            {csvFile ? (
              <div className="animate-in fade-in zoom-in duration-300">
                <p className="text-white font-black uppercase tracking-widest text-sm mb-2">{csvFile.name}</p>
                <p className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest">{(csvFile.size / 1024).toFixed(1)} KB Payload</p>
              </div>
            ) : (
              <div>
                <p className="text-white font-black uppercase tracking-widest text-sm mb-2">Drop Protocol File</p>
                <p className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest">CSV Data Only</p>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-2 pb-4">
            <Button type="button" variant="outline" className="flex-1 h-12 bg-white/5 border-white/5 text-primary-200/50 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={() => setIsBulkModalOpen(false)}>
              Abort
            </Button>
            <Button onClick={handleBulkUpload} disabled={!csvFile || isUploading} className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium">
              {isUploading ? 'Ingesting...' : 'Execute Induction'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={teacherToDelete !== null}
        onClose={() => setTeacherToDelete(null)}
        onConfirm={() => {
          if (teacherToDelete) deleteTeacherMutation.mutate(teacherToDelete);
        }}
        title="Faculty Termination"
        description="This will permanently revoke all access and purge the educator's operational record from the network."
      />

      <TeacherAssignmentsModal
        isOpen={isAssignmentModalOpen}
        onClose={() => {
          setIsAssignmentModalOpen(false);
          setAssignmentTeacher(null);
        }}
        teacher={assignmentTeacher}
      />
    </motion.div>
  );
};

const TeacherAssignmentsModal = ({ isOpen, onClose, teacher }: { isOpen: boolean; onClose: () => void; teacher: Teacher | null }) => {
  const queryClient = useQueryClient();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStream, setSelectedStream] = useState('');

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignments', teacher?.id],
    queryFn: () => classesService.getAssignments(teacher?.id),
    enabled: !!teacher,
    select: (data) => Array.isArray(data) ? data : (data.results || []),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => classesService.getSubjects(),
    enabled: isOpen,
    select: (data) => Array.isArray(data) ? data : (data.results || []),
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: () => classesService.getGrades(),
    enabled: isOpen,
    select: (data) => Array.isArray(data) ? data : (data.results || []),
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (data: any) => classesService.createAssignment(data),
    onSuccess: () => {
      toast.success('Protocol Assigned');
      setSelectedSubject('');
      setSelectedStream('');
      queryClient.invalidateQueries({ queryKey: ['assignments', teacher?.id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Assignment Failure')
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: number) => classesService.deleteAssignment(id),
    onSuccess: () => {
      toast.success('Assignment Revoked');
      queryClient.invalidateQueries({ queryKey: ['assignments', teacher?.id] });
    }
  });

  const handleAdd = () => {
    if (!teacher || !selectedSubject || !selectedStream) return;
    createAssignmentMutation.mutate({
      teacher: teacher.id,
      subject: parseInt(selectedSubject),
      stream: parseInt(selectedStream)
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Intelligence Scope: ${teacher?.first_name} ${teacher?.last_name}`}
      className="max-w-3xl glass border-white/10"
    >
      <div className="space-y-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">Target Domain</label>
              <button
                onClick={async () => {
                  const name = prompt('New Domain Name:');
                  if (name) {
                    try {
                      await classesService.createSubject({ name });
                      queryClient.invalidateQueries({ queryKey: ['subjects'] });
                      toast.success('Domain Added');
                    } catch (_) {
                      toast.error('Induction Failed');
                    }
                  }
                }}
                className="text-[10px] font-black text-primary-400 hover:text-primary-300 uppercase tracking-widest"
              >
                + Create Domain
              </button>
            </div>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full h-12 bg-white/5 border border-white/5 rounded-xl px-4 text-white text-sm outline-none focus:border-primary-500 transition-all">
              <option value="">Select Domain...</option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">Deployment Stream</label>
            <select value={selectedStream} onChange={(e) => setSelectedStream(e.target.value)} className="w-full h-12 bg-white/5 border border-white/5 rounded-xl px-4 text-white text-sm outline-none focus:border-primary-500 transition-all">
              <option value="">Select Stream...</option>
              {grades.map((g: any) => (
                <optgroup key={g.id} label={g.name}>
                  {g.streams.map((s: any) => (
                    <option key={s.id} value={s.id}>{g.name} {s.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <Button className="md:col-span-2 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-premium" onClick={handleAdd} disabled={!selectedSubject || !selectedStream || createAssignmentMutation.isPending}>
            <Plus className="w-4 h-4" /> Add Assignment Protocol
          </Button>
        </div>

        <div className="space-y-4 pb-4">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Active Intelligence Scope</h3>
          {loadingAssignments ? (
            <div className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500" /></div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 glass rounded-3xl border-dashed border-white/5 opacity-30">
              <p className="text-xs font-black uppercase tracking-widest italic">No Active Scope Defined</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {assignments.map((as: any) => (
                  <motion.div 
                    key={as.id} 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    className="flex items-center justify-between p-5 glass border-white/5 rounded-[24px] hover:bg-white/5 transition-all group"
                  >
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-tight">{as.subject_name}</p>
                      <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">{as.grade_name} • {as.stream_name}</p>
                    </div>
                    <button onClick={() => deleteAssignmentMutation.mutate(as.id)} className="p-2.5 text-primary-200/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);
