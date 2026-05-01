import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Book, Wallet, ClipboardList, CheckSquare,
  ChevronRight, Calendar, User, ArrowRight,
  TrendingUp, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import client from '../api/client';
import { useAuthStore } from '../store/authStore';
import { TableSkeleton } from '../components/ui/Skeleton';

interface PortalStatProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  to?: string;
  trend?: string;
}

const PortalStat = ({ label, value, icon: Icon, color, to, trend }: PortalStatProps) => {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-dark p-6 rounded-3xl border border-white/5 hover:border-primary-500/30 transition-all group relative overflow-hidden h-full"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 -mr-8 -mt-8 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors" />
      <div className={`p-3 rounded-2xl ${color} w-fit mb-4 group-hover:scale-110 transition-transform relative z-10`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="relative z-10">
        <p className="text-sm text-slate-400 font-medium mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black text-white">{value}</p>
          {trend && <span className="text-[10px] font-bold text-emerald-400">{trend}</span>}
        </div>
      </div>
    </motion.div>
  );

  return to ? <Link to={to} className="block">{content}</Link> : content;
};

export const PortalDashboard = () => {
  const user = useAuthStore(state => state.user);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // Fetch children if parent
  const { data: children = [], isLoading: loadingChildren } = useQuery({
    queryKey: ['my-children'],
    queryFn: async () => {
      const res = await client.get('students/my_children/');
      return res.data;
    },
    enabled: user?.role === 'PARENT'
  });

  // Fetch self if student
  const { data: studentProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const res = await client.get('students/');
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      return data[0];
    },
    enabled: user?.role === 'STUDENT'
  });

  useEffect(() => {
    if (user?.role === 'PARENT' && children.length > 0 && !selectedStudentId) {
      setSelectedStudentId(children[0].id);
    } else if (user?.role === 'STUDENT' && studentProfile) {
      setSelectedStudentId(studentProfile.id);
    }
  }, [children, studentProfile, user, selectedStudentId]);

  const activeStudent = user?.role === 'PARENT'
    ? children.find((c: any) => c.id === selectedStudentId)
    : studentProfile;

  // Academic Summary
  const { data: reportCard, isLoading: loadingAcademic } = useQuery({
    queryKey: ['portal-report', selectedStudentId],
    queryFn: async () => {
      const res = await client.get(`students/${selectedStudentId}/report_card/`);
      return res.data;
    },
    enabled: !!selectedStudentId
  });

  // Attendance Stats
  const { data: attendanceStats, isLoading: loadingAttendance } = useQuery({
    queryKey: ['portal-attendance', selectedStudentId],
    queryFn: async () => {
      const res = await client.get(`attendance/daily/stats/`); // This is global, but ideally we'd have student specific stats
      return res.data;
    },
    enabled: !!selectedStudentId
  });

  // Fee Balance
  const { data: feeBalances = [] } = useQuery({
    queryKey: ['portal-fees'],
    queryFn: async () => {
      const res = await client.get('fees/payments/student_balances/');
      return Array.isArray(res.data) ? res.data : (res.data.results || []);
    },
    enabled: !!selectedStudentId
  });

  const myBalance = feeBalances.find((b: any) => b.student_id === selectedStudentId);

  // Schedule
  const { data: schedule = [] } = useQuery({
    queryKey: ['portal-schedule', activeStudent?.stream],
    queryFn: async () => {
      const res = await client.get(`classes/schedule-slots/?stream=${activeStudent?.stream}`);
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      return data.slice(0, 4);
    },
    enabled: !!activeStudent?.stream
  });

  if (loadingChildren || loadingProfile) {
    return <div className="p-8 text-center text-slate-500">Initializing Portal...</div>;
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Header & Child Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {user?.role === 'PARENT' ? 'Parent Portal' : 'Student Portal'}
          </h1>
          <p className="text-slate-400">Welcome back, {user?.first_name || 'User'}!</p>
        </div>

        {user?.role === 'PARENT' && children.length > 1 && (
          <div className="flex gap-2 p-1.5 bg-slate-800/50 rounded-2xl border border-white/5 self-start overflow-x-auto max-w-full no-scrollbar">
            {children.map((child: any) => (
              <button
                key={child.id}
                onClick={() => setSelectedStudentId(child.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${selectedStudentId === child.id
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {child.first_name}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeStudent && (
            <motion.div
              key={activeStudent.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-4 bg-white/5 p-3 pr-6 rounded-3xl border border-white/5 shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-black text-lg overflow-hidden border-2 border-white/10 shadow-inner">
                {activeStudent.photo ? (
                  <img src={activeStudent.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  activeStudent.first_name[0] + activeStudent.last_name[0]
                )}
              </div>
              <div>
                <p className="text-sm font-black text-white">{activeStudent.first_name} {activeStudent.last_name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">{activeStudent.admission_number}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{activeStudent.stream_name || 'No Class'}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <PortalStat
          label="Attendance"
          value={loadingAttendance ? '...' : (attendanceStats?.avg || '0%')}
          icon={CheckSquare}
          color="bg-emerald-500/20"
          to="/attendance"
          trend={attendanceStats?.date ? `As of ${attendanceStats.date}` : ''}
        />
        <PortalStat
          label="Academic Mean"
          value={reportCard?.summary?.mean_grade || '—'}
          icon={TrendingUp}
          color="bg-blue-500/20"
          to="/exams"
          trend={reportCard?.summary?.mean_score ? `${reportCard.summary.mean_score} pts` : ''}
        />
        <PortalStat
          label="Fee Balance"
          value={myBalance ? `KSh ${parseFloat(myBalance.balance).toLocaleString()}` : '0.00'}
          icon={Wallet}
          color="bg-rose-500/20"
          to="/fees"
        />
        <PortalStat
          label="Library Books"
          value="2"
          icon={Book}
          color="bg-purple-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Exam Results */}
          <div className="glass-dark rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h2 className="text-xl font-black text-white">Recent Performance</h2>
                <p className="text-sm text-slate-500">Breakdown of the latest examination scores.</p>
              </div>
              <Link to="/exams" className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="p-0">
              {loadingAcademic ? (
                <div className="p-8"><TableSkeleton rows={3} cols={3} /></div>
              ) : !reportCard?.results?.length ? (
                <div className="p-12 text-center text-slate-500 italic">No exam results available yet.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {reportCard.results.slice(0, 4).map((res: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-slate-500 group-hover:text-primary-400 transition-colors">
                          {res.subject_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-white">{res.subject_name}</p>
                          <p className="text-xs text-slate-500">{res.remarks || 'No remarks'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-white">{res.score}%</span>
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border ${res.grade === 'A' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              res.grade === 'B' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                'bg-slate-800 text-slate-400 border-white/5'
                            }`}>
                            {res.grade}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="glass-dark p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-white">Today's Schedule</h2>
                <p className="text-sm text-slate-500">Upcoming classes and activities.</p>
              </div>
              <div className="p-3 bg-primary-600/10 rounded-2xl text-primary-400">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schedule.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-slate-500 italic">No classes scheduled for today.</div>
              ) : (
                schedule.map((slot: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                    <div className="text-center w-16 px-3 border-r border-white/10">
                      <p className="text-[10px] font-black text-slate-500 uppercase">Starts</p>
                      <p className="text-sm font-black text-primary-400">{slot.start_time.slice(0, 5)}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-white group-hover:text-primary-400 transition-colors truncate">{slot.subject_name}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{slot.teacher_name || 'TBA'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="glass-dark p-8 rounded-[2.5rem] border border-white/5 shadow-2xl bg-gradient-to-b from-white/[0.02] to-transparent">
            <h2 className="text-lg font-black text-white mb-6 uppercase tracking-widest text-[10px] text-slate-500">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-3">
              <PortalAction to="/exams" label="View Report Card" icon={ClipboardList} />
              <PortalAction to="/fees" label="Pay School Fees" icon={Wallet} />
              <PortalAction to="/timetable" label="Full Timetable" icon={Calendar} />
              <PortalAction to="/settings" label="Update Profile" icon={User} />
            </div>
          </div>

          {/* School Announcements */}
          <div className="glass-dark p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
              </span>
            </div>
            <h2 className="text-lg font-black text-white mb-6 uppercase tracking-widest text-[10px] text-slate-500">Announcements</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-primary-500/20 text-primary-400 uppercase">Event</span>
                  <span className="text-[10px] text-slate-600 font-bold">Today, 2:00 PM</span>
                </div>
                <p className="text-sm font-bold text-white">Annual Sports Day Meeting</p>
                <p className="text-xs text-slate-500 leading-relaxed">All students are required to attend the briefing in the main hall.</p>
              </div>
              <div className="w-full h-px bg-white/5" />
              <div className="space-y-2 opacity-50">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-800 text-slate-500 uppercase">General</span>
                  <span className="text-[10px] text-slate-600 font-bold">Yesterday</span>
                </div>
                <p className="text-sm font-bold text-white">Term 1 Fee Deadline</p>
                <p className="text-xs text-slate-500 leading-relaxed">Please ensure all balances are cleared by Friday to avoid disruption.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PortalAction = ({ to, label, icon: Icon }: { to: string; label: string; icon: any }) => (
  <Link
    to={to}
    className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary-600 hover:border-primary-500 group transition-all"
  >
    <div className="flex items-center gap-4">
      <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/20 transition-colors">
        <Icon className="w-5 h-5 text-slate-400 group-hover:text-white" />
      </div>
      <span className="text-sm font-bold text-slate-300 group-hover:text-white">{label}</span>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white" />
  </Link>
);
