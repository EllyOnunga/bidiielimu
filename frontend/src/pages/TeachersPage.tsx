import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Mail, Phone, Trash2, Plus, BookOpen, X, Settings, UserPlus, Filter, UploadCloud } from 'lucide-react';
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
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Teachers</h1>
          <p className="text-slate-400 text-sm md:text-base">Manage faculty members and their assignments.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="secondary" onClick={() => setIsBulkModalOpen(true)} className="gap-2">
            <UploadCloud className="w-4 h-4" /> Import CSV
          </Button>
          <Button onClick={handleAddTeacher} className="gap-2">
            <UserPlus className="w-5 h-5" />
            Add New Teacher
          </Button>
        </div>
      </div>

      <div className="glass-dark rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Search by name or subject..."
              className="pl-9 bg-slate-800/50 border-slate-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 bg-slate-800 border-slate-700 text-slate-300">
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </div>

        <div className="p-0">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-white/5">
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead className="text-slate-400">Teacher</TableHead>
                <TableHead className="text-slate-400">Contact</TableHead>
                <TableHead className="text-slate-400">Subject</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-right text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-white/5 border-t border-white/5">
              {loading ? (
                <TableSkeleton rows={8} cols={5} />
              ) : teachersData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-12">No teachers found.</TableCell>
                </TableRow>
              ) : (
                teachersData.map((teacher: Teacher) => (
                  <TableRow key={teacher.id} className="hover:bg-white/5 border-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-xs">
                          {teacher.first_name[0]}{teacher.last_name[0]}
                        </div>
                        <div className="text-sm font-semibold text-white">{teacher.first_name} {teacher.last_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-400">
                          <Mail className="w-3 h-3" />
                          {teacher.email || `${teacher.employee_id}@school.com`}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500">
                          <Phone className="w-3 h-3" />
                          {teacher.phone_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">{teacher.specialization || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${teacher.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                        {teacher.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setAssignmentTeacher(teacher);
                            setIsAssignmentModalOpen(true);
                          }}
                          className="p-2 hover:bg-primary-500/10 text-slate-400 hover:text-primary-400 rounded-lg transition-all"
                          title="Manage Assignments"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditTeacher(teacher)}
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-all"
                          title="Edit Teacher"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTeacherToDelete(teacher.id)}
                          className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                          title="Delete Teacher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
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
        title={editingTeacher ? "Edit Teacher" : "Add New Teacher"}
        className="max-w-2xl bg-slate-900 border-white/10"
      >
        <form onSubmit={handleAddTeacher} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Employee ID</label>
              <Input
                required
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                placeholder="e.g. EMP-2024-001"
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">First Name</label>
              <Input
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Last Name</label>
              <Input
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Phone Number</label>
              <Input
                required
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Specialization</label>
              <Input
                required
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g. Mathematics"
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Joining Date</label>
              <Input
                required
                type="date"
                value={formData.joining_date}
                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Teacher Email (Login)</label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="teacher@school.com"
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Login Password</label>
              <Input
                required={!editingTeacher}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingTeacher ? "Leave blank to keep current" : "Min. 8 characters"}
                className="bg-slate-800/50 border-slate-700"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-[2]" disabled={createTeacherMutation.isPending || updateTeacherMutation.isPending}>
              {createTeacherMutation.isPending || updateTeacherMutation.isPending
                ? 'Processing...'
                : (editingTeacher ? 'Save Changes' : 'Register Teacher')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Import Teachers"
        description="Upload a CSV file to add multiple teachers with class and subject assignments."
        className="max-w-lg bg-slate-900 border-white/10"
      >
        <div className="mt-4 space-y-6">
          <div 
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              csvFile ? 'border-primary-500/50 bg-primary-500/5' : 'border-slate-700 bg-slate-800/20 hover:border-slate-500'
            }`}
            onClick={() => document.getElementById('teacher-csv-input')?.click()}
          >
            <input 
              id="teacher-csv-input"
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            />
            <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${csvFile ? 'text-primary-400' : 'text-slate-500'}`} />
            {csvFile ? (
              <div>
                <p className="text-white font-medium mb-1">{csvFile.name}</p>
                <p className="text-xs text-slate-400">{(csvFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-white font-medium mb-1">Click to browse or drag file here</p>
                <p className="text-xs text-slate-400">Only CSV files are supported</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700" onClick={() => setIsBulkModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkUpload}
              disabled={!csvFile || isUploading}
              className="flex-1"
            >
              {isUploading ? 'Uploading...' : 'Import Teachers'}
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
        title="Delete Teacher"
        description="Are you sure you want to delete this teacher? This will also remove their access to the portal."
      />

      <TeacherAssignmentsModal
        isOpen={isAssignmentModalOpen}
        onClose={() => {
          setIsAssignmentModalOpen(false);
          setAssignmentTeacher(null);
        }}
        teacher={assignmentTeacher}
      />
    </div>
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
      toast.success('Assignment added');
      setSelectedSubject('');
      setSelectedStream('');
      queryClient.invalidateQueries({ queryKey: ['assignments', teacher?.id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to add assignment')
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: number) => classesService.deleteAssignment(id),
    onSuccess: () => {
      toast.success('Assignment removed');
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
      title={`Subject Assignments: ${teacher?.first_name} ${teacher?.last_name}`}
      className="max-w-2xl bg-slate-900 border-white/10"
    >
      <div className="space-y-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
              <button 
                onClick={async () => {
                  const name = prompt('Enter new subject name:');
                  if (name) {
                    try {
                      await classesService.createSubject({ name });
                      queryClient.invalidateQueries({ queryKey: ['subjects'] });
                      toast.success('Subject added');
                    } catch (e) {
                      toast.error('Failed to add subject');
                    }
                  }
                }}
                className="text-[10px] font-bold text-primary-400 hover:text-primary-300"
              >
                + Quick Add
              </button>
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Subject...</option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Class / Stream</label>
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
            >
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
          <Button
            className="md:col-span-2 gap-2"
            onClick={handleAdd}
            disabled={!selectedSubject || !selectedStream || createAssignmentMutation.isPending}
          >
            <Plus className="w-4 h-4" /> Add Assignment
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Current Assignments</h3>
          {loadingAssignments ? (
            <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-500" /></div>
          ) : assignments.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center py-4">No subjects assigned to this teacher yet.</p>
          ) : (
            <div className="grid gap-2">
              {assignments.map((as: any) => (
                <div key={as.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group">
                  <div>
                    <p className="text-sm font-bold text-white">{as.subject_name}</p>
                    <p className="text-xs text-slate-500">{as.grade_name} {as.stream_name}</p>
                  </div>
                  <button
                    onClick={() => deleteAssignmentMutation.mutate(as.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
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
