import { useState, useEffect } from 'react';
import { Shield, Building2, Users, CreditCard, ArrowUpRight, Search, MoreHorizontal, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { TableSkeleton } from '../components/ui/Skeleton';
import client from '../api/client';

interface SchoolData {
  id: number;
  name: string;
  students: number;
  plan: string;
  status: string;
  revenue: string;
}

export const SuperAdminPage = () => {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [stats, setStats] = useState({
    total_schools: 0,
    total_users: 0,
    total_revenue: 0,
    system_alerts: 0
  });
  const [loading, setLoading] = useState(true);

  const [unauthorized, setUnauthorized] = useState(false);

  const fetchStats = async () => {
    try {
      const [schoolsRes, statsRes] = await Promise.all([
        client.get('schools/'),
        client.get('schools/super_admin_stats/')
      ]);

      const schoolsData = Array.isArray(schoolsRes.data) ? schoolsRes.data : (schoolsRes.data.results || []);
      const mapped = schoolsData.map((s: any) => ({
        id: s.id,
        name: s.name,
        students: s.student_count || 0,
        plan: s.subscription?.plan || 'BASIC',
        status: s.subscription?.status === 'ACTIVE' ? 'ACTIVE' : 'EXPIRED',
        revenue: `KSh ${Number(s.total_revenue || 0).toLocaleString()}`
      }));
      setSchools(mapped);
      setStats(statsRes.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        setUnauthorized(true);
      }
      console.error('Failed to fetch super admin data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (unauthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20">
          <Shield className="w-10 h-10 text-rose-500" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Access Denied</h1>
          <p className="text-slate-500 max-w-md mx-auto">This panel is restricted to System Super-Admins. Your current role does not have the permissions required to manage all schools.</p>
        </div>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold border border-slate-700 hover:bg-slate-700 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/20">
            <Shield className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Super-Admin Panel</h1>
            <p className="text-slate-400 text-sm md:text-base">System-wide management of schools and subscriptions.</p>
          </div>
        </div>
        <button className="flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-rose-900/20 w-full md:w-auto text-sm md:text-base">
          System Health Check
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total Schools" value={stats.total_schools} icon={Building2} color="bg-blue-500/20" />
        <StatCard title="Active Users" value={(stats.total_users / 1000).toFixed(1) + 'k'} icon={Users} color="bg-purple-500/20" />
        <StatCard title="Monthly Revenue" value={`KSh ${(stats.total_revenue / 1000000).toFixed(1)}M`} icon={CreditCard} color="bg-emerald-500/20" />
        <StatCard title="System Alerts" value={stats.system_alerts} icon={AlertTriangle} color="bg-rose-500/20" />
      </div>

      <div className="glass-dark rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg md:text-xl font-bold text-white">Registered Schools</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              placeholder="Search schools..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-white/5">
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">School Name</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">Plan</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase text-center">Students</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase text-center">Status</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase text-right">Revenue</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <TableSkeleton rows={8} cols={6} />
              ) : schools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-500">No schools found.</td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.id} className="hover:bg-white/[0.02] transition-all group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 text-slate-400">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="text-sm font-bold text-white">{school.name}</div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${school.plan === 'ENTERPRISE' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          school.plan === 'PREMIUM' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                        {school.plan}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center text-sm text-slate-400">{school.students}</td>
                    <td className="px-8 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {school.status === 'ACTIVE' ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold uppercase">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-400 text-[10px] font-bold uppercase">
                            <AlertTriangle className="w-3 h-3" />
                            Expired
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right font-bold text-white text-sm">{school.revenue}</td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-all" title="Manage School">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-all">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
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

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => (
  <div className="glass-dark p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
    <div className={`p-3 rounded-2xl ${color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <p className="text-sm text-slate-400 font-medium mb-1">{title}</p>
    <div className="flex items-center justify-between">
      <h3 className="text-2xl font-bold text-white">{value}</h3>
      <ArrowUpRight className="w-4 h-4 text-slate-600" />
    </div>
  </div>
);
