import { useState, useRef, useCallback, useEffect } from 'react';
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
      email: '', // Don't edit email/password for now
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
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Students</h1>
          <p className="text-slate-400 text-sm md:text-base">Manage student records and admissions.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="secondary" onClick={() => setIsBulkModalOpen(true)} className="gap-2">
            <UploadCloud className="w-4 h-4" /> Import CSV
          </Button>
          <Button onClick={handleAddStudent} className="gap-2" disabled={createStudentMutation.isPending}>
            <UserPlus className="w-4 h-4" /> Add New Student
          </Button>
        </div>
      </div>

      <div className="glass-dark rounded-3xl border border-white/5 overflow-hidden relative">
        {selectedIds.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-20 bg-primary-600 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <span className="text-white font-bold text-sm">{selectedIds.length} students selected</span>
              <div className="h-4 w-px bg-white/20" />
              <button 
                onClick={() => setSelectedIds([])}
                className="text-white/80 hover:text-white text-xs font-medium"
              >
                Deselect All
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 border-white/10 text-white gap-2 h-8 text-xs">
                Mark as Inactive
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                className="bg-rose-500 hover:bg-rose-400 text-white gap-2 h-8 text-xs"
                onClick={() => setIsBulkDeleteConfirmOpen(true)}
              >
                Delete Selected
              </Button>
            </div>
          </div>
        )}
        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              type="text" 
              placeholder="Search by name or admission number..." 
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
                <TableHead className="w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === studentsData.length && studentsData.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary-600 focus:ring-primary-500"
                  />
                </TableHead>
                <TableHead className="text-slate-400">Admission No</TableHead>
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">Class</TableHead>
                <TableHead className="text-slate-400">Gender</TableHead>
                <TableHead className="text-slate-400">Parent Contact</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-right text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-white/5 border-t border-white/5">
              {loading ? (
                <TableSkeleton rows={8} cols={7} />
              ) : studentsData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-12">
                    <p className="mb-4">No students found.</p>
                    <Button variant="link" onClick={handleAddStudent} className="text-primary-400">
                      Register your first student
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                studentsData.map((student: Student) => (
                  <TableRow key={student.id} className={`hover:bg-white/5 border-white/5 ${selectedIds.includes(student.id) ? 'bg-primary-500/5' : ''}`}>
                    <TableCell>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-primary-600 focus:ring-primary-500"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-primary-400 text-sm">{student.admission_number}</TableCell>
                    <TableCell>
                      <div className="text-sm font-semibold text-white">{student.first_name} {student.last_name}</div>
                    </TableCell>
                    <TableCell>
                      {student.grade_name && student.stream_name ? (
                        <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                          {student.grade_name} {student.stream_name}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">{student.gender === 'M' ? 'Male' : 'Female'}</TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-300">{student.parent_name}</div>
                      <div className="text-xs text-slate-500">{student.parent_phone}</div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                        Active
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                        <button 
                          onClick={() => handleEditStudent(student)}
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                          title="Edit Student / Move Class"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setStudentToDelete(student.id)}
                          className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link 
                          to={`/students/${student.id}/report`}
                          className="p-2 hover:bg-primary-500/10 text-slate-400 hover:text-primary-400 rounded-lg transition-all"
                          title="View Report Card"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>
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
          setEditingStudent(null);
        }}
        title={editingStudent ? "Edit Student / Move Class" : "Add New Student"}
        className="max-w-2xl bg-slate-900 border-white/10"
      >
        <form onSubmit={handleAddStudent} className="space-y-8 mt-4">
          {/* Section 1: Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <div className="p-1.5 bg-primary-500/10 rounded-lg">
                <Users className="w-4 h-4 text-primary-400" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">First Name</label>
                <Input
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Last Name</label>
                <Input
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Date of Birth</label>
                <Input
                  required
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-all"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Academic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <div className="p-1.5 bg-amber-500/10 rounded-lg">
                <BookOpen className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Academic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Admission Number</label>
                <Input
                  required
                  value={formData.admission_number}
                  onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                  placeholder="e.g. ADM-001"
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Class Stream</label>
                <select
                  required
                  value={formData.stream}
                  onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-all"
                >
                  <option value="">Select Class...</option>
                  {grades.map((grade: any) => (
                    <optgroup key={grade.id} label={grade.name}>
                      {grade.streams.map((stream: any) => (
                        <option key={stream.id} value={stream.id}>
                          {grade.name} {stream.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Guardian Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <UserSquare2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Guardian Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Parent Name</label>
                <Input
                  required
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Parent Phone</label>
                <Input
                  required
                  type="tel"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Parent Email (Optional)</label>
                <Input
                  type="email"
                  value={formData.parent_email}
                  onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Portal Credentials */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <div className="p-1.5 bg-purple-500/10 rounded-lg">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Portal Access</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Student Email</label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@school.com"
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Portal Password</label>
                <Input
                  required={!editingStudent}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingStudent ? "Leave blank to keep current" : "Min. 8 characters"}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="button" variant="outline" className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-12" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-[2] h-12" disabled={createStudentMutation.isPending || updateStudentMutation.isPending}>
              {createStudentMutation.isPending || updateStudentMutation.isPending 
                ? 'Saving Record...' 
                : (editingStudent ? 'Save Changes' : 'Admit Student')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Import Students"
        description="Upload a CSV file to add multiple students at once."
        className="max-w-lg bg-slate-900 border-white/10"
      >
        <div className="mt-4 space-y-6">
          <div 
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              csvFile ? 'border-primary-500/50 bg-primary-500/5' : 'border-slate-700 bg-slate-800/20 hover:border-slate-500'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
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

          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <FileText className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-400 font-medium mb-1">Need a template?</p>
              <p className="text-xs text-blue-300/70 mb-2">Download our sample CSV to ensure your columns match our required format.</p>
              <Button size="sm" onClick={downloadTemplate} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
                <Download className="w-3 h-3" /> Download Template
              </Button>
            </div>
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
              {isUploading ? 'Uploading...' : 'Import Students'}
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
        title="Delete Student"
        description="Are you sure you want to delete this student? This action cannot be undone and will remove all associated records."
      />

      <ConfirmModal 
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={() => {
          toast.promise(
            Promise.all(selectedIds.map(id => studentsService.delete(id))),
            {
              loading: 'Deleting students...',
              success: 'Bulk deletion completed',
              error: 'Failed to delete some students'
            }
          ).then(() => {
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ['students'] });
          });
        }}
        title="Delete Multiple Students"
        description={`Are you sure you want to delete ${selectedIds.length} students? This action is permanent and cannot be undone.`}
      />
    </div>
  );
};
