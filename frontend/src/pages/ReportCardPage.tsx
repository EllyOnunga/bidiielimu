import { useState, useEffect } from 'react';
import { Download, ChevronLeft, Printer, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import client from '../api/client';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Skeleton } from '../components/ui/Skeleton';
import { notificationsService } from '../api/services/notificationsService';

interface MarkRow {
  subject_id: number;
  subject_name: string;
  score: number;
  grade: string;
  points: number;
  remarks: string;
}

interface StudentInfo {
  name: string;
  admission: string;
  class: string;
  class_teacher: string;
  email: string;
  parent_name: string;
  parent_phone: string;
  photo: string | null;
  term: string;
  academic_year: string;
  marks: MarkRow[];
  summary: {
    total_score: number;
    mean_score: number;
    total_points: number;
    mean_grade: string;
    overall_remarks: string;
  }
}

export const ReportCardPage = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { id: studentId } = useParams();

  const [studentData, setStudentData] = useState<StudentInfo>({
    name: '',
    admission: '',
    class: '',
    class_teacher: '',
    email: '',
    parent_name: '',
    parent_phone: '',
    photo: null,
    term: '',
    academic_year: '',
    marks: [],
    summary: {
      total_score: 0,
      mean_score: 0,
      total_points: 0,
      mean_grade: '',
      overall_remarks: '',
    }
  });

  const [schoolInfo, setSchoolInfo] = useState({
    name: '',
    address: '',
    email: '',
    logo: null as string | null,
    principalName: '',
    motto: '',
    accentColor: '#6366f1'
  });

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        if (!studentId) return;
        const [reportRes, settingsRes] = await Promise.all([
          client.get(`students/${studentId}/report_card/`),
          client.get('schools/settings/')
        ]);
        
        setStudentData({
          name: reportRes.data.student.name,
          admission: reportRes.data.student.admission_number,
          class: reportRes.data.student.grade_level ? `${reportRes.data.student.grade_level} ${reportRes.data.student.stream || ''}` : '',
          class_teacher: reportRes.data.student.class_teacher || '',
          email: reportRes.data.student.email || '',
          parent_name: reportRes.data.student.parent_name || '',
          parent_phone: reportRes.data.student.parent_phone || '',
          photo: reportRes.data.student.photo || null,
          term: reportRes.data.exam.term,
          academic_year: reportRes.data.exam.academic_year,
          marks: reportRes.data.results,
          summary: reportRes.data.summary,
        });

        if (settingsRes.data) {
          setSchoolInfo({
            name: settingsRes.data.school_name || '',
            address: settingsRes.data.school_address || '',
            email: settingsRes.data.school_email || '',
            logo: settingsRes.data.school_logo,
            principalName: settingsRes.data.principal_name || '',
            motto: settingsRes.data.school_motto || 'Striving for Excellence',
            accentColor: settingsRes.data.accent_color || '#6366f1'
          });
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          toast.error(err.response?.data?.detail || 'No results found for this student.');
        } else {
          toast.error('Failed to load report data');
        }
      } finally {
        setFetching(false);
      }
    };
      
    fetchReportData();
  }, [studentId]);

  const generatePDF = async () => {
    setLoading(true);
    const element = document.getElementById('report-card');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Report_Card_${studentData.admission}.pdf`);
      
      toast.success('Report card downloaded!');
      
      // Add a notification for the activity
      await notificationsService.getAll(); // Refresh
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <Breadcrumbs />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/students" className="p-2 hover:bg-slate-800 rounded-xl transition-all">
            <ChevronLeft className="w-6 h-6 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Academic Report</h1>
            <p className="text-slate-400 text-sm">{fetching ? <Skeleton className="w-48 h-4 inline-block" /> : `Viewing results for ${studentData.name}`}</p>
          </div>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 hover:bg-slate-700 transition-all text-sm">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={generatePDF}
            disabled={loading || fetching}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 text-sm"
          >
            <Download className="w-4 h-4" />
            {loading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <div
          id="report-card"
          className="w-full max-w-4xl bg-white text-slate-900 p-12 rounded-lg shadow-2xl space-y-10"
        >
          {/* School Header */}
          <div className="flex items-center justify-between border-b-2 pb-8" style={{ borderColor: schoolInfo.accentColor }}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl overflow-hidden" style={{ backgroundColor: schoolInfo.accentColor }}>
                {schoolInfo.logo ? (
                  <img src={schoolInfo.logo} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  schoolInfo.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase" style={{ color: schoolInfo.accentColor }}>{schoolInfo.name}</h2>
                <p className="text-sm text-slate-500 italic font-medium">"{schoolInfo.motto}"</p>
                <p className="text-xs text-slate-400 font-medium mt-1">{schoolInfo.address} • {schoolInfo.email}</p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-bold text-slate-800 uppercase tracking-widest">Official Report Card</h3>
              <p className="text-sm font-bold" style={{ color: schoolInfo.accentColor }}>{studentData.term}</p>
            </div>
          </div>

          {/* Student Info */}
          <div className="flex gap-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="w-32 h-32 bg-slate-200 rounded-lg overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
              {studentData.photo ? (
                <img src={studentData.photo} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                  <Users className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 flex-1">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Name</p>
                <p className="text-lg font-black text-slate-800">{studentData.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admission No.</p>
                <p className="text-lg font-black text-slate-800">{studentData.admission}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class / Level</p>
                <p className="text-sm font-bold text-slate-600">{studentData.class}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Academic Year</p>
                <p className="text-sm font-bold text-slate-600">{studentData.academic_year}</p>
              </div>
            </div>
          </div>

          {/* Marks Table */}
          <div className="overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead>
                <tr className="text-white" style={{ backgroundColor: schoolInfo.accentColor }}>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-widest">Subject</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-widest text-center">Score</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-widest text-center">Grade</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-widest">Teacher's Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {fetching ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="w-32 h-4" /></td>
                      <td className="px-6 py-4 text-center"><Skeleton className="w-12 h-4 mx-auto" /></td>
                      <td className="px-6 py-4 text-center"><Skeleton className="w-8 h-6 mx-auto rounded-lg" /></td>
                      <td className="px-6 py-4"><Skeleton className="w-48 h-4" /></td>
                    </tr>
                  ))
                ) : studentData.marks.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No results recorded yet.</td></tr>
                ) : (
                  studentData.marks.map((m, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-6 py-4 font-bold text-slate-800">{m.subject_name}</td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-primary-700">{m.score}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-lg font-bold">
                          {m.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm italic text-slate-600">{m.remarks}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <td className="px-6 py-4">OVERALL AVERAGE</td>
                  <td className="px-6 py-4 text-center text-xl" style={{ color: schoolInfo.accentColor }}>{studentData.summary.mean_score}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 text-white rounded-lg font-bold" style={{ backgroundColor: schoolInfo.accentColor }}>
                      {studentData.summary.mean_grade}
                    </span>
                  </td>
                  <td className="px-6 py-4">{studentData.summary.overall_remarks}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Signatures */}
          <div className="grid grid-cols-3 gap-12 pt-12 border-t border-slate-100">
            <div className="text-center space-y-4">
              <div className="h-16 flex items-end justify-center border-b border-slate-300 pb-1">
                <p className="text-sm font-bold text-slate-800">{studentData.class_teacher || 'Class Teacher'}</p>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Class Teacher</p>
            </div>
            <div className="text-center space-y-4">
              <div className="h-16 flex items-end justify-center border-b border-slate-300 pb-1">
                <p className="text-sm font-serif italic text-slate-700">{schoolInfo.principalName}</p>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Principal</p>
            </div>
            <div className="text-center space-y-4">
              <div className="h-16 flex items-end justify-center border-b border-slate-300 pb-1">
                <p className="text-xs text-slate-400 font-bold">{new Date().toLocaleDateString()}</p>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date of Issue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
