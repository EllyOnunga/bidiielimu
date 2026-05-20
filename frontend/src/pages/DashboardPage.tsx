import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserSquare2,
  BookOpen,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Calendar,
  FileText,
  Shield,
  ChevronRight,
  Activity,
  Zap,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { motion } from "framer-motion";
import { ROLES } from "../constants/roles";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/Button";
import { studentsService } from "../api/services/studentsService";
import { teachersService } from "../api/services/teachersService";
import { classesService } from "../api/services/classesService";
import { feesService } from "../api/services/feesService";
import { auditService } from "../api/services/auditService";

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

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  color: string;
  to?: string;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color,
  to,
}: StatCardProps) => {
  const CardContent = (
    <div className="premium-card p-6 md:p-8 group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-32 h-32 ${color}/10 blur-[60px] -mr-16 -mt-16 group-hover:opacity-100 transition-opacity duration-700`}
      />

      <div className="flex items-center justify-between mb-8">
        <div
          className={`p-4 rounded-[20px] ${color} shadow-glow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
              trend === "up"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {trendValue}
          </div>
        )}
      </div>

      <div className="space-y-1 relative z-10">
        <h3 className="text-muted text-[10px] font-black uppercase tracking-[0.3em] mb-1.5">
          {title}
        </h3>
        <p className="text-3xl md:text-4xl lg:text-5xl font-black text-primary tracking-tight leading-none">
          {value}
        </p>
      </div>

      <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
        <ChevronRight className="w-5 h-5 text-primary-400/50" />
      </div>
    </div>
  );

  return to ? (
    <Link to={to} className="block">
      {CardContent}
    </Link>
  ) : (
    CardContent
  );
};

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      navigate("/super-admin", { replace: true });
    }
  }, [user, navigate]);

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [studentsRes, teachersRes, classesRes, paymentsRes] =
        await Promise.all([
          studentsService.getAll().catch(() => []),
          teachersService.getAll().catch(() => []),
          classesService.getGrades().catch(() => []),
          feesService.getPayments().catch(() => []),
        ]);

      const studentsData = Array.isArray(studentsRes)
        ? studentsRes
        : (studentsRes as any).results || [];
      const teachersData = Array.isArray(teachersRes)
        ? teachersRes
        : (teachersRes as any).results || [];
      const classesData = Array.isArray(classesRes)
        ? classesRes
        : (classesRes as any).results || [];
      const paymentsData = Array.isArray(paymentsRes)
        ? paymentsRes
        : (paymentsRes as any).results || [];

      const totalRevenue = paymentsData
        .filter((p: any) => p.status === "COMPLETED")
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      return {
        students: studentsData.length,
        teachers: teachersData.length,
        classes: classesData.length,
        fees: `KSh ${totalRevenue.toLocaleString()}`,
        student_trend: "+0%",
        teacher_trend: "+0%",
        fees_trend: "+0%",
      } as Stats;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const { data: revenueData = [] } = useQuery({
    queryKey: ["revenue-chart"],
    queryFn: async () => {
      const res = await feesService.getPayments().catch(() => []);
      const payments = Array.isArray(res) ? res : (res as any).results || [];

      const monthly = payments.reduce((acc: any, p: any) => {
        const month = new Date(p.payment_date).toLocaleString("default", {
          month: "short",
        });
        acc[month] = (acc[month] || 0) + Number(p.amount);
        return acc;
      }, {});

      return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month) => ({
        name: month,
        value: monthly[month] || 0,
      }));
    },
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["dashboard-activities"],
    queryFn: async () => {
      const res = await auditService.getLogs().catch(() => []);
      const logs = Array.isArray(res) ? res : (res as any).results || [];
      return logs.slice(0, 5).map((log: any) => ({
        id: log.id,
        label: log.action_type || "School Activity",
        detail: log.description || "School update recorded",
        time: new Date(log.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-20"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-none">
            School <span className="text-gradient">Overview</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm md:text-base font-medium max-w-xl">
            A simple and clear overview of our school, teachers, students, and
            activities.
          </p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <Button
            variant="ghost"
            className="flex-1 lg:flex-none gap-2 h-14 px-8 rounded-2xl"
            onClick={() => window.print()}
          >
            <FileText className="w-5 h-5" /> Export Report
          </Button>
          <Button
            className="flex-1 lg:flex-none gap-2 h-14 px-8 rounded-2xl"
            onClick={() => navigate("/analytics")}
          >
            <Zap className="w-5 h-5" /> Detailed Insights
          </Button>
        </div>
      </div>

      {/* Quick Links / Shortcuts */}
      <div className="glass p-6 rounded-3xl border border-white/5">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-primary-600/10">
            <Zap className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-primary uppercase tracking-[3px]">
              Quick Access
            </h3>
            <p className="text-[10px] text-muted">Go to daily tasks quickly</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            {
              label: "Students",
              to: "/students",
              icon: Users,
              roles: ["ADMIN", "TEACHER", "PRINCIPAL"],
            },
            {
              label: "Classes",
              to: "/classes",
              icon: BookOpen,
              roles: ["ADMIN", "TEACHER", "PRINCIPAL"],
            },
            {
              label: "Exams",
              to: "/exams",
              icon: FileText,
              roles: ["ADMIN", "TEACHER", "PRINCIPAL"],
            },
            {
              label: "Fees",
              to: "/fees",
              icon: Wallet,
              roles: ["ADMIN", "PRINCIPAL"],
            },
            {
              label: "LMS",
              to: "/lms",
              icon: BookOpen,
              roles: ["ADMIN", "TEACHER", "STUDENT"],
            },
            {
              label: "Analytics",
              to: "/analytics",
              icon: TrendingUp,
              roles: ["ADMIN", "PRINCIPAL"],
            },
          ]
            .filter((link) => link.roles.includes(user?.role || ""))
            .map((link, index) => {
              const Icon = link.icon;
              return (
                <Link
                  key={index}
                  to={link.to}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                >
                  <div className="p-2 rounded-xl bg-primary-600/10 group-hover:bg-primary-600/20 transition-colors">
                    <Icon className="w-4 h-4 text-primary-400" />
                  </div>
                  <span className="text-sm font-bold text-primary group-hover:text-white transition-colors">
                    {link.label}
                  </span>
                </Link>
              );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loadingStats || !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[200px] bg-white/5 rounded-[40px] animate-pulse"
            />
          ))
        ) : (
          <>
            <StatCard
              to={user?.role === "SUPER_ADMIN" ? "/super-admin" : "/students"}
              title="Total Students"
              value={stats?.students || 0}
              icon={Users}
              color="bg-blue-600"
              trend={stats.student_trend.startsWith("-") ? "down" : "up"}
              trendValue={stats.student_trend}
            />
            <StatCard
              to={user?.role === "SUPER_ADMIN" ? "/super-admin" : "/teachers"}
              title={
                user?.role === "SUPER_ADMIN"
                  ? "School Accounts"
                  : "Total Teachers"
              }
              value={stats?.teachers || 0}
              icon={UserSquare2}
              color="bg-indigo-600"
              trend={stats.teacher_trend.startsWith("-") ? "down" : "up"}
              trendValue={stats.teacher_trend}
            />
            <StatCard
              to={user?.role === "SUPER_ADMIN" ? "/super-admin" : "/classes"}
              title={
                user?.role === "SUPER_ADMIN"
                  ? "Active Classes"
                  : "Total Classes"
              }
              value={stats?.classes || 0}
              icon={user?.role === "SUPER_ADMIN" ? Shield : BookOpen}
              color="bg-violet-600"
            />
            {(user?.role === ROLES.ADMIN ||
              user?.role === ROLES.SUPER_ADMIN ||
              user?.role === ROLES.FINANCE) && (
              <StatCard
                to={user?.role === "SUPER_ADMIN" ? "/super-admin" : "/fees"}
                title="Fees Collected"
                value={stats.fees}
                icon={Wallet}
                color="bg-emerald-600"
                trend={stats.fees_trend.startsWith("-") ? "down" : "up"}
                trendValue={stats.fees_trend}
              />
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 premium-card !p-8 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-2xl font-black text-primary flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                School Fees Tracker
              </h2>
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mt-2">
                Money received over the past few months
              </p>
            </div>
            <div className="flex p-1 bg-white/5 rounded-2xl">
              <button className="px-5 py-2.5 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-glow-sm">
                6 Months
              </button>
              <button className="px-5 py-2.5 text-muted hover:text-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                Full Year
              </button>
            </div>
          </div>
          <div className="flex-1 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.03)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="rgba(255,255,255,0.1)"
                  fontSize={10}
                  tickMargin={15}
                  axisLine={false}
                  tickLine={false}
                  fontWeight="900"
                />
                <YAxis
                  stroke="rgba(255,255,255,0.1)"
                  fontSize={10}
                  tickFormatter={(val) => `KSh ${val / 1000}k`}
                  axisLine={false}
                  tickLine={false}
                  fontWeight="900"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10,10,15,0.9)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "20px",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                  }}
                  itemStyle={{
                    color: "#10b981",
                    fontWeight: "900",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="premium-card p-8">
            <h2 className="text-[10px] font-black text-primary-400 mb-6 uppercase tracking-[0.3em]">
              Daily Tasks
            </h2>
            <div className="space-y-3">
              <QuickActionButton
                to="/students"
                label="Register New Student"
                icon={UserSquare2}
              />
              <QuickActionButton
                to="/teachers"
                label="Register New Teacher"
                icon={Shield}
              />
              <QuickActionButton
                to="/fees"
                label="Fees & Payments"
                icon={Wallet}
              />
              <QuickActionButton
                to="/attendance/mark"
                label="Mark Attendance"
                icon={Calendar}
              />
            </div>
          </div>

          <div className="premium-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">
                Recent Updates
              </h2>
              <Link
                to="/audit-logs"
                className="text-[10px] font-black text-primary-200/20 hover:text-primary-400 uppercase tracking-widest transition-colors"
              >
                Past Log
              </Link>
            </div>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="py-12 text-center opacity-10">
                  <Activity className="w-10 h-10 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    No school updates today
                  </p>
                </div>
              ) : (
                activities.map((act: any) => (
                  <motion.div
                    key={act.id}
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 font-black text-[10px]">
                      {act.label[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-primary truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight mb-0.5">
                        {act.label}
                      </p>
                      <p className="text-[9px] font-bold text-dim truncate uppercase tracking-tighter">
                        {act.detail}
                      </p>
                    </div>
                    <span className="text-[8px] font-black text-dim uppercase">
                      {act.time}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const QuickActionButton = ({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
}) => (
  <Link
    to={to}
    className="flex items-center justify-between p-5 rounded-[24px] bg-white/[0.02] border border-white/5 hover:bg-primary-600 hover:border-primary-500 group transition-all duration-500 shadow-glow-sm hover:shadow-primary-500/20"
  >
    <div className="flex items-center gap-4">
      <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-white/20 transition-colors">
        <Icon className="w-5 h-5 text-primary-400 group-hover:text-white" />
      </div>
      <span className="text-[11px] font-black text-muted group-hover:text-white uppercase tracking-widest transition-colors">
        {label}
      </span>
    </div>
    <ChevronRight className="w-4 h-4 text-muted group-hover:text-white group-hover:translate-x-1 transition-all" />
  </Link>
);

export default DashboardPage;
