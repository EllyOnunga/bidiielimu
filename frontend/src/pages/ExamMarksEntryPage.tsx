import { useState, useEffect } from 'react';
import { Save, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import client from '../api/client';
import { examsService } from '../api/services/examsService';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { TableSkeleton } from '../components/ui/Skeleton';

interface StudentData {
  id: number;
  name: string;
  admission: string;
  score: number;
}

export const ExamMarksEntryPage = () => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [exams, setExams] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('');

  const updateScore = (id: number, score: string) => {
    const val = parseFloat(score) || 0;
    setStudents(prev => prev.map(s => s.id === id ? { ...s, score: val } : s));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examsDataRaw, assignmentsRes] = await Promise.all([
        examsService.getExams(),
        client.get('classes/subject-assignments/')
      ]);
      
      const examsData = Array.isArray(examsDataRaw) ? examsDataRaw : (examsDataRaw.results || []);
      const assData = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : (assignmentsRes.data.results || []);
      
      setExams(examsData);
      setAssignments(assData);
      
      if (examsData.length > 0) setSelectedExam(examsData[0].id.toString());
      if (assData.length > 0) {
        setSelectedSubject(assData[0].subject.toString());
        setSelectedStream(assData[0].stream.toString());
      }
    } catch (error) {
      toast.error('Failed to initialize page');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsAndMarks = async () => {
    if (!selectedStream || !selectedSubject || !selectedExam) return;
    
    try {
      setFetchingStudents(true);
      const [studentsRes, marksRes] = await Promise.all([
        client.get(`/students/?stream=${selectedStream}`),
        client.get(`exams/marks/?exam=${selectedExam}&subject=${selectedSubject}`)
      ]);
      
      const studentsData = Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data.results || []);
      const existingMarks = Array.isArray(marksRes.data) ? marksRes.data : (marksRes.data.results || []);
      
      const mapped = studentsData.map((s: any) => {
        const mark = existingMarks.find((m: any) => m.student === s.id);
        return {
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          admission: s.admission_number,
          score: mark ? parseFloat(mark.score) : 0
        };
      });
      setStudents(mapped);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setFetchingStudents(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchStudentsAndMarks();
  }, [selectedExam, selectedSubject, selectedStream]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await client.post('exams/marks/bulk_save/', {
        exam: selectedExam,
        subject: selectedSubject,
        marks: students.map(s => ({
          student_id: s.id,
          score: s.score
        }))
      });
      toast.success('Marks saved successfully!');
    } catch (error) {
      toast.error('Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      <Breadcrumbs />
      
      <div className="flex items-center gap-4">
        <Link to="/exams" className="p-2 hover:bg-slate-800 rounded-xl transition-all">
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Record Marks</h1>
          <p className="text-slate-400 text-sm md:text-base">Subject: {selectedSubject}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="glass-dark p-5 md:p-6 rounded-3xl border border-white/5 space-y-3 md:space-y-4">
          <label className="block text-xs md:text-sm font-medium text-slate-400 font-bold uppercase tracking-widest">Examination</label>
          <select 
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 md:py-3 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
          >
            {loading ? (
              <option value="">Loading examinations...</option>
            ) : exams.length === 0 ? (
              <option value="">No exams found</option>
            ) : (
              <>
                <option value="">Select an examination</option>
                {exams.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.academic_year})</option>
                ))}
              </>
            )}
          </select>
        </div>

        <div className="glass-dark p-5 md:p-6 rounded-3xl border border-white/5 space-y-3 md:space-y-4">
          <label className="block text-xs md:text-sm font-medium text-slate-400 font-bold uppercase tracking-widest">Subject & Class</label>
          <select 
            value={`${selectedSubject}-${selectedStream}`}
            onChange={(e) => {
              const [subjectId, streamId] = e.target.value.split('-');
              setSelectedSubject(subjectId);
              setSelectedStream(streamId);
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 md:py-3 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
          >
            {loading ? (
              <option value="">Loading subjects...</option>
            ) : assignments.length === 0 ? (
              <option value="">No subjects assigned</option>
            ) : (
              <>
                <option value="">Select subject & class</option>
                {assignments.map(as => (
                  <option key={as.id} value={`${as.subject}-${as.stream}`}>
                    {as.subject_name} - {as.grade_name} {as.stream_name}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        <div className="glass-dark p-5 md:p-6 rounded-3xl border border-white/5 flex items-end sm:col-span-2 lg:col-span-2">
          <button 
            onClick={handleSave}
            disabled={saving || fetchingStudents}
            className="w-full py-2.5 md:py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save All Marks'}
          </button>
        </div>
      </div>

      <div className="glass-dark rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 md:px-8 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Student Details</th>
                <th className="px-6 md:px-8 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Score (out of 100)</th>
                <th className="px-6 md:px-8 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading || fetchingStudents ? (
                <TableSkeleton rows={10} cols={3} />
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-20 text-slate-500 italic">
                    Select a subject and class to start recording marks.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={student.id} 
                    className="hover:bg-white/[0.02] transition-all"
                  >
                    <td className="px-6 md:px-8 py-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary-500/10 flex items-center justify-center text-[10px] md:text-xs font-bold text-primary-400 shrink-0">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{student.name}</p>
                          <p className="text-xs text-slate-500 truncate">{student.admission}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 md:px-8 py-4">
                      <div className="flex justify-center">
                        <input 
                          type="number"
                          value={student.score}
                          onChange={(e) => updateScore(student.id, e.target.value)}
                          className="w-20 md:w-24 text-center bg-slate-800/50 border border-slate-700 rounded-xl px-3 md:px-4 py-1.5 md:py-2 text-white font-bold outline-none focus:ring-2 focus:ring-primary-500 text-sm md:text-base"
                          min="0"
                          max="100"
                        />
                      </div>
                    </td>
                    <td className="px-6 md:px-8 py-4">
                      <span className={`px-2 md:px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold border ${
                        student.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        student.score >= 60 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {student.score >= 80 ? 'A' : student.score >= 70 ? 'B+' : student.score >= 60 ? 'B' : 'C'}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
