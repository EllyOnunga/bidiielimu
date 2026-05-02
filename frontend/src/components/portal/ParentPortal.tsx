import { useState, useEffect } from 'react';
import { 
  Users, GraduationCap, Calendar, 
  MessageCircle, ShieldCheck, Activity, 
  ArrowUpRight, AlertCircle, Wallet
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const ParentPortal = () => {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/v1/students/portal-dashboard/');
      setChildren(res.data);
    } catch (err) {
      toast.error('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-white font-black text-center animate-pulse">Synchronizing Portal...</div>;

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Parent Portal</h1>
          <p className="text-primary-200/40 font-bold uppercase tracking-widest mt-1">Welcome back, Guardian</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-4 rounded-3xl border border-white/5">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <p className="text-sm font-bold text-white/80">Secure Encrypted Session</p>
        </div>
      </div>

      {/* Children List */}
      <div className="grid grid-cols-1 gap-8">
        {children.map((child) => (
          <div key={child.student_id} className="glass rounded-[48px] border border-white/5 overflow-hidden group">
            <div className="p-10 flex flex-col md:flex-row gap-10">
              {/* Profile Card */}
              <div className="md:w-72 space-y-6">
                <div className="w-32 h-32 rounded-[40px] bg-primary-500/10 flex items-center justify-center text-primary-400 relative">
                  <Users className="w-12 h-12" />
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 border-4 border-[#020617] rounded-full flex items-center justify-center text-white">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">{child.name}</h2>
                  <p className="text-sm font-bold text-primary-200/40 uppercase tracking-widest mt-1">{child.stream}</p>
                  <p className="text-xs font-black text-white/20 mt-4 italic">ADM: {child.admission_number}</p>
                </div>
                <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold flex items-center justify-center gap-3 hover:bg-primary-500 transition-all">
                  <MessageCircle className="w-5 h-5" />
                  Message Teacher
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Academic Performance */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 space-y-6 hover:bg-white/[0.04] transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-white/10" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest mb-1">Mean Score</p>
                    <p className="text-4xl font-black text-white tracking-tighter">{child.performance.mean_score}%</p>
                    <p className="text-xs font-bold text-indigo-400 mt-2 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Ranked #{child.performance.rank} in Class
                    </p>
                  </div>
                </div>

                {/* Fee Status */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 space-y-6 hover:bg-white/[0.04] transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <button className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg">Pay Now</button>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest mb-1">Fee Balance</p>
                    <p className="text-4xl font-black text-white tracking-tighter">KES {child.fees.balance.toLocaleString()}</p>
                    <p className="text-xs font-bold text-white/20 mt-2">Last Paid: KES {child.fees.paid.toLocaleString()}</p>
                  </div>
                </div>

                {/* Attendance */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 space-y-6 hover:bg-white/[0.04] transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest mb-1">Attendance Rate</p>
                    <p className="text-4xl font-black text-white tracking-tighter">{child.attendance_rate}%</p>
                    <div className="w-full h-2 bg-white/5 rounded-full mt-4 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${child.attendance_rate}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="bg-white/[0.01] border-t border-white/5 p-6 px-10 flex flex-wrap gap-4">
              {['View Report Card', 'Exam Schedule', 'Assignments', 'Medical Data'].map((action) => (
                <button key={action} className="px-6 py-2 rounded-xl bg-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all border border-white/5">
                  {action}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Offline Alert (PWA Indicator) */}
      {!navigator.onLine && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-8 py-4 rounded-full font-black flex items-center gap-4 shadow-2xl z-[1000]">
          <AlertCircle className="w-6 h-6" />
          Offline Mode: Accessing cached data
        </div>
      )}
    </div>
  );
};

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);
