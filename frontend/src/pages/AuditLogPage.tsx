import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { auditService } from "../api/services/auditService";
import {
  ShieldAlert,
  User,
  Clock,
  Activity,
  Search,
  Filter,
  Database,
  Eye,
} from "lucide-react";
import { TableSkeleton } from "../components/ui/Skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";

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
  CREATE: "text-emerald-400",
  UPDATE: "text-amber-400",
  DELETE: "text-rose-400",
  LOGIN: "text-purple-400",
};

export const AuditLogPage = () => {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: logsData, isLoading: loadingLogs } = useQuery({
    queryKey: ["audit-logs", debouncedSearch],
    queryFn: () => auditService.getLogs(debouncedSearch),
  });

  const { data: statsData } = useQuery({
    queryKey: ["audit-stats"],
    queryFn: auditService.getStats,
  });

  const logs = useMemo(() => {
    const data = Array.isArray(logsData) ? logsData : logsData?.results || [];
    return data.map((log: any) => ({
      id: log.id,
      user_name: log.user_name || "System",
      action: log.action,
      model_name: log.model_name,
      object_repr: log.object_repr,
      timestamp: new Date(log.timestamp).toLocaleString(),
      ip_address: log.ip_address || "N/A",
      changes: log.changes,
      color: actionColors[log.action] || "text-blue-400",
    }));
  }, [logsData]);

  const stats = statsData || {
    total_actions_24h: 0,
    sensitive_changes: 0,
    active_admins: 0,
  };

  const loading = loadingLogs;

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-rose-500/20 rounded-xl sm:rounded-2xl border border-rose-500/20 shrink-0">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary tracking-tight">
              Security <span className="text-gradient">Audit Logs</span>
            </h1>
            <p className="text-muted text-xs sm:text-sm uppercase tracking-widest font-bold mt-1">
              System Activity History
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-muted text-xs font-bold uppercase tracking-widest self-start sm:self-auto">
          <Database className="w-4 h-4" />
          Live Monitoring
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <AuditStat
          label="Total Actions (24h)"
          value={stats.total_actions_24h}
          icon={Activity}
          color="text-primary-400"
        />
        <AuditStat
          label="Sensitive Changes"
          value={stats.sensitive_changes}
          icon={ShieldAlert}
          color="text-rose-400"
        />
        <AuditStat
          label="Active Admins"
          value={stats.active_admins}
          icon={User}
          color="text-blue-400"
        />
      </div>

      <div className="glass rounded-[32px] sm:rounded-[40px] border border-white/5 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
            <input
              placeholder="Search logs by user, model or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-muted rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-sm w-full sm:w-auto font-bold">
            <Filter className="w-4 h-4" />
            Advanced Filter
          </button>
        </div>

        <div className="relative">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.02]">
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Target Object</TableHead>
                <TableHead className="text-right">IP Address</TableHead>
                <TableHead className="text-center">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton rows={8} cols={7} />
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-muted font-bold tracking-widest uppercase text-xs"
                  >
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: any) => (
                  <TableRow key={log.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5" />
                        {log.timestamp}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-primary text-xs sm:text-sm">
                        {log.user_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[9px] sm:text-[10px] font-black tracking-widest uppercase ${log.color}`}
                      >
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2.5 py-1 bg-white/5 rounded-lg text-[9px] sm:text-[10px] font-bold text-muted border border-white/10 uppercase tracking-widest whitespace-nowrap">
                        {log.model_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs sm:text-sm text-muted line-clamp-1 max-w-[200px]">
                        {log.object_repr}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-[9px] sm:text-[10px] text-dim whitespace-nowrap">
                        {log.ip_address}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 hover:bg-white/10 rounded-xl text-muted hover:text-primary transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Entry"
        description="Detailed record of system activity"
        className="max-w-2xl"
      >
        {selectedLog && (
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">
                  Actor
                </p>
                <p className="text-primary font-bold text-sm sm:text-base">
                  {selectedLog.user_name}
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">
                  Timestamp
                </p>
                <p className="text-primary font-bold text-sm sm:text-base">
                  {selectedLog.timestamp}
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">
                  Action
                </p>
                <p
                  className={`font-black text-sm sm:text-base uppercase tracking-widest ${selectedLog.color}`}
                >
                  {selectedLog.action}
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">
                  IP Source
                </p>
                <p className="text-primary font-mono text-xs sm:text-sm">
                  {selectedLog.ip_address}
                </p>
              </div>
            </div>

            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
              <p className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest mb-3">
                Payload Delta
              </p>
              {selectedLog.changes &&
              Object.keys(selectedLog.changes).length > 0 ? (
                <div className="bg-[#0A0F1A] p-4 rounded-2xl overflow-x-auto border border-white/5 custom-scrollbar">
                  <pre className="text-[10px] sm:text-xs text-emerald-400 font-mono">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="bg-[#0A0F1A] p-4 rounded-2xl border border-white/5">
                  <p className="text-xs text-muted font-mono italic">
                    {/* No delta recorded */} No mutations detected for this
                    event.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
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
  <div className="glass p-6 rounded-3xl border border-white/5 flex items-center justify-between group">
    <div>
      <p className="text-sm text-muted font-medium mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-primary">{value}</h3>
    </div>
    <div
      className={`p-4 rounded-2xl bg-white/5 border border-white/5 ${color} group-hover:scale-110 transition-transform`}
    >
      <Icon className="w-6 h-6" />
    </div>
  </div>
);
