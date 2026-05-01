import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Users, UserPlus, FileText, MoreHorizontal,
  BookOpen, CheckCircle2, XCircle, Search,
} from 'lucide-react';
import { motion } from 'framer-motion';
import client from '../api/client';
import toast from 'react-hot-toast';

interface Student {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  gender: string;
  parent_name: string;
  parent_phone: string;
  is_active: boolean;
  stream_name: string;
  grade_name: string;
}

interface StreamInfo {
  id: number;
  name: string;
  grade_level_name: string;
  teacher_name: string | null;
  student_count: number;
}

export const ClassDetailPage = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const [streamRes, studentsRes] = await Promise.all([
        client.get(`/classes/streams/${streamId}/`),
        client.get(`/students/?stream=${streamId}`),
      ]);
      setStreamInfo(streamRes.data);
      const studentData = Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data.results || []);
      setStudents(studentData);
    } catch (error) {
      console.error('Failed to load class data', error);
      toast.error('Failed to load class data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [streamId]);

  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    s.admission_number.toLowerCase().includes(search.toLowerCase())
  );

  const breadcrumb = streamInfo
    ? `${streamInfo.grade_level_name} — ${streamInfo.name}`
    : 'Loading...';

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/classes')} className="p-2 hover:bg-slate-800 rounded-xl transition-all">
            <ChevronLeft className="w-6 h-6 text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-1">
              <span className="hover:text-primary-400 cursor-pointer" onClick={() => navigate('/classes')}>Classes</span>
              <span>›</span>
              <span className="text-primary-400">{breadcrumb}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {streamInfo ? `${streamInfo.grade_level_name} ${streamInfo.name}` : 'Loading...'}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {streamInfo?.teacher_name ? `Class Teacher: ${streamInfo.teacher_name}` : 'No class teacher assigned'}
              {' · '}
              <span className="text-primary-400 font-bold">{streamInfo?.student_count ?? 0} students</span>
            </p>
          </div>
        </div>

        <Link
          to="/students"
          className="flex items-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary-900/20"
        >
          <UserPlus className="w-5 h-5" />
          Add Student
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: students.length, icon: Users, color: 'bg-primary-500/10 text-primary-400' },
          { label: 'Active', value: students.filter(s => s.is_active).length, icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-400' },
          { label: 'Inactive', value: students.filter(s => !s.is_active).length, icon: XCircle, color: 'bg-rose-500/10 text-rose-400' },
          { label: 'Subjects', value: '—', icon: BookOpen, color: 'bg-amber-500/10 text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="glass-dark p-5 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">{stat.label}</p>
              <p className="text-2xl font-black text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Student Table */}
      <div className="glass-dark rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or admission no..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Adm No</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Parent Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading students...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No students in this class yet.</p>
                    <Link to="/students" className="text-primary-400 text-sm hover:underline mt-2 inline-block">
                      Add the first student →
                    </Link>
                  </td>
                </tr>
              ) : (
                filtered.map((student, idx) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-white/[0.02] transition-all group"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-primary-400">{student.admission_number}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                        <span className="text-sm font-semibold text-white">{student.first_name} {student.last_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : 'Other'}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-300">{student.parent_name}</div>
                      <div className="text-xs text-slate-500">{student.parent_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${student.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/students/${student.id}/report`}
                          className="p-2 hover:bg-primary-500/10 text-slate-400 hover:text-primary-400 rounded-lg transition-all"
                          title="View Report Card"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>
                        <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-all">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
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
