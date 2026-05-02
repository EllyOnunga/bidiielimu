import { useState, useEffect } from 'react';
import { 
  FileText, BrainCircuit, CheckCircle, Save, 
  Download, ChevronRight, User, AlertCircle, Edit3, Loader2 
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface StudentReport {
  id: string;
  student_name: string;
  exam_name: string;
  ai_comment_draft: string;
  teacher_comment: string;
  status: 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'PUBLISHED';
}

export const ReportCardManager = () => {
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<StudentReport | null>(null);
  const [comment, setComment] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get('/api/v1/reports/student-reports/');
      setReports(res.data);
    } catch (err) {
      toast.error('Failed to load reports');
    }
  };

  const handleGenerateAI = async (id: string) => {
    setIsGenerating(true);
    try {
      const res = await axios.post(`/api/v1/reports/student-reports/${id}/generate_ai_draft/`);
      setComment(res.data.draft);
      toast.success('AI Draft Generated!');
    } catch (err) {
      toast.error('AI Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await axios.post(`/api/v1/reports/student-reports/${id}/approve/`, {
        teacher_comment: comment
      });
      toast.success('Report Approved!');
      fetchReports();
      setSelectedReport(null);
    } catch (err) {
      toast.error('Failed to approve report');
    }
  };

  const exportPDF = async () => {
    const element = document.getElementById('report-preview');
    if (!element) return;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    pdf.save(`ReportCard_${selectedReport?.student_name}.pdf`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-120px)]">
      {/* Student List */}
      <div className="w-full lg:w-96 glass rounded-[32px] border border-white/5 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary-400" />
            Class Reports
          </h2>
          <p className="text-primary-200/40 text-xs font-bold uppercase tracking-widest mt-1">Term 2 - 2024</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {reports.map((report) => (
            <button 
              key={report.id}
              onClick={() => {
                setSelectedReport(report);
                setComment(report.teacher_comment || report.ai_comment_draft || '');
              }}
              className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                selectedReport?.id === report.id 
                ? 'bg-primary-500 border-primary-400 shadow-premium' 
                : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-left">
                <p className={`font-bold ${selectedReport?.id === report.id ? 'text-white' : 'text-primary-100'}`}>
                  {report.student_name}
                </p>
                <p className={`text-[10px] font-black uppercase tracking-widest ${selectedReport?.id === report.id ? 'text-white/60' : 'text-primary-200/30'}`}>
                  {report.status}
                </p>
              </div>
              <ChevronRight className={`w-4 h-4 ${selectedReport?.id === report.id ? 'text-white' : 'text-white/20'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="flex-1 glass rounded-[48px] border border-white/10 overflow-hidden flex flex-col relative shadow-2xl">
        {selectedReport ? (
          <div className="flex flex-col h-full" id="report-preview">
            <div className="p-10 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-primary-400">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{selectedReport.student_name}</h3>
                  <p className="text-primary-200/40 font-bold uppercase tracking-widest text-xs mt-1">Terminal Narrative Editor</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => handleGenerateAI(selectedReport.id)}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-white/10 transition-all"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5 text-purple-400" />}
                  AI Draft
                </button>
                <button 
                  onClick={exportPDF}
                  className="p-3 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-10 space-y-8 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-4">
                  <label className="text-xs font-black text-primary-200/30 uppercase tracking-widest">Narrative Comment</label>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-2">
                    <CheckCircle className="w-3 h-3" />
                    AI Ready
                  </span>
                </div>
                <div className="relative">
                  <Edit3 className="absolute top-6 left-6 w-5 h-5 text-primary-200/20" />
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Enter final teacher comment here or use AI to draft one..."
                    className="w-full h-64 bg-white/[0.03] border border-white/10 rounded-[32px] p-10 pl-16 text-white text-lg leading-relaxed focus:ring-4 focus:ring-primary-500/20 transition-all outline-none resize-none shadow-inner"
                  />
                </div>
              </div>

              <div className="bg-primary-500/5 border border-primary-500/10 p-6 rounded-3xl flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                <p className="text-sm text-primary-200/60 leading-relaxed italic">
                  Tip: Use the AI Draft button to generate a comment based on student's actual grades. 
                  You can edit the draft to include personal observations before approving.
                </p>
              </div>
            </div>

            <div className="p-8 bg-white/[0.01] border-t border-white/5">
              <button 
                onClick={() => handleApprove(selectedReport.id)}
                className="w-full py-5 bg-emerald-500 text-white rounded-[24px] font-black text-xl flex items-center justify-center gap-3 hover:bg-emerald-400 shadow-premium transition-all transform hover:scale-[1.02]"
              >
                Approve & Save Report
                <Save className="w-6 h-6" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-6">
            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center text-white/10">
              <FileText className="w-16 h-16" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">Select a Student</h3>
              <p className="text-primary-200/30 font-medium max-w-xs mt-2">
                Choose a student from the list to start drafting their terminal report narrative.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
