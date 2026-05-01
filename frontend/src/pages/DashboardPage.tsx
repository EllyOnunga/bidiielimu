import { useState, useEffect } from 'react';
import { Users, UserSquare2, BookOpen, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import client from '../api/client';
import { Skeleton } from '../components/ui/Skeleton';
import { Link } from 'react-router-dom';

interface Stats {
  students: number;
  teachers: number;
  classes: number;
  fees: string;
  student_trend: string;
  teacher_trend: string;
  fees_trend: string;
}

interface RecentActivity {
  id: number;
  label: string;
  detail: string;
  time: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, to }: StatCardProps & { to?: string }) => {
  const CardContent = (
    <div className="glass-dark p-6 rounded-3xl border border-white/5 hover:border-primary-500/30 transition-all group h-full">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {trendValue}
          </div>
        )}
      </div>
      <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
    </div>
  );

  if (to) {
    return <Link to={to} className="block">{CardContent}</Link>;
  }
  return CardContent;
};

const StatCardSkeleton = () => (
  <div className="glass-dark p-6 rounded-3xl border border-white/5 h-[140px]">
    <Skeleton className="w-12 h-12 rounded-2xl mb-4" />
    <Skeleton className="w-24 h-4 mb-2" />
    <Skeleton className="w-16 h-8" />
  </div>
);

import { useAuthStore } from '../store/authStore';

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<Stats>({ 
    students: 0, 
    teachers: 0, 
    classes: 0, 
    fees: 'KSh 0',
    student_trend: '0%',
    teacher_trend: '0%',
    fees_trend: '0%'
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const handleExport = () => {
    window.print();
  };

  const handleQuickAction = () => {
    // Navigate to students for quick admission
    window.location.href = '/students';
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await client.get('schools/dashboard_stats/');
        setStats({
          students: res.data.students,
          teachers: res.data.teachers,
          classes: res.data.classes,
          fees: `KSh ${res.data.total_fees.toLocaleString()}`,
          student_trend: res.data.student_trend,
          teacher_trend: res.data.teacher_trend,
          fees_trend: res.data.fees_trend,
        });
        setRevenueData(res.data.revenue_trend);

        // Fetch recent audit logs separately as they are not aggregated stats
        const auditRes = await client.get('audit/logs/');
        const logs = Array.isArray(auditRes.data) ? auditRes.data : (auditRes.data.results || []);
        const mapped = logs.slice(0, 4).map((log: any) => ({
          id: log.id,
          label: `${log.action}: ${log.model_name}`,
          detail: log.object_repr,
          time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setActivities(mapped);
        
      } catch (err) {
        console.error('Dashboard fetch error', err);
      } finally {
        setLoadingStats(false);
      }
    };
     
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">School Overview</h1>
          <p className="text-slate-400 text-sm md:text-base">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button 
            onClick={handleExport}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-all border border-slate-700"
          >
            Export Report
          </button>
          <button 
            onClick={handleQuickAction}
            className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-500 transition-all shadow-lg shadow-primary-900/20"
          >
            Quick Actions
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {loadingStats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard to="/students" title="Total Students" value={stats.students} icon={Users} color="bg-blue-500/10" trend={stats.student_trend.startsWith('-') ? 'down' : 'up'} trendValue={stats.student_trend} />
            <StatCard to="/teachers" title="Active Teachers" value={stats.teachers} icon={UserSquare2} color="bg-purple-500/10" trend={stats.teacher_trend.startsWith('-') ? 'down' : 'up'} trendValue={stats.teacher_trend} />
            <StatCard to="/classes" title="Total Classes" value={stats.classes} icon={BookOpen} color="bg-amber-500/10" />
            {user?.role === 'ADMIN' && (
              <StatCard to="/fees" title="Fees Collected" value={stats.fees} icon={Wallet} color="bg-emerald-500/10" trend={stats.fees_trend.startsWith('-') ? 'down' : 'up'} trendValue={stats.fees_trend} />
            )}
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        {user?.role === 'ADMIN' && (
          <div className="lg:col-span-2 glass-dark p-4 sm:p-6 rounded-3xl border border-white/5">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white">Revenue Overview</h2>
                <p className="text-sm text-slate-400 mt-1">Fee collection trends over the last 6 months</p>
              </div>
              <select className="bg-slate-800 text-white text-sm border border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary-500">
                <option>This Year</option>
                <option>Last Year</option>
              </select>
            </div>
            <div className="h-[300px] w-full relative mt-6">
              {loadingStats ? (
                <Skeleton className="w-full h-full rounded-2xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickFormatter={(val) => `KSh ${val / 1000}k`} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        <div className={user?.role === 'ADMIN' ? "glass-dark p-6 md:p-8 rounded-3xl border border-white/5" : "lg:col-span-3 glass-dark p-6 md:p-8 rounded-3xl border border-white/5"}>
          <h2 className="text-lg md:text-xl font-bold text-white mb-6">Recent Activities</h2>
          <div className="space-y-4">
            {loadingStats ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-24 h-3" />
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No recent activities</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary-600/20 shrink-0 flex items-center justify-center text-primary-400 text-xs font-bold group-hover:bg-primary-600 group-hover:text-white transition-all">
                    {act.label[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-white truncate group-hover:text-primary-400 transition-colors">{act.label}</p>
                    <p className="text-[10px] md:text-xs text-slate-500 truncate">{act.detail}</p>
                  </div>
                  <span className="text-[10px] md:text-xs text-slate-500 whitespace-nowrap">{act.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
