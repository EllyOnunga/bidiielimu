import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LifeBuoy,
  Plus,
  MessageCircle,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  MoreVertical,
  ShieldAlert,
} from "lucide-react";
import {
  supportService,
  type SupportTicket,
} from "../api/services/supportService";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Card } from "../components/ui/Card";

const StatusBadge = ({ status }: { status: SupportTicket["status"] }) => {
  const styles = {
    OPEN: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    IN_PROGRESS: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    RESOLVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    CLOSED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${styles[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
};

const PriorityBadge = ({
  priority,
}: {
  priority: SupportTicket["priority"];
}) => {
  const styles = {
    LOW: "bg-slate-500/10 text-slate-400",
    MEDIUM: "bg-blue-500/10 text-blue-400",
    HIGH: "bg-orange-500/10 text-orange-400",
    CRITICAL: "bg-rose-500/10 text-rose-400 animate-pulse",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${styles[priority]}`}
    >
      {priority}
    </span>
  );
};

export const SupportPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: supportService.getTickets,
  });

  const createMutation = useMutation({
    mutationFn: supportService.createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Ticket Initialized. Strategic support is being deployed.");
      setIsModalOpen(false);
    },
    onError: () => {
      toast.error("Transmission Failed. Systems interference detected.");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      subject: formData.get("subject") as string,
      priority: formData.get("priority") as SupportTicket["priority"],
      description: formData.get("description") as string,
    });
  };

  const stats = {
    total: tickets?.length || 0,
    open:
      tickets?.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS")
        .length || 0,
    resolved: tickets?.filter((t) => t.status === "RESOLVED").length || 0,
  };

  const filteredTickets = tickets?.filter((t) =>
    t.subject.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-10"
    >
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-600 rounded-xl shadow-premium">
              <LifeBuoy className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tighter uppercase font-serif">
              Support <span className="text-primary-500">Hub</span>
            </h1>
          </div>
          <p className="text-muted text-xs font-medium uppercase tracking-widest">
            Direct interface for institutional maintenance & technical
            briefings.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-500 text-white flex items-center gap-2 group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          Initialize Request
        </Button>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6 border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black text-blue-400/50 uppercase tracking-widest">
              Active Channels
            </span>
          </div>
          <p className="text-4xl font-black text-primary mb-1">{stats.total}</p>
          <p className="text-[9px] font-black text-muted uppercase tracking-widest">
            Total Briefings
          </p>
        </Card>

        <Card className="p-6 border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black text-amber-400/50 uppercase tracking-widest">
              Pending Ops
            </span>
          </div>
          <p className="text-4xl font-black text-primary mb-1">{stats.open}</p>
          <p className="text-[9px] font-black text-muted uppercase tracking-widest">
            Awaiting Resolution
          </p>
        </Card>

        <Card className="p-6 border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black text-emerald-400/50 uppercase tracking-widest">
              Success Rate
            </span>
          </div>
          <p className="text-4xl font-black text-primary mb-1">
            {stats.resolved}
          </p>
          <p className="text-[9px] font-black text-muted uppercase tracking-widest">
            Missions Accomplished
          </p>
        </Card>
      </div>

      {/* ── TICKETS TABLE ── */}
      <Card className="overflow-hidden border-white/5 bg-white/[0.01]">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              placeholder="Search communications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 bg-white/5 border-white/5"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/5 text-muted gap-2"
            >
              <Filter className="w-3.5 h-3.5" /> Filter
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted">
                    ID
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted">
                    Briefing Subject
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted">
                    Priority
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted">
                    Transmission Date
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <ShieldAlert className="w-10 h-10" />
                        <p className="text-xs font-black uppercase tracking-widest">
                          No communication history found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets?.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="border-white/5 group hover:bg-white/[0.02] transition-colors"
                    >
                      <TableCell className="font-mono text-[10px] text-muted">
                        #{ticket.id.toString().padStart(4, "0")}
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-bold text-primary">
                          {ticket.subject}
                        </p>
                        <p className="text-[9px] text-muted truncate max-w-[200px]">
                          {ticket.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={ticket.priority} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell className="text-[10px] text-muted font-medium">
                        {new Date(ticket.created_at).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <button className="p-2 hover:bg-white/10 rounded-lg text-muted hover:text-primary transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* ── NEW TICKET MODAL ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize Maintenance Request"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">
              Briefing Subject
            </label>
            <Input
              name="subject"
              required
              placeholder="System downtime, data query, etc."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">
              Priority Vector
            </label>
            <select
              name="priority"
              required
              className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-primary-500 text-primary transition-all text-sm font-bold"
            >
              <option value="LOW">Low - General Inquiry</option>
              <option value="MEDIUM">Medium - Operational Adjustment</option>
              <option value="HIGH">High - Workflow Obstruction</option>
              <option value="CRITICAL">Critical - System Failure</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">
              Mission Details (Description)
            </label>
            <textarea
              name="description"
              required
              rows={4}
              className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-primary-500 text-primary transition-all text-sm font-bold resize-none"
              placeholder="Provide tactical details about the encounter..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 border-white/10"
            >
              Abort
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 bg-primary-600 hover:bg-primary-500 text-white"
            >
              {createMutation.isPending
                ? "Transmitting..."
                : "Initialize Briefing"}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
