import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, AlertCircle, Save, Calendar, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TableSkeleton } from '../components/ui/Skeleton';
import { classesService } from '../api/services/classesService';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export const AttendancePage = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStream, setSelectedStream] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: () => classesService.getGrades(),
    select: (data) => Array.isArray(data) ? data : (data.results || []),
  });

  const { data: attendanceData = [], isFetching: loadingAttendance } = useQuery({
    queryKey: ['attendance', selectedDate, selectedStream],
    queryFn: async () => {
      if (!selectedStream) return [];
      const res = await client.get(`attendance/daily/?date=${selectedDate}`);
      return Array.isArray(res.data) ? res.data : (res.data.results || []);
    },
    enabled: !!selectedStream,
  });

  const { data: studentList = [], isFetching: loadingStudents } = useQuery({
    queryKey: ['students', selectedStream],
    queryFn: async () => {
      if (!selectedStream) return [];
      const res = await client.get(`students/?stream=${selectedStream}`);
      return Array.isArray(res.data) ? res.data : (res.data.results || []);
    },
    enabled: !!selectedStream,
  });

  useEffect(() => {
    if (studentList.length > 0) {
      const mapped = studentList.map((s: any) => {
        const record = attendanceData.find((a: any) => a.student === s.id);
        return {
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          admission: s.admission_number,
          status: record ? record.status : 'PRESENT'
        };
      });
      setStudents(mapped);
    } else {
      setStudents([]);
    }
  }, [studentList, attendanceData]);

  const updateStatus = (id: number, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const markAll = (status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await client.post('attendance/daily/bulk_mark/', {
        date: selectedDate,
        records: students.map(s => ({
          student_id: s.id,
          status: s.status
        }))
      });
      toast.success('Attendance recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    } catch (err) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.admission.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Attendance Tracking</h1>
          <p className="text-slate-400">Mark and track daily student attendance.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
            onClick={() => markAll('PRESENT')}
          >
            Mark All Present
          </Button>
          <Button onClick={handleSave} disabled={saving || !selectedStream} className="gap-2">
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Records'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-dark p-6 rounded-3xl border border-white/5 space-y-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700"
            />
          </div>
        </div>

        <div className="glass-dark p-6 rounded-3xl border border-white/5 space-y-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Class</label>
          <select
            value={selectedStream}
            onChange={(e) => setSelectedStream(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500 h-[42px]"
          >
            <option value="">Choose a class...</option>
            {grades.map((g: any) => (
              <optgroup key={g.id} label={g.name}>
                {g.streams.map((s: any) => (
                  <option key={s.id} value={s.id}>{g.name} {s.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="glass-dark p-6 rounded-3xl border border-white/5 space-y-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Search Student</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Name or Admission No."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700"
            />
          </div>
        </div>
      </div>

      <div className="glass-dark rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Attendance Status</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loadingStudents || loadingAttendance ? (
                <TableSkeleton rows={10} cols={3} />
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-20 text-slate-500 italic">
                    {selectedStream ? 'No students found in this class.' : 'Select a class to mark attendance.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center text-xs font-bold text-primary-400">
                          {s.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-primary-400 transition-colors">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.admission}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        <StatusButton
                          active={s.status === 'PRESENT'}
                          type="PRESENT"
                          icon={CheckCircle2}
                          label="Present"
                          onClick={() => updateStatus(s.id, 'PRESENT')}
                        />
                        <StatusButton
                          active={s.status === 'ABSENT'}
                          type="ABSENT"
                          icon={XCircle}
                          label="Absent"
                          onClick={() => updateStatus(s.id, 'ABSENT')}
                        />
                        <StatusButton
                          active={s.status === 'LATE'}
                          type="LATE"
                          icon={Clock}
                          label="Late"
                          onClick={() => updateStatus(s.id, 'LATE')}
                        />
                        <StatusButton
                          active={s.status === 'EXCUSED'}
                          type="EXCUSED"
                          icon={AlertCircle}
                          label="Excused"
                          onClick={() => updateStatus(s.id, 'EXCUSED')}
                        />
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right text-xs text-slate-500">
                      {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatusButton = ({ active, type, icon: Icon, label, onClick }: any) => {
  const activeColors = {
    PRESENT: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
    ABSENT: 'bg-rose-500 text-white shadow-lg shadow-rose-500/20',
    LATE: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20',
    EXCUSED: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${active ? activeColors[type as keyof typeof activeColors] : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
        }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};
