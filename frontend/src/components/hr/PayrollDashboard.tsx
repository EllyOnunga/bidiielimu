import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Banknote,
  FileCheck,
  Receipt,
  Clock,
  Download,
  ChevronRight,
  TrendingDown,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import client from "../../api/client";
import { Skeleton } from "../ui/Skeleton";

export const PayrollDashboard = () => {
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["payroll-stats"],
    queryFn: async () => {
      const res = await client.get("hr/payroll-records/stats/");
      return res.data;
    },
  });

  const { data: recentLeave = [], isLoading: loadingLeave } = useQuery({
    queryKey: ["recent-leave"],
    queryFn: async () => {
      const res = await client.get("hr/leave-requests/recent/");
      return res.data;
    },
  });

  if (loadingStats || loadingLeave) {
    return (
      <div className="p-10 space-y-10">
        <Skeleton className="w-64 h-10 mb-10" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-[48px]" />
          <Skeleton className="h-40 rounded-[48px]" />
          <Skeleton className="h-40 rounded-[48px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Payroll & HR
          </h1>
          <p className="text-primary-200/40 font-bold uppercase tracking-widest mt-1">
            Salary & Tax Management
          </p>
        </div>

        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-white/10 transition-all">
            <Download className="w-5 h-5" />
            Export P9 Forms
          </button>
          <button className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-emerald-400 shadow-premium transition-all">
            <FileCheck className="w-5 h-5" />
            Run {new Date().toLocaleString("default", { month: "long" })}{" "}
            Payroll
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-10 rounded-[48px] border border-white/10 bg-primary-500/5 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-primary-500/20 flex items-center justify-center text-primary-400">
            <Banknote className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-primary-400 uppercase tracking-widest mb-1">
              Total Monthly Net
            </p>
            <h2 className="text-4xl font-black text-white tracking-tighter">
              KES {(stats?.total_monthly_net / 1e6).toFixed(2)}M
            </h2>
            <p className="text-xs font-bold text-primary-200/40 mt-2">
              {stats?.employee_count} employees onboarded
            </p>
          </div>
        </div>

        <div className="glass p-10 rounded-[48px] border border-white/10 bg-amber-500/5 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Receipt className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">
              Tax/PAYE Obligations
            </p>
            <h2 className="text-4xl font-black text-white tracking-tighter">
              KES {stats?.total_tax.toLocaleString()}
            </h2>
            <p className="text-xs font-bold text-amber-400 mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Due in 12 days
            </p>
          </div>
        </div>

        <div className="glass p-10 rounded-[48px] border border-white/10 bg-rose-500/5 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400">
            <TrendingDown className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1">
              Total Deductions
            </p>
            <h2 className="text-4xl font-black text-white tracking-tighter">
              KES {stats?.total_deductions.toLocaleString()}
            </h2>
            <p className="text-xs font-bold text-primary-200/40 mt-2">
              SHIF, NSSF, and Loans
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass rounded-[48px] border border-white/5 overflow-hidden p-10 space-y-10">
          <h3 className="text-2xl font-black text-white tracking-tight">
            Payroll Expenditure Trend
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <BarChart data={stats?.trend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="rgba(255,255,255,0.2)"
                  fontSize={10}
                  fontWeight={900}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.2)"
                  fontSize={10}
                  fontWeight={900}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val / 1e6}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                  }}
                  formatter={(val: any) => [
                    `KES ${val.toLocaleString()}`,
                    "Expenditure",
                  ]}
                />
                <Bar
                  dataKey="amount"
                  fill="#6366f1"
                  radius={[12, 12, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-[48px] border border-white/5 p-10 space-y-10">
          <h3 className="text-2xl font-black text-white tracking-tight">
            Recent Leave Requests
          </h3>
          <div className="space-y-4">
            {recentLeave.length === 0 ? (
              <div className="py-20 text-center text-primary-200/10 uppercase font-black text-xs tracking-widest">
                No Recent Requests
              </div>
            ) : (
              recentLeave.map((leave: any, i: number) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/5 p-6 rounded-[28px] flex items-center justify-between group hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-all">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">
                        {leave.staff_name}
                      </h4>
                      <p className="text-[10px] font-black text-primary-200/20 uppercase tracking-widest">
                        {leave.leave_type} •{" "}
                        {new Date(leave.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                        leave.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : leave.status === "REJECTED"
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {leave.status}
                    </span>
                    <ChevronRight className="w-5 h-5 text-primary-200/20" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
