import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, UserPlus, FileText, UploadCloud, Download, Settings, Trash2, Users, BookOpen, UserSquare2, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
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
    gender: 'M',
    date_of_birth: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
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
      toast.error(error.response?.data?.detail || 'Failed to add student');
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
    setFormData({ admission_number: '', first_name: '', last_name: '', gender: 'M', date_of_birth: '', parent_name: '', parent_phone: '', parent_email: '', email: '', password: '', stream: '' });
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      admission_number: student.admission_number,
      first_name: student.first_name,
      last_name: student.last_name,
      gender: student.gender,
      date_of_birth: student.date_of_birth,
      parent_name: student.parent_name,
      parent_phone: student.parent_phone,
      parent_email: student.parent_email || '',
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
    
    if (editingStudent) {
      const { email, password, ...updateData } = formData;
      const finalData = { ...updateData };
      if (email && email.trim() !== '') (finalData as any).email = email;
      if (password && password.trim() !== '') (finalData as any).password = password;
      updateStudentMutation.mutate({ id: editingStudent.id, data: finalData });
    } else {
      createStudentMutation.mutate(formData);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return toast.error('Please select a CSV file first.');

    const formDataObj = new FormData();
    formDataObj.append('file', csvFile);

    setIsUploading(true);
    try {
      const res = await client.post('students/bulk_upload/', formDataObj, {
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
    const csvContent = "data:text/csv;charset=utf-8,first_name,last_name,admission_number,gender,date_of_birth,parent_name,parent_phone,stream_id\nJohn,Doe,ADM001,M,2010-05-15,Jane Doe,+254700000000,1";
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-12"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">Student <span className="text-gradient">Registry</span></h1>
          <p className="text-primary-200/50 text-base font-medium">Advanced student lifecycle management and records.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button variant="secondary" onClick={() => setIsBulkModalOpen(true)} className="gap-2 rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-xs">
            <UploadCloud className="w-4 h-4" /> Import CSV
          </Button>
          <Button onClick={handleAddStudent} className="gap-2 rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-xs shadow-premium" disabled={createStudentMutation.isPending}>
            <UserPlus className="w-4 h-4" /> Add Student
          </Button>
        </div>
      </div>

      <div className="glass rounded-[40px] overflow-hidden relative border-white/5">
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            className="absolute top-0 left-0 right-0 z-20 bg-primary-600 px-8 py-4 flex items-center justify-between shadow-premium"
          >
            <div className="flex items-center gap-6">
              <span className="text-white font-black text-xs uppercase tracking-widest">{selectedIds.length} Records Selected</span>
              <button 
                onClick={() => setSelectedIds([])}
                className="text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                Clear Selection
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 border-white/10 text-white gap-2 h-10 px-5 text-[10px] font-black uppercase tracking-widest rounded-xl">
                Archive
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                className="bg-rose-500 hover:bg-rose-400 text-white gap-2 h-10 px-5 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg"
                onClick={() => setIsBulkDeleteConfirmOpen(true)}
              >
                Delete Selected
              </Button>
            </div>
          </motion.div>
        )}

        <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative w-full md:w-[450px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/30" />
            <Input 
              type="text" 
              placeholder="Query admission, name, or parent..." 
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
                <TableHead className="w-16 pl-8">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === studentsData.length && studentsData.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded-lg border-white/10 bg-white/5 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer"
                  />
                </TableHead>
                <TableHead className="text-primary-200/40 text-[10px] font-black uppercase tracking-widest">Identifier</TableHead>
                <TableHead className="text-primary-200/40 text-[10px] font-black uppercase tracking-widest">Full Name</TableHead>
                <TableHead className="text-primary-200/40 text-[10px] font-black uppercase tracking-widest">Allocation</TableHead>
                <TableHead className="text-primary-200/40 text-[10px] font-black uppercase tracking-widest">Demographics</TableHead>
                <TableHead className="text-primary-200/40 text-[10px] font-black uppercase tracking-widest">Primary Contact</TableHead>
                <TableHead className="text-primary-200/40 text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-right text-primary-200/40 text-[10px] font-black uppercase tracking-widest pr-8">Operations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-white/5">
              {loading ? (
                <TableSkeleton rows={10} cols={8} />
              ) : studentsData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-32">
                    <div className="flex flex-col items-center justify-center opacity-20">
                      <Users className="w-20 h-20 mb-4" />
                      <p className="text-lg font-black uppercase tracking-widest">No Records Found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                studentsData.map((student: Student, idx: number) => (
                  <motion.tr 
                    key={student.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`group transition-all h-20 border-white/5 hover:bg-white/5 ${selectedIds.includes(student.id) ? 'bg-primary-500/5' : ''}`}
                  >
                    <TableCell className="pl-8">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        className="w-5 h-5 rounded-lg border-white/10 bg-white/5 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="font-black text-primary-400 text-sm tracking-tighter">{student.admission_number}</TableCell>
                    <TableCell>
                      <div className="text-sm font-black text-white uppercase tracking-tight">{student.first_name} {student.last_name}</div>
                    </TableCell>
                    <TableCell>
                      {student.grade_name ? (
                        <span className="px-3 py-1.5 rounded-xl bg-primary-600/10 text-primary-400 text-[10px] font-black uppercase tracking-widest border border-primary-500/20">
                          {student.grade_name} • {student.stream_name}
                        </span>
                      ) : (
                        <span className="text-primary-200/20 text-[10px] font-black uppercase tracking-widest italic">Unallocated</span>
                      )}
                    </TableCell>
                    <TableCell className="text-primary-200/50 text-xs font-bold uppercase tracking-tight">
                      {student.gender === 'M' ? 'Male' : 'Female'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-bold text-white">{student.parent_name}</div>
                      <div className="text-[10px] font-black text-primary-200/30 uppercase tracking-tighter">{student.parent_phone}</div>
                    </TableCell>
                    <TableCell>
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                        Operational
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleEditStudent(student)}
                          className="p-3 hover:bg-white/10 rounded-xl text-primary-200/40 hover:text-white transition-all group-hover:scale-110"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setStudentToDelete(student.id)}
                          className="p-3 hover:bg-rose-500/10 text-primary-200/40 hover:text-rose-400 rounded-xl transition-all group-hover:scale-110"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link 
                          to={`/students/${student.id}/report`}
                          className="p-3 hover:bg-primary-500/10 text-primary-200/40 hover:text-primary-400 rounded-xl transition-all group-hover:scale-110"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>
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
          setEditingStudent(null);
        }}
        title={editingStudent ? "Operational Intelligence Modification" : "New Asset Admission"}
        className="max-w-3xl glass border-white/10"
      >
        <form onSubmit={handleAddStudent} className="space-y-10 mt-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <Users className="w-4 h-4 text-primary-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Core Identity</h3>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Birth Date</label>
                  <Input required type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} className="bg-white/5 border-white/5 rounded-xl h-12 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Gender</label>
                  <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })} className="flex h-12 w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-primary-500 transition-all">
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <BookOpen className="w-4 h-4 text-accent-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Deployment</h3>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Identifier (Adm No)</label>
                <Input required value={formData.admission_number} onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })} placeholder="ADM-XXX" className="bg-white/5 border-white/5 rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Target Stream</label>
                <select required value={formData.stream} onChange={(e) => setFormData({ ...formData, stream: e.target.value })} className="flex h-12 w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-primary-500 transition-all">
                  <option value="">Select Target...</option>
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

            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <UserSquare2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Guardian Node</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Guardian Name</label>
                  <Input required value={formData.parent_name} onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })} className="bg-white/5 border-white/5 rounded-xl h-12" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Phone</label>
                    <Input required type="tel" value={formData.parent_phone} onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })} className="bg-white/5 border-white/5 rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Email</label>
                    <Input type="email" value={formData.parent_email} onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })} className="bg-white/5 border-white/5 rounded-xl h-12" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <Shield className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Secure Access</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Portal Channel (Email)</label>
                  <Input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-white/5 border-white/5 rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Encryption Key (Password)</label>
                  <Input required={!editingStudent} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={editingStudent ? "Current" : "Min 8 chars"} className="bg-white/5 border-white/5 rounded-xl h-12" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" className="flex-1 h-14 bg-white/5 border-white/5 text-primary-200/50 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={() => setIsModalOpen(false)}>
              Discard
            </Button>
            <Button type="submit" className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium" disabled={createStudentMutation.isPending || updateStudentMutation.isPending}>
              {createStudentMutation.isPending || updateStudentMutation.isPending 
                ? 'Syncing...' 
                : (editingStudent ? 'Commit Changes' : 'Execute Admission')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Mass Data Ingestion"
        description="Ingest multiple student records via CSV protocol."
        className="max-w-xl glass border-white/10"
      >
        <div className="mt-8 space-y-8">
          <div 
            className={`border-4 border-dashed rounded-[32px] p-12 text-center transition-all cursor-pointer ${
              csvFile ? 'border-primary-500 bg-primary-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
            <UploadCloud className={`w-16 h-16 mx-auto mb-6 ${csvFile ? 'text-primary-400' : 'text-primary-200/20'}`} />
            {csvFile ? (
              <div className="animate-in fade-in zoom-in duration-300">
                <p className="text-white font-black uppercase tracking-widest text-sm mb-2">{csvFile.name}</p>
                <p className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest">{(csvFile.size / 1024).toFixed(1)} KB Payload</p>
              </div>
            ) : (
              <div>
                <p className="text-white font-black uppercase tracking-widest text-sm mb-2">Drop Intelligence File</p>
                <p className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest">CSV Format Only</p>
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-primary-600/10 border border-primary-500/20 flex items-start gap-4">
            <FileText className="w-6 h-6 text-primary-400 shrink-0 mt-1" />
            <div className="space-y-3">
              <p className="text-sm font-black text-white uppercase tracking-tight">Protocol Template Required?</p>
              <p className="text-xs font-medium text-primary-200/50 leading-relaxed">Download the structured protocol to ensure high-fidelity data ingestion.</p>
              <Button size="sm" onClick={downloadTemplate} className="gap-2 bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-xl shadow-lg">
                <Download className="w-3 h-3" /> Download Protocol
              </Button>
            </div>
          </div>

          <div className="flex gap-4 pt-2 pb-4">
            <Button type="button" variant="outline" className="flex-1 h-12 bg-white/5 border-white/5 text-primary-200/50 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={() => setIsBulkModalOpen(false)}>
              Abort
            </Button>
            <Button onClick={handleBulkUpload} disabled={!csvFile || isUploading} className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium">
              {isUploading ? 'Ingesting...' : 'Execute Import'}
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
        title="Record Termination"
        description="This will permanently purge this student's operational data from the system. This protocol is irreversible."
      />

      <ConfirmModal 
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={() => {
          toast.promise(
            Promise.all(selectedIds.map(id => studentsService.delete(id))),
            {
              loading: 'Purging records...',
              success: 'Mass termination successful',
              error: 'Purge operation encountered errors'
            }
          ).then(() => {
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ['students'] });
          });
        }}
        title="Mass Data Purge"
        description={`Execute permanent termination of ${selectedIds.length} student records? Intelligence purge is irreversible.`}
      />
    </motion.div>
  );
};
