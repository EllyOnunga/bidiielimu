import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, UserPlus, UploadCloud, Settings, Trash2, Users, BookOpen, UserSquare2, Shield } from 'lucide-react';
import { studentsService, type Student } from '../api/services/studentsService';
import client from '../api/client';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { TableSkeleton } from '../components/ui/Skeleton';

interface GradeLevel { id: number; name: string; streams: { id: number; name: string }[]; }

export const StudentsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [formData, setFormData] = useState({
    admission_number: '',
    first_name: '',
    last_name: '',
    gender: 'M' as 'M' | 'F' | 'O',
    date_of_birth: '',
    enrollment_date: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_relationship: 'LEGAL_GUARDIAN' as 'FATHER' | 'MOTHER' | 'STEP_FATHER' | 'STEP_MOTHER' | 'LEGAL_GUARDIAN' | 'SPONSOR',
    email: '',
    password: '',
    stream: '',
  });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === studentsData.length && studentsData.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(studentsData.map((s: Student) => s.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const { data: studentsData = [], isLoading: loading } = useQuery({
    queryKey: ['students', debouncedSearch],
    queryFn: () => studentsService.getAll(debouncedSearch),
    select: (data) => Array.isArray(data) ? data : (data.results || []),
  });

  const createStudentMutation = useMutation({
    mutationFn: (data: any) => studentsService.create(data),
    onSuccess: () => {
      toast.success('Student added successfully!');
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: any) => {
      const data = error.response?.data;
      const errorMsg = data?.detail || data?.email?.[0] || data?.admission_number?.[0] || 'Failed to add student. Please check all fields.';
      toast.error(errorMsg);
    }
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => studentsService.update(id, data),
    onSuccess: () => {
      toast.success('Student updated successfully!');
      setIsModalOpen(false);
      setEditingStudent(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update student');
    }
  });

  const deleteStudentMutation = useMutation({
    mutationFn: (id: number) => studentsService.delete(id),
    onSuccess: () => {
      toast.success('Student deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete student');
    }
  });

  const fetchGrades = useCallback(async () => {
    try {
      const res = await client.get('classes/grades/');
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setGrades(data);
    } catch (e) {
      console.error('Failed to fetch grades', e);
    }
  }, []);

  const resetForm = () => {
    setFormData({
      admission_number: '', first_name: '', last_name: '', gender: 'M',
      date_of_birth: '', enrollment_date: '', guardian_name: '',
      guardian_phone: '', guardian_email: '', guardian_relationship: 'LEGAL_GUARDIAN',
      email: '', password: '', stream: ''
    });
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      admission_number: student.admission_number,
      first_name: student.first_name,
      last_name: student.last_name,
      gender: student.gender || 'M',
      date_of_birth: student.date_of_birth || '',
      enrollment_date: student.enrollment_date || '',
      guardian_name: student.guardians?.[0] ? `${student.guardians[0].first_name} ${student.guardians[0].last_name}`.trim() : '',
      guardian_phone: student.guardians?.[0]?.phone_number || '',
      guardian_email: student.guardians?.[0]?.email || '',
      guardian_relationship: student.guardians?.[0]?.relationship || 'LEGAL_GUARDIAN',
      email: '',
      password: '',
      stream: student.stream?.toString() || '',
    });
    fetchGrades();
    setIsModalOpen(true);
  };

  const handleAddStudent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isModalOpen) {
      setEditingStudent(null);
      resetForm();
      fetchGrades();
      setIsModalOpen(true);
      return;
    }

    // Build the guardian object from the flat UI fields
    const guardian = {
      first_name: formData.guardian_name.split(' ')[0],
      last_name: formData.guardian_name.split(' ').slice(1).join(' ') || 'Unknown',
      relationship: formData.guardian_relationship,
      phone_number: formData.guardian_phone,
      ...(formData.guardian_email ? { email: formData.guardian_email } : {}),
    };

    // Strip UI-only fields that the backend serializer doesn't accept
    const { 
      guardian_name: _gn, 
      guardian_phone: _gp, 
      guardian_email: _ge, 
      guardian_relationship: _gr, 
      email, 
      password, 
      stream, 
      ...coreFields 
    } = formData;

    if (editingStudent) {
      const payload: Record<string, unknown> = {
        ...coreFields,
        ...(stream ? { stream: Number(stream) } : {}),
        guardians: [guardian],
      };
      if (email && email.trim() !== '') payload.email = email;
      if (password && password.trim() !== '') payload.password = password;
      updateStudentMutation.mutate({ id: editingStudent.id, data: payload });
    } else {
      const payload: Record<string, unknown> = {
        ...coreFields,
        ...(stream ? { stream: Number(stream) } : {}),
        email,
        password,
        guardians: [guardian],
      };
      createStudentMutation.mutate(payload);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return toast.error('Please select a CSV file first.');

    const formDataObj = new FormData();
    formDataObj.append('file', csvFile);

    setIsUploading(true);
    try {
      const res = await client.post('students/import/', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(res.data.detail);
      setIsBulkModalOpen(false);
      setCsvFile(null);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (error: any) {
      const errs = error.response?.data?.errors;
      if (errs && errs.length > 0) {
        toast.error(`Upload failed: ${errs[0]}`);
      } else {
        toast.error(error.response?.data?.detail || 'Failed to bulk upload students');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,admission_number,first_name,last_name,gender,date_of_birth,enrollment_date,grade_name,stream_name,curriculum,guardian_name,guardian_phone,guardian_email,guardian_relationship\nADM001,John,Doe,M,2010-05-15,2020-09-01,Grade 4,West,CBC,Jane Doe,+254700000000,jane@example.com,MOTHER";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "students_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 md:space-y-12 pb-12"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-none">Student <span className="text-gradient">Registry</span></h1>
          <p className="text-muted text-xs sm:text-sm md:text-base font-medium max-w-xl">Comprehensive lifecycle management and digital records for all students.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Button variant="outline" onClick={() => setIsBulkModalOpen(true)} className="gap-2 flex-1 sm:flex-none">
            <UploadCloud className="w-4 h-4" /> Import CSV
          </Button>
          <Button onClick={handleAddStudent} className="gap-2 flex-1 sm:flex-none" disabled={createStudentMutation.isPending}>
            <UserPlus className="w-4 h-4" /> Add Student
          </Button>
        </div>
      </div>

      <div className="premium-card !p-0 overflow-hidden relative">
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            className="absolute top-0 left-0 right-0 z-20 bg-primary-600 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
          >
            <div className="flex items-center gap-4">
              <span className="text-white font-black text-[10px] uppercase tracking-widest">{selectedIds.length} Records Selected</span>
              <button
                onClick={() => setSelectedIds([])}
                className="text-white/60 hover:text-white text-[9px] font-black uppercase tracking-widest transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button size="sm" variant="outline" className="flex-1 sm:flex-none bg-white/10 border-white/10 text-white text-[9px] h-9">
                Archive
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1 sm:flex-none text-[9px] h-9 shadow-lg"
                onClick={() => setIsBulkDeleteConfirmOpen(true)}
              >
                Delete
              </Button>
            </div>
          </motion.div>
        )}

        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.02]">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/20" />
            <Input
              type="text"
              placeholder="Query admission, name, or parent..."
              className="pl-12 bg-white/5 border-white/5 focus:bg-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="w-full md:w-auto gap-2 text-[10px]">
            <Filter className="w-4 h-4" /> Filters
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">
                <input
                  type="checkbox"
                  checked={selectedIds.length === studentsData.length && studentsData.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
              </TableHead>
              <TableHead>Identifier</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Allocation</TableHead>
              <TableHead className="hidden md:table-cell">Demographics</TableHead>
              <TableHead>Primary Contact</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right">Ops</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton rows={10} cols={8} />
            ) : studentsData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20 md:py-24">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center mb-6">
                      <Users className="w-8 h-8 text-primary-400" />
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-primary tracking-tight mb-2 uppercase">No Records Found</h3>
                    <p className="text-muted font-medium text-[10px] sm:text-xs max-w-sm mx-auto mb-8 leading-relaxed px-4">
                      Your search did not return any assets. Try different query parameters or initialize a new record.
                    </p>
                    {search && (
                      <Button variant="outline" size="sm" onClick={() => setSearch('')}>Clear Query</Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              studentsData.map((student: Student, idx: number) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`group transition-all hover:bg-white/[0.03] ${selectedIds.includes(student.id) ? 'bg-primary-500/5' : ''}`}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={() => toggleSelect(student.id)}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="font-black text-primary-400 font-mono text-[10px] sm:text-xs">{student.admission_number}</TableCell>
                  <TableCell>
                    <div className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-tight truncate max-w-[100px] sm:max-w-none">{student.first_name} {student.last_name}</div>
                  </TableCell>
                  <TableCell>
                    {student.grade_name ? (
                      <span className="px-2 py-1 rounded-lg bg-primary-600/10 text-primary-400 text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-primary-500/10 whitespace-nowrap">
                        {student.grade_name} • {student.stream_name}
                      </span>
                    ) : (
                      <span className="text-dim text-[9px] font-black uppercase tracking-widest italic">Unallocated</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted text-[10px] font-bold uppercase">
                    {student.gender === 'M' ? 'Male' : 'Female'}
                  </TableCell>
                  <TableCell>
                    <div className="text-[10px] sm:text-xs font-bold text-primary truncate max-w-[80px] sm:max-w-[120px]">
                      {student.guardians?.[0] ? `${student.guardians[0].first_name} ${student.guardians[0].last_name}`.trim() : '—'}
                    </div>
                    <div className="text-[8px] sm:text-[9px] font-black text-dim uppercase font-mono">
                      {student.guardians?.[0]?.phone_number || '—'}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/10">
                      Active
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="p-2 hover:bg-white/10 rounded-lg text-primary-200/30 hover:text-white transition-all"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setStudentToDelete(student.id)}
                        className="p-2 hover:bg-rose-500/10 text-primary-200/30 hover:text-rose-400 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
        }}
        title={editingStudent ? "Operational Modification" : "Record Admission"}
        className="max-w-2xl"
      >
        <form onSubmit={handleAddStudent} className="space-y-6 sm:space-y-8 mt-6 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <Users className="w-3.5 h-3.5 text-primary-400" />
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Identity</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input required placeholder="First Name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="h-10 text-xs" />
                  <Input required placeholder="Last Name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="h-10 text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-primary-200/20 uppercase tracking-widest pl-1">Birth Date</label>
                    <Input required type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} className="h-10 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-primary-200/20 uppercase tracking-widest pl-1">Enrollment</label>
                    <Input required type="date" value={formData.enrollment_date} onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })} className="h-10 text-xs" />
                  </div>
                </div>
                <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })} className="flex h-10 w-full rounded-xl border border-white/5 bg-white/5 px-4 text-xs text-white outline-none focus:border-primary-500/50 transition-all">
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Allocation</h3>
              </div>
              <div className="space-y-3">
                <Input required placeholder="Admission No (e.g. ADM-001)" value={formData.admission_number} onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })} className="h-10 text-xs" />
                <select required value={formData.stream} onChange={(e) => setFormData({ ...formData, stream: e.target.value })} className="flex h-10 w-full rounded-xl border border-white/5 bg-white/5 px-4 text-xs text-white outline-none focus:border-primary-500/50 transition-all">
                  <option value="">Select Target Stream...</option>
                  {grades.map((grade: any) => (
                    <optgroup key={grade.id} label={grade.name}>
                      {grade.streams.map((stream: any) => (
                        <option key={stream.id} value={stream.id}>{grade.name} {stream.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <UserSquare2 className="w-3.5 h-3.5 text-emerald-400" />
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Guardian Node</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input required placeholder="Full Name" value={formData.guardian_name} onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })} className="h-10 text-xs" />
                  <select value={formData.guardian_relationship} onChange={(e) => setFormData({ ...formData, guardian_relationship: e.target.value as any })} className="flex h-10 w-full rounded-xl border border-white/5 bg-white/5 px-4 text-xs text-white outline-none focus:border-primary-500/50 transition-all">
                    <option value="FATHER">Father</option>
                    <option value="MOTHER">Mother</option>
                    <option value="LEGAL_GUARDIAN">Guardian</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input required type="tel" placeholder="Phone No" value={formData.guardian_phone} onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })} className="h-10 text-xs" />
                  <Input type="email" placeholder="Email (Optional)" value={formData.guardian_email} onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })} className="h-10 text-xs" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Security</h3>
              </div>
              <div className="space-y-3">
                <Input required type="email" placeholder="Portal Login (Email)" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-10 text-xs" />
                <Input required={!editingStudent} type="password" placeholder={editingStudent ? "Reset Password?" : "Encryption Key"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="h-10 text-xs" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/5">
            <Button type="button" variant="ghost" className="flex-1 text-[10px] h-12" onClick={() => setIsModalOpen(false)}>
              Discard
            </Button>
            <Button type="submit" className="flex-[2] text-[10px] h-12" disabled={createStudentMutation.isPending || updateStudentMutation.isPending}>
              {createStudentMutation.isPending || updateStudentMutation.isPending ? 'Syncing...' : (editingStudent ? 'Commit Changes' : 'Execute Admission')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Mass Ingestion Protocol"
        className="max-w-lg glass-morphic border-white/10 !rounded-[32px]"
      >
        <div className="mt-6 space-y-6">
          <div
            className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer ${csvFile ? 'border-primary-500 bg-primary-500/5' : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
            <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${csvFile ? 'text-primary-400' : 'text-primary-200/10'}`} />
            {csvFile ? (
              <div>
                <p className="text-white font-black uppercase text-xs mb-1">{csvFile.name}</p>
                <p className="text-[9px] font-bold text-primary-200/30 uppercase">{(csvFile.size / 1024).toFixed(1)} KB Payload</p>
              </div>
            ) : (
              <div>
                <p className="text-white font-black uppercase text-xs mb-1">Select Protocol File</p>
                <p className="text-[9px] font-bold text-primary-200/20 uppercase tracking-widest">CSV Format Required</p>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-4">
            <div className="space-y-1.5 flex-1">
              <p className="text-xs font-black text-white uppercase">Template Missing?</p>
              <p className="text-[10px] font-medium text-primary-200/40 leading-relaxed">Download the structured protocol template to ensure high-fidelity ingestion.</p>
              <button onClick={downloadTemplate} className="text-[10px] font-black text-primary-400 hover:text-primary-300 mt-2 uppercase tracking-widest transition-all">Download Protocol →</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-2">
            <Button variant="ghost" className="flex-1 text-[10px] h-11" onClick={() => setIsBulkModalOpen(false)}>Abort</Button>
            <Button onClick={handleBulkUpload} disabled={!csvFile || isUploading} className="flex-[2] text-[10px] h-11">
              {isUploading ? 'Ingesting...' : 'Execute Protocol'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={studentToDelete !== null}
        onClose={() => setStudentToDelete(null)}
        onConfirm={() => {
          if (studentToDelete) deleteStudentMutation.mutate(studentToDelete);
        }}
        title="Data Purge"
        description="Permanently terminate this student's records from the operational intelligence database."
      />

      <ConfirmModal
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={() => {
          toast.promise(
            Promise.all(selectedIds.map(id => studentsService.delete(id))),
            {
              loading: 'Mass purge executing...',
              success: 'Records terminated',
              error: 'Purge protocol failed'
            }
          ).then(() => {
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ['students'] });
          });
        }}
        title="Mass Termination"
        description={`Execute permanent purge of ${selectedIds.length} student records? This protocol is irreversible.`}
      />
    </motion.div>
  );
};
