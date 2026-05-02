import { useState, useEffect } from 'react';
import { BookOpen, Clock, FileText, Upload, Send, ChevronRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Assignment {
  id: string;
  title: string;
  subject_name: string;
  due_date: string;
  max_score: number;
  description: string;
}

export const AssignmentList = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await axios.get('/api/v1/lms/assignments/');
      setAssignments(res.data);
    } catch (err) {
      toast.error('Failed to load assignments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting assignment...');
    try {
      await axios.post(`/api/v1/lms/assignments/${selectedAssignment.id}/submit/`, {
        text_content: submissionText
      });
      toast.success('Assignment submitted successfully!', { id: toastId });
      setSelectedAssignment(null);
      setSubmissionText('');
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
        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
          <BookOpen className="text-primary-400" />
          Active Assignments
        </h2>
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
                  <p className="text-sm text-primary-200/50">{assignment.subject_name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-400/10 px-3 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  Due: {new Date(assignment.due_date).toLocaleDateString()}
                </div>
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
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-center flex-1">
                  <p className="text-[10px] text-primary-200/40 uppercase font-black">Max Points</p>
                  <p className="text-lg font-black text-white">{selectedAssignment.max_score}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center flex-1">
                  <p className="text-[10px] text-primary-200/40 uppercase font-black">Status</p>
                  <p className="text-xs font-black text-amber-400 uppercase">Pending</p>
                </div>
              </div>

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
                
                <div className="flex items-center gap-3 p-4 border-2 border-dashed border-white/10 rounded-2xl hover:border-primary-500/30 cursor-pointer transition-all group">
                  <Upload className="w-5 h-5 text-white/30 group-hover:text-primary-400" />
                  <span className="text-xs font-bold text-white/40 group-hover:text-primary-200">Attach files (Optional)</span>
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
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChevronRight className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white font-bold">Select an assignment</p>
              <p className="text-sm text-primary-200/40 mt-2">Choose from the list to view details and submit your work.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
