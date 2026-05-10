import { useState, useEffect } from 'react';
import { Users, UserSquare2, BookOpen, Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, FileText, Shield, ChevronRight } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';
import { ROLES } from '../constants/roles';
import client from '../api/client';
import { Skeleton } from '../components/ui/Skeleton';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';

interface Stats {
  students: number;
  teachers: number;
  classes: number;
  fees: string;
  student_trend: string;
  teacher_trend: string;
  fees_trend: string;
  library_books: number;
  library_titles: number;
  library_low_stock: number;
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
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    students: 0,
    teachers: 0,
    classes: 0,
    fees: 'KSh 0',
    student_trend: '0%',
    teacher_trend: '0%',
    fees_trend: '0%',
    library_books: 0,
    library_titles: 0,
    library_low_stock: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const isSuperAdmin = user?.role === 'SUPER_ADMIN';
        const endpoint = isSuperAdmin ? 'schools/super_admin_stats/' : 'schools/dashboard_stats/';

        const res = await client.get(endpoint);

        if (isSuperAdmin) {
          setStats({
            students: res.data.total_students,
            teachers: res.data.total_users,
            classes: res.data.total_schools,
            fees: `KSh ${res.data.total_revenue.toLocaleString()}`,
            student_trend: '+0%',
            teacher_trend: '+0%',
            fees_trend: '+0%',
            library_books: 0,
            library_titles: 0,
            library_low_stock: 0,
          });
        } else {
          setStats({
            students: res.data.students,
            teachers: res.data.teachers,
            classes: res.data.classes,
            fees: `KSh ${res.data.total_fees.toLocaleString()}`,
            student_trend: res.data.student_trend,
            teacher_trend: res.data.teacher_trend,
            fees_trend: res.data.fees_trend,
            library_books: res.data.library?.total_books ?? 0,
            library_titles: res.data.library?.total_titles ?? 0,
            library_low_stock: res.data.library?.low_stock_count ?? 0,
          });
          setRevenueData(res.data.revenue_trend);
        }

        if (user?.role !== 'SUPER_ADMIN') {
          const auditRes = await client.get('audit/logs/');
          const logs = Array.isArray(auditRes.data) ? auditRes.data : (auditRes.data.results || []);
          const mapped = logs.slice(0, 4).map((log: any) => ({
            id: log.id,
            label: `${log.action}: ${log.model_name}`,
            detail: log.object_repr,
            time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          setActivities(mapped);
        } else {
          setActivities([]);
        }
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
      className="space-y-8 md:space-y-12 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <motion.h1 variants={item} className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
            School <span className="text-gradient">Intelligence</span>
          </motion.h1>
          <motion.p variants={item} className="text-primary-200/40 text-sm md:text-base font-medium max-w-xl">
            Real-time operational monitoring and strategic insights for your institution.
          </motion.p>
        </div>
        <motion.div variants={item} className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 md:flex-none gap-2"
            onClick={() => window.print()}
          >
            <FileText className="w-4 h-4" />
            Report
          </Button>
          <Button 
            className="flex-1 md:flex-none gap-2"
            onClick={() => navigate('/analytics')}
          >
            <TrendingUp className="w-4 h-4" />
            Insights
          </Button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <motion.div variants={item}>
              <StatCard
                to={user?.role === 'SUPER_ADMIN' ? "/super-admin" : "/students"}
                title="Total Students"
                value={stats.students}
                icon={Users}
                color="bg-primary-500"
                trend={stats.student_trend.startsWith('-') ? 'down' : 'up'}
                trendValue={stats.student_trend}
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard
                to={user?.role === 'SUPER_ADMIN' ? "/super-admin" : "/teachers"}
                title={user?.role === 'SUPER_ADMIN' ? "Total Users" : "Active Teachers"}
                value={stats.teachers}
                icon={UserSquare2}
                color="bg-indigo-500"
                trend={stats.teacher_trend.startsWith('-') ? 'down' : 'up'}
                trendValue={stats.teacher_trend}
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard
                to={user?.role === 'SUPER_ADMIN' ? "/super-admin" : "/classes"}
                title={user?.role === 'SUPER_ADMIN' ? "Total Schools" : "Total Classes"}
                value={stats.classes}
                icon={user?.role === 'SUPER_ADMIN' ? Shield : BookOpen}
                color="bg-primary-600"
              />
            </motion.div>
            {(user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.FINANCE) && (
              <motion.div variants={item}>
                <StatCard
                  to={user?.role === 'SUPER_ADMIN' ? "/super-admin" : "/fees"}
                  title="Total Revenue"
                  value={stats.fees}
                  icon={Wallet}
                  color="bg-emerald-500"
                  trend={stats.fees_trend.startsWith('-') ? 'down' : 'up'}
                  trendValue={stats.fees_trend}
                />
              </motion.div>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-10">
        <motion.div variants={item} className="premium-card">
          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest text-[10px] text-primary-400">Quick Operations</h2>
          <div className="grid grid-cols-1 gap-3">
            <QuickActionButton to="/students" label="Register Student" icon={UserSquare2} />
            <QuickActionButton to="/teachers" label="Onboard Teacher" icon={Shield} />
            <QuickActionButton to="/fees" label="Collect Fees" icon={Wallet} />
            <QuickActionButton to="/attendance/mark" label="Mark Attendance" icon={Calendar} />
          </div>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-3 premium-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-primary-400" />
                Revenue Matrix
              </h2>
              <p className="text-xs font-bold text-primary-200/20 uppercase tracking-widest mt-1">Growth progression analytics</p>
            </div>
            <div className="flex p-1 bg-white/5 rounded-xl self-start sm:self-auto">
              <button className="px-4 py-2 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">6 Months</button>
              <button className="px-4 py-2 text-primary-200/40 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">Yearly</button>
            </div>
          </div>
          <div className="h-[300px] md:h-[400px] w-full">
            {loadingStats ? (
              <Skeleton className="w-full h-full rounded-[24px]" />
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.1)" fontSize={10} tickMargin={15} axisLine={false} tickLine={false} fontWeight="800" />
                  <YAxis stroke="rgba(255, 255, 255, 0.1)" fontSize={10} tickFormatter={(val) => `KSh ${val / 1000}k`} axisLine={false} tickLine={false} fontWeight="800" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      boxShadow: 'var(--shadow-xl)'
                    }}
                    itemStyle={{ color: '#14b8a6', fontWeight: '900', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div variants={item} className={(user?.role === ROLES.ADMIN || user?.role === ROLES.FINANCE) ? "premium-card" : "lg:col-span-3 premium-card"}>
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Calendar className="w-6 h-6 text-indigo-400" />
              Activity
            </h2>
            <Link to="/audit-logs" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-400 hover:text-primary-300 transition-colors">Archive</Link>
          </div>
          <div className="space-y-3">
            {loadingStats ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl glass border border-white/5">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-24 h-3" />
                    <Skeleton className="w-16 h-2" />
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-primary-200/10">
                <Calendar className="w-12 h-12 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">No Recent Logs</p>
              </div>
            ) : (
              activities.map((act) => (
                <motion.div
                  key={act.id}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary-500/30 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-600/10 shrink-0 flex items-center justify-center text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-premium text-xs font-black">
                    {act.label[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white truncate group-hover:text-primary-400 transition-colors uppercase tracking-tight leading-none mb-1">{act.label}</p>
                    <p className="text-[10px] font-bold text-primary-200/20 truncate">{act.detail}</p>
                  </div>
                  <span className="text-[9px] font-black text-primary-200/10 whitespace-nowrap uppercase">{act.time}</span>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const QuickActionButton = ({ to, label, icon: Icon }: { to: string; label: string; icon: React.ElementType }) => (
  <Link
    to={to}
    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-primary-600 hover:border-primary-500 group transition-all"
  >
    <div className="flex items-center gap-4">
      <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/20 transition-colors">
        <Icon className="w-5 h-5 text-primary-400 group-hover:text-white" />
      </div>
      <span className="text-xs font-black text-slate-300 group-hover:text-white uppercase tracking-tight">{label}</span>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white" />
  </Link>
);

export default DashboardPage;
