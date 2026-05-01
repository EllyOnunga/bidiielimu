import { useState, useEffect } from 'react';
import { Users, UserSquare2, BookOpen, Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, FileText } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';
import client from '../api/client';
import { Skeleton } from '../components/ui/Skeleton';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

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
  to?: string;
}

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, to }: StatCardProps) => {
  const CardContent = (
    <div className="glass-interactive p-6 rounded-[32px] h-full group">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-4 rounded-2xl ${color} shadow-premium border border-white/10 group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-tighter uppercase ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-primary-200/50 text-xs font-black uppercase tracking-widest">{title}</h3>
        <p className="text-4xl font-black text-white tracking-tight">{value}</p>
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block">{CardContent}</Link>;
  }
  return CardContent;
};

const StatCardSkeleton = () => (
  <div className="glass p-6 rounded-[32px] h-[180px]">
    <Skeleton className="w-14 h-14 rounded-2xl mb-6" />
    <Skeleton className="w-24 h-3 mb-2" />
    <Skeleton className="w-20 h-8" />
  </div>
);

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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10 pb-12"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <motion.h1 variants={item} className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
            School <span className="text-gradient">Intelligence</span>
          </motion.h1>
          <motion.p variants={item} className="text-primary-200/50 text-base font-medium">
            Real-time operational insights for your educational institution.
          </motion.p>
        </div>
        <motion.div variants={item} className="flex gap-3">
          <button className="flex-1 sm:flex-none px-6 py-3 bg-white/5 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Report
          </button>
          <button className="flex-1 sm:flex-none px-6 py-3 bg-primary-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-primary-500 transition-all shadow-premium flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Insights
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <motion.div variants={item}>
              <StatCard to="/students" title="Total Students" value={stats.students} icon={Users} color="bg-primary-500" trend={stats.student_trend.startsWith('-') ? 'down' : 'up'} trendValue={stats.student_trend} />
            </motion.div>
            <motion.div variants={item}>
              <StatCard to="/teachers" title="Active Teachers" value={stats.teachers} icon={UserSquare2} color="bg-accent-500" trend={stats.teacher_trend.startsWith('-') ? 'down' : 'up'} trendValue={stats.teacher_trend} />
            </motion.div>
            <motion.div variants={item}>
              <StatCard to="/classes" title="Total Classes" value={stats.classes} icon={BookOpen} color="bg-primary-600" />
            </motion.div>
            {user?.role === 'ADMIN' && (
              <motion.div variants={item}>
                <StatCard to="/fees" title="Revenue" value={stats.fees} icon={Wallet} color="bg-emerald-500" trend={stats.fees_trend.startsWith('-') ? 'down' : 'up'} trendValue={stats.fees_trend} />
              </motion.div>
            )}
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {user?.role === 'ADMIN' && (
          <motion.div variants={item} className="lg:col-span-2 glass p-8 rounded-[40px]">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-primary-400" />
                  Revenue Trends
                </h2>
                <p className="text-sm font-medium text-primary-200/40 mt-1">Financial growth visualization</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white/5 text-white text-xs font-black uppercase tracking-widest rounded-xl border border-white/5 hover:bg-white/10 transition-all">6 Months</button>
              </div>
            </div>
            <div className="h-[350px] w-full mt-6">
              {loadingStats ? (
                <Skeleton className="w-full h-full rounded-[32px]" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.55 0.22 240)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="oklch(0.55 0.22 240)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="oklch(1 0 0 / 0.2)" fontSize={11} tickMargin={15} axisLine={false} tickLine={false} fontWeight="bold" />
                    <YAxis stroke="oklch(1 0 0 / 0.2)" fontSize={11} tickFormatter={(val) => `KSh ${val / 1000}k`} axisLine={false} tickLine={false} fontWeight="bold" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(0.16 0.03 240 / 0.9)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid oklch(1 0 0 / 0.1)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-premium)'
                      }}
                      itemStyle={{ color: '#fff', fontWeight: '900', fontSize: '14px' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="oklch(0.55 0.22 240)" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        )}

        <motion.div variants={item} className={user?.role === 'ADMIN' ? "glass p-8 rounded-[40px]" : "lg:col-span-3 glass p-8 rounded-[40px]"}>
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Calendar className="w-6 h-6 text-accent-400" />
              Activity
            </h2>
            <Link to="/audit-logs" className="text-xs font-black uppercase tracking-widest text-primary-400 hover:text-primary-300 transition-colors">View All</Link>
          </div>
          <div className="space-y-4">
            {loadingStats ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-5 rounded-3xl glass border border-white/5">
                  <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-24 h-3" />
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-primary-200/20">
                <Calendar className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-sm font-black uppercase tracking-widest">No Recent Logs</p>
              </div>
            ) : (
              activities.map((act) => (
                <motion.div
                  key={act.id}
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-primary-500/20 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary-600/10 shrink-0 flex items-center justify-center text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-premium">
                    {act.label[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate group-hover:text-primary-400 transition-colors uppercase tracking-tight">{act.label}</p>
                    <p className="text-xs font-bold text-primary-200/30 truncate mt-0.5">{act.detail}</p>
                  </div>
                  <span className="text-[10px] font-black text-primary-200/20 whitespace-nowrap uppercase tracking-tighter">{act.time}</span>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

