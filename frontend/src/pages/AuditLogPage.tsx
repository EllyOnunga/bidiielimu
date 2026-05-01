import { useState, useEffect } from 'react';
import { ShieldAlert, User, Clock, Activity, Search, Filter, Database, Eye, X as CloseIcon } from 'lucide-react';
import { TableSkeleton } from '../components/ui/Skeleton';
import { motion } from 'framer-motion';
import client from '../api/client';

interface AuditLog {
  id: number;
  user_name: string;
  action: string;
  model_name: string;
  object_repr: string;
  timestamp: string;
  ip_address: string;
  color: string;
  changes: any;
}

const actionColors: Record<string, string> = {
  'CREATE': 'text-emerald-400',
  'UPDATE': 'text-amber-400',
  'DELETE': 'text-rose-400',
  'LOGIN': 'text-purple-400',
};

export const AuditLogPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [stats, setStats] = useState({
    total_actions_24h: 0,
    sensitive_changes: 0,
    active_admins: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = async (searchQuery = '') => {
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        client.get('audit/logs/', { params: { search: searchQuery } }),
        client.get('audit/logs/stats/')
      ]);

      const logsData = Array.isArray(logsRes.data) ? logsRes.data : (logsRes.data.results || []);
      const mapped = logsData.map((log: any) => ({
        id: log.id,
        user_name: log.user_name || 'System',
        action: log.action,
        model_name: log.model_name,
        object_repr: log.object_repr,
        timestamp: new Date(log.timestamp).toLocaleString(),
        ip_address: log.ip_address || 'N/A',
        changes: log.changes,
        color: actionColors[log.action] || 'text-blue-400'
      }));
      setLogs(mapped);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(debouncedSearch);
  }, [debouncedSearch]);

  return (
  <div className="space-y-6 md:space-y-8 pb-20">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/20">
          <ShieldAlert className="w-6 h-6 text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Security Audit Logs</h1>
          <p className="text-slate-400 text-sm md:text-base">Complete history of system activities and changes.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-widest">
        <Database className="w-4 h-4" />
        Live Monitoring Active
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AuditStat label="Total Actions (24h)" value={stats.total_actions_24h} icon={Activity} color="text-primary-400" />
      <AuditStat label="Sensitive Changes" value={stats.sensitive_changes} icon={ShieldAlert} color="text-rose-400" />
      <AuditStat label="Active Admins" value={stats.active_admins} icon={User} color="text-blue-400" />
    </div>

    <div className="glass-dark rounded-3xl border border-white/5 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            placeholder="Search logs by user, model or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 hover:bg-slate-700 transition-all text-sm">
          <Filter className="w-4 h-4" />
          Advanced Filter
        </button>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left min-w-[900px]">
          <thead>
            <tr className="bg-white/5">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Timestamp</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Action</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Module</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Target Object</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <TableSkeleton rows={8} cols={6} />
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No logs found.</td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <motion.tr
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={log.id}
                  className="hover:bg-white/[0.02] transition-all group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {log.timestamp}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-white text-sm">{log.user_name}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black tracking-widest uppercase ${log.color}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-slate-400 border border-slate-700">
                      {log.model_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{log.object_repr}</td>
                  <td className="px-6 py-4 text-right font-mono text-[10px] text-slate-500">{log.ip_address}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Detail Modal */}
    {selectedLog && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-dark w-full max-w-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Log Details</h3>
            <button onClick={() => setSelectedLog(null)} className="p-2 text-slate-400 hover:text-white">
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">User</p>
                <p className="text-white font-medium">{selectedLog.user_name}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</p>
                <p className="text-white font-medium">{selectedLog.timestamp}</p>
              </div>
            </div>
            
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Changes</p>
              {selectedLog.changes ? (
                <pre className="text-xs text-emerald-400 font-mono overflow-x-auto p-2 bg-black/30 rounded-lg">
                  {JSON.stringify(selectedLog.changes, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-slate-500 italic">No changes recorded for this action.</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </div>
  );
};

interface AuditStatProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

const AuditStat = ({ label, value, icon: Icon, color }: AuditStatProps) => (
  <div className="glass-dark p-6 rounded-3xl border border-white/5 flex items-center justify-between group">
    <div>
      <p className="text-sm text-slate-500 font-medium mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-white">{value}</h3>
    </div>
    <div className={`p-4 rounded-2xl bg-white/5 border border-white/5 ${color} group-hover:scale-110 transition-transform`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);
