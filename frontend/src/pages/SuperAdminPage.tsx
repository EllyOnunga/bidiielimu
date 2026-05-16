import { useState } from "react";
import {
  Shield,
  Building2,
  Users,
  CreditCard,
  ArrowUpRight,
  Search,
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { schoolsService } from "../api/services/schoolsService";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/Table";
import { TableSkeleton } from "../components/ui/Skeleton";

interface SchoolData {
  id: number;
  name: string;
  students: number;
  plan: string;
  status: string;
  revenue: string;
}

export const SuperAdminPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  const { data: schools = [], isLoading } = useQuery<SchoolData[]>({
    queryKey: ["super-admin-schools"],
    queryFn: async () => {
      try {
        const res = await schoolsService.getAll();
        const schoolsData = Array.isArray(res) ? res : (res as any).results || [];
        return schoolsData.map((s: any) => ({
          id: s.id,
          name: s.name,
          students: s.student_count || 0,
          plan: s.subscription?.plan || "BASIC",
          status: s.subscription?.status === "ACTIVE" ? "ACTIVE" : "EXPIRED",
          revenue: `KSh ${Number(s.total_revenue || 0).toLocaleString()}`,
        }));
      } catch (error: any) {
        if (error.response?.status === 403) setUnauthorized(true);
        throw error;
      }
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["super-admin-stats"],
    queryFn: () => schoolsService.getStats(),
  });

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (unauthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20">
          <Shield className="w-10 h-10 text-rose-500" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary mb-2">
            Access Denied
          </h1>
          <p className="text-muted max-w-md mx-auto">
            This panel is restricted to System Super-Admins. Your current role
            does not have the permissions required to manage all schools.
          </p>
        </div>
        <button
          onClick={() => (window.location.href = "/dashboard")}
          className="px-6 py-3 bg-white/5 text-primary rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-rose-500/20 rounded-xl sm:rounded-2xl border border-rose-500/20 shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-primary tracking-tight">
              Super-Admin <span className="text-gradient">Panel</span>
            </h1>
            <p className="text-muted text-xs sm:text-sm">
              System-wide management of schools and subscriptions.
            </p>
          </div>
        </div>
        <button className="flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-900/20 w-full sm:w-auto text-sm">
          System Health Check
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatCard
          title="Total Schools"
          value={stats?.total_schools || 0}
          icon={Building2}
          color="bg-blue-500/20"
        />
        <StatCard
          title="Active Users"
          value={stats ? (stats.total_users / 1000).toFixed(1) + "k" : "0"}
          icon={Users}
          color="bg-purple-500/20"
        />
        <StatCard
          title="Monthly Revenue"
          value={stats ? `KSh ${(stats.total_revenue / 1000000).toFixed(1)}M` : "KSh 0M"}
          icon={CreditCard}
          color="bg-emerald-500/20"
        />
        <StatCard
          title="System Alerts"
          value={stats?.system_alerts || 0}
          icon={AlertTriangle}
          color="bg-rose-500/20"
        />
      </div>

      <div className="glass rounded-[32px] sm:rounded-[40px] border border-white/5 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg md:text-xl font-bold text-primary">
            Registered Schools
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
            <input
              placeholder="Search schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>

        <div className="relative">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.02]">
                <TableHead>School Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-center">Students</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton rows={8} cols={6} />
              ) : filteredSchools.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-muted font-bold tracking-widest uppercase text-xs"
                  >
                    No schools found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchools.map((school) => (
                  <TableRow key={school.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 text-muted">
                          <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-primary whitespace-nowrap">
                          {school.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest border ${
                          school.plan === "ENTERPRISE"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : school.plan === "PREMIUM"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-white/5 text-muted border-white/10"
                        }`}
                      >
                        {school.plan}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-xs sm:text-sm text-muted">
                      {school.students}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {school.status === "ACTIVE" ? (
                          <span className="flex items-center gap-1.5 text-emerald-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-rose-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                            Expired
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-black tracking-tighter text-primary text-sm sm:text-base whitespace-nowrap">
                      {school.revenue}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="p-2 hover:bg-white/10 rounded-xl text-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                          aria-label={`Manage school ${school.name}`}
                          title="Manage School"
                        >
                          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          className="p-2 hover:bg-white/10 rounded-xl text-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                          aria-label={`More options for ${school.name}`}
                        >
                          <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => (
  <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
    <div
      className={`p-3 rounded-2xl ${color} w-fit mb-4 group-hover:scale-110 transition-transform`}
    >
      <Icon className="w-6 h-6 text-white" />
    </div>
    <p className="text-sm text-muted font-medium mb-1">{title}</p>
    <div className="flex items-center justify-between">
      <h3 className="text-2xl font-bold text-primary">{value}</h3>
      <ArrowUpRight className="w-4 h-4 text-dim" />
    </div>
  </div>
);
