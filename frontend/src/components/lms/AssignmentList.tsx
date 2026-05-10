import { useState, useEffect } from 'react';
import { BookOpen, Clock, FileText, Upload, Send, ChevronRight, Plus, Users, Download } from 'lucide-react';
import client from '../../api/client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useQuery } from '@tanstack/react-query';
import { classesService } from '../../api/services/classesService';

const getFileUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  // Get base URL from client or environment
  const apiBase = import.meta.env.VITE_API_URL || '';
  const baseUrl = apiBase.split('/api/v1')[0];
  
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

interface Assignment {
  id: string;
  title: string;
  subject_name: string;
  stream_name?: string;
  due_date: string;
  max_score: number;
  description: string;
  file?: string;
  submission_count?: number;
  status?: string;
  student_grade?: number;
  student_feedback?: string;
  created_at?: string;
}

interface Submission {
  id: number;
  assignment_title: string;
  student_name: string;
  text_content?: string;
  file?: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  is_graded: boolean;
  max_score: number;
}

export const AssignmentList = () => {
  const user = useAuthStore(state => state.user);
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [gradingData, setGradingData] = useState({ score: '', feedback: '' });
  
  const [formData, setFormData] = useState<{
    subject: string;
    stream: string;
    title: string;
    description: string;
    due_date: string;
    max_score: number;
    file: File | null;
    teacher: string;
  }>({
    subject: '',
    stream: '',
    title: '',
    description: '',
    due_date: '',
    max_score: 100,
    file: null,
    teacher: ''
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const res = await client.get('teachers/');
      return Array.isArray(res.data) ? res.data : (res.data.results || []);
    },
    enabled: isTeacher && user?.role !== 'TEACHER', // Only for admins
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const data = await classesService.getGrades();
      return data.results || data;
    },
    enabled: isTeacher,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const data = await classesService.getSubjects();
      return data.results || data;
    },
    enabled: isTeacher,
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (isTeacher && selectedAssignment) {
      fetchSubmissions(selectedAssignment.id);
    }
  }, [selectedAssignment, isTeacher]);

  const fetchAssignments = async () => {
    try {
      const res = await client.get('lms/assignments/');
      const data = res.data.results || res.data;
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Assignment load error:', err);
      toast.error('Failed to load assignments');
      setAssignments([]);
    }
  };

  const fetchSubmissions = async (assignmentId: string) => {
    try {
      const res = await client.get(`lms/student-submissions/?assignment=${assignmentId}`);
      const data = res.data.results || res.data;
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load submissions');
    }
  };

  const handleGrade = async () => {
    if (!selectedSubmission) return;
    setIsSubmitting(true);
    try {
      await client.post(`lms/student-submissions/${selectedSubmission.id}/grade/`, gradingData);
      toast.success('Grade submitted successfully');
      setIsGradingModalOpen(false);
      setSelectedSubmission(null);
      if (selectedAssignment) fetchSubmissions(selectedAssignment.id);
      fetchAssignments();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit grade');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        // Don't append if value is null or empty string (for IDs)
        if (value !== null && value !== '') {
          data.append(key, value instanceof File ? value : String(value));
        }
      });

      await client.post('lms/assignments/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Assignment launched successfully!');
      setIsCreateModalOpen(false);
      setFormData({ subject: '', stream: '', title: '', description: '', due_date: '', max_score: 100, file: null, teacher: '' });
      fetchAssignments();
    } catch (err: any) {
      const errorMsg = err.response?.data?.teacher || 
                       err.response?.data?.detail || 
                       err.response?.data?.message || 
                       'Failed to create assignment';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Check required fields');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting assignment...');
    try {
      const data = new FormData();
      data.append('text_content', submissionText);
      if (submissionFile) {
        data.append('file', submissionFile);
      }

      await client.post(`lms/assignments/${selectedAssignment.id}/submit/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Assignment submitted successfully!', { id: toastId });
      setSelectedAssignment(null);
      setSubmissionText('');
      setSubmissionFile(null);
      fetchAssignments();
    } catch (err) {
      toast.error('Submission failed', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <BookOpen className="text-primary-400" />
            {isTeacher ? 'My Active Assignments' : 'Active Assignments'}
          </h2>
          {isTeacher && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 rounded-2xl px-6">
              <Plus className="w-5 h-5" />
              Prepare Assignment
            </Button>
          )}
        </div>

        {assignments.length === 0 ? (
           <div className="glass p-12 rounded-[32px] border border-white/5 text-center">
             <p className="text-primary-200/40 font-bold">No active assignments found.</p>
           </div>
        ) : assignments.map(assignment => (
          <div 
            key={assignment.id}
            onClick={() => setSelectedAssignment(assignment)}
            className={`glass p-6 rounded-[24px] border transition-all cursor-pointer group ${
              selectedAssignment?.id === assignment.id ? 'border-primary-500/50 bg-primary-500/5' : 'border-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-primary-400 transition-colors">{assignment.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-primary-200/50 font-bold uppercase tracking-wider">{assignment.subject_name}</span>
                    {assignment.stream_name && (
                      <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-400 font-bold">Class: {assignment.stream_name}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-400/10 px-3 py-1 rounded-full w-fit ml-auto">
                  <Clock className="w-3 h-3" />
                  Due: {new Date(assignment.due_date).toLocaleDateString()}
                </div>
                {isTeacher ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary-400 bg-primary-400/10 px-3 py-1 rounded-full w-fit ml-auto">
                    <Users className="w-3 h-3" />
                    {assignment.submission_count || 0} Submissions
                  </div>
                ) : (
                  assignment.status === 'graded' && assignment.student_grade !== null ? (
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                        Score: {assignment.student_grade}/{assignment.max_score}
                      </span>
                    </div>
                  ) : (
                    <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full w-fit ml-auto ${
                      assignment.status === 'submitted' ? 'bg-blue-500/10 text-blue-400' : 
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {assignment.status || 'Pending'}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail & Submission Form */}
      <div className="lg:col-span-1">
        <div className="glass p-8 rounded-[32px] border border-white/10 sticky top-8">
          {selectedAssignment ? (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">Assignment Detail</span>
                <h3 className="text-xl font-black text-white mt-1">{selectedAssignment.title}</h3>
                <p className="text-sm text-primary-200/60 mt-4 leading-relaxed">{selectedAssignment.description}</p>
                
                {selectedAssignment.file && (
                  <a 
                    href={getFileUrl(selectedAssignment.file)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center gap-2 text-xs font-bold text-primary-400 hover:text-primary-300 transition-all bg-primary-400/10 w-fit px-3 py-1.5 rounded-lg"
                  >
                    <Download className="w-4 h-4" />
                    Download Instructions Attachment
                  </a>
                )}
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-center flex-1">
                  <p className="text-[10px] text-primary-200/40 uppercase font-black">Max Points</p>
                  <p className="text-lg font-black text-white">{selectedAssignment.max_score}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center flex-1">
                  <p className="text-[10px] text-primary-200/40 uppercase font-black">{isTeacher ? 'Submissions' : 'Status'}</p>
                  {isTeacher ? (
                    <div className="text-lg font-black text-white">{selectedAssignment.submission_count || 0}</div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className={`text-xs font-black uppercase px-3 py-1 rounded-full inline-block mt-1 ${
                        selectedAssignment.status === 'graded' ? 'bg-emerald-500/10 text-emerald-400' : 
                        selectedAssignment.status === 'submitted' ? 'bg-blue-500/10 text-blue-400' : 
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {selectedAssignment.status || 'Pending'}
                      </div>
                      {selectedAssignment.status === 'graded' && selectedAssignment.student_grade !== null && (
                        <p className="text-lg font-black text-white mt-2">
                          {selectedAssignment.student_grade} <span className="text-[10px] text-slate-500">/ {selectedAssignment.max_score}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Student Feedback Section */}
              {!isTeacher && selectedAssignment.status === 'graded' && selectedAssignment.student_feedback && (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Teacher Feedback</h4>
                  <p className="text-sm text-white italic leading-relaxed">
                    "{selectedAssignment.student_feedback}"
                  </p>
                </div>
              )}

              {isTeacher && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h4 className="text-sm font-black text-white uppercase">Submissions</h4>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => fetchSubmissions(selectedAssignment.id)}
                      className="text-[10px] h-7"
                    >
                      Refresh List
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {submissions.length === 0 ? (
                      <p className="text-xs text-primary-200/40 py-4 text-center">No submissions yet.</p>
                    ) : submissions.map(sub => (
                      <div key={sub.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-primary-500/30 transition-all">
                        <div>
                          <p className="text-xs font-bold text-white">{sub.student_name}</p>
                          <p className="text-[10px] text-slate-500">{new Date(sub.submitted_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {sub.is_graded ? (
                            <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-400/10 px-2 py-0.5 rounded">
                              {sub.grade}/{sub.max_score}
                            </span>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setGradingData({ score: String(sub.grade || ''), feedback: sub.feedback || '' });
                                setIsGradingModalOpen(true);
                              }}
                              className="text-[10px] h-7 px-3 bg-primary-500 hover:bg-primary-600"
                            >
                              Grade
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isTeacher && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white/40 mb-2 block ml-1">Your Submission</label>
                    <textarea 
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Type your response here..."
                      className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all resize-none"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 mb-2 block ml-1">Attachment (Optional)</label>
                    <div 
                      onClick={() => document.getElementById('submission-file')?.click()}
                      className="flex items-center gap-3 p-4 border-2 border-dashed border-white/10 rounded-2xl hover:border-primary-500/30 cursor-pointer transition-all group"
                    >
                      <Upload className="w-5 h-5 text-white/30 group-hover:text-primary-400" />
                      <span className="text-xs font-bold text-white/40 group-hover:text-primary-200">
                        {submissionFile ? submissionFile.name : 'Attach files (PDF/Image)'}
                      </span>
                      <input 
                        id="submission-file"
                        type="file" 
                        className="hidden" 
                        onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black shadow-premium transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                    Submit Assignment
                  </button>
                </form>
              )}

            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChevronRight className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white font-bold">Select an assignment</p>
              <p className="text-sm text-primary-200/40 mt-2">Choose from the list to view details and {isTeacher ? 'review submissions.' : 'submit your work.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        title="Prepare New Assignment"
        className="max-w-2xl"
      >
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 ml-1">Subject</label>
              <select 
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Subject</option>
                {subjects.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-1 text-primary-400">Assigned Teacher</label>
                <select 
                  required
                  value={formData.teacher}
                  onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                  className="w-full bg-slate-800 border border-primary-500/30 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.full_name || `${t.first_name} ${t.last_name}`}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Target Class</label>
            <select 
              value={formData.stream}
              onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Class</option>
              {grades.map((g: any) => (
                <optgroup key={g.id} label={g.name}>
                  {g.streams.map((s: any) => (
                    <option key={s.id} value={s.id}>{g.name} {s.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Assignment Title</label>
            <input 
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Introduction to Quadratic Equations"
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Description & Instructions</label>
            <textarea 
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-32 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Provide detailed instructions for the students..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Attachment (PDF/Image)</label>
            <input 
              type="file"
              onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 ml-1">Due Date</label>
              <input 
                required
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 ml-1">Max Score</label>
              <input 
                required
                type="number"
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>


          <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest">
            {isSubmitting ? 'Creating...' : 'Launch Assignment'}
          </Button>
        </form>
      </Modal>
      {/* Grading Modal */}
      <Modal 
        isOpen={isGradingModalOpen} 
        onClose={() => setIsGradingModalOpen(false)}
        title={`Grade Submission: ${selectedSubmission?.student_name}`}
      >
        <div className="space-y-6">
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-2">Student Response</h4>
            <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
              {selectedSubmission?.text_content || "No text provided."}
            </p>
            {selectedSubmission?.file && (
              <a 
                href={getFileUrl(selectedSubmission.file)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 text-xs font-bold text-primary-400 hover:text-primary-300 transition-all bg-primary-400/10 w-fit px-3 py-1.5 rounded-lg"
              >
                <Download className="w-4 h-4" />
                Download Attachment
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 ml-1">Score (Max: {selectedSubmission?.max_score})</label>
              <input 
                type="number"
                value={gradingData.score}
                onChange={(e) => setGradingData({ ...gradingData, score: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-end">
              <p className="text-[10px] text-slate-500 mb-4 ml-2 italic">Student will see this score instantly.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 ml-1">Feedback</label>
            <textarea 
              value={gradingData.feedback}
              onChange={(e) => setGradingData({ ...gradingData, feedback: e.target.value })}
              placeholder="Good work! Pay attention to..."
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 text-white outline-none focus:ring-2 focus:ring-primary-500 h-32 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="ghost" 
              onClick={() => setIsGradingModalOpen(false)} 
              className="flex-1 rounded-2xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleGrade}
              isLoading={isSubmitting}
              className="flex-1 bg-primary-500 hover:bg-primary-600 rounded-2xl font-black uppercase tracking-widest text-xs"
            >
              Submit Grade
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
