import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Loader2,
  Check,
  X,
  FileQuestion,
} from "lucide-react";
import toast from "react-hot-toast";
import { hrService } from "../api/services/hrService";
import { useAuthStore } from "../store/authStore";

export const LeavePage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isApprover =
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN" ||
    user?.role === "PRINCIPAL";

  const [activeTab, setActiveTab] = useState<"my-leaves" | "approvals">(
    "my-leaves",
  );
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    leave_type: "Annual",
    reason: "",
  });

  // Queries
  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ["leave-requests"],
    queryFn: async () => {
      const res = await hrService.getAllLeaveRequests();
      return Array.isArray(res) ? res : (res as any).results || [];
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: hrService.createLeaveRequest,
    onSuccess: () => {
      toast.success("Leave request submitted successfully!");
      setIsApplyModalOpen(false);
      setFormData({
        start_date: "",
        end_date: "",
        leave_type: "Annual",
        reason: "",
      });
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
    },
    onError: (error: any) => {
      const data = error.response?.data;
      if (data && typeof data === "object") {
        const errStr = Object.entries(data)
          .map(([key, val]) => {
            if (key === "detail") return String(val);
            const label = key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
            const msg = Array.isArray(val) ? val.join(", ") : String(val);
            return `${label}: ${msg}`;
          })
          .join("\n");
        toast.error(errStr || "Failed to submit leave request");
      } else {
        toast.error("Failed to submit leave request");
      }
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id }: { id: number }) =>
      hrService.updateLeaveStatus(id, "APPROVED"),
    onSuccess: () => {
      toast.success("Leave request approved!");
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
    },
    onError: () => {
      toast.error("Failed to approve leave request");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id }: { id: number }) =>
      hrService.updateLeaveStatus(id, "REJECTED"),
    onSuccess: () => {
      toast.success("Leave request rejected!");
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
    },
    onError: () => {
      toast.error("Failed to reject leave request");
    },
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date || !formData.reason.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    createMutation.mutate(formData);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "REJECTED":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default:
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Clock className="w-4 h-4 text-amber-400" />;
    }
  };

  // Filter requests
  // My requests: if admin, we can show everything, but normally show everything in their history list or filter
  const pendingApprovals = leaves.filter((l: any) => l.status === "PENDING");

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary tracking-tight leading-none">
            Leave <span className="text-gradient">Management</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm font-medium uppercase tracking-widest">
            Apply for Time Off and Approve Leave Requests
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="px-6 py-3.5 bg-primary-500 hover:bg-primary-400 text-white rounded-[24px] font-black text-sm flex items-center gap-2 shadow-premium transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* Tabs Menu */}
      {isApprover && (
        <div className="flex p-1 bg-white/5 rounded-[24px] border border-white/5 backdrop-blur-md max-w-md">
          <button
            onClick={() => setActiveTab("my-leaves")}
            className={`flex-1 py-3 text-center rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === "my-leaves"
                ? "bg-primary-500 text-white shadow-premium"
                : "text-muted hover:text-primary"
            }`}
          >
            My Leave History
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={`flex-1 py-3 text-center rounded-[20px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              activeTab === "approvals"
                ? "bg-primary-500 text-white shadow-premium"
                : "text-muted hover:text-primary"
            }`}
          >
            Pending Approvals
            {pendingApprovals.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] bg-rose-500 text-white rounded-full font-black animate-pulse">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Content Section */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            <p className="text-muted font-bold uppercase tracking-widest">
              Accessing Secure Records...
            </p>
          </div>
        ) : activeTab === "my-leaves" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            key="my-leaves"
            className="glass rounded-[32px] border border-white/5 overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-white/5">
              <h2 className="text-xl font-black text-primary flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary-400" />
                Leave History
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-primary-200/40">
                      Type
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-primary-200/40">
                      Start Date
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-primary-200/40">
                      End Date
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-primary-200/40">
                      Reason
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-primary-200/40">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave: any) => (
                    <tr
                      key={leave.id}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors"
                    >
                      <td className="p-5 text-sm font-black text-primary">
                        {leave.leave_type}
                      </td>
                      <td className="p-5 text-sm text-muted">
                        {leave.start_date}
                      </td>
                      <td className="p-5 text-sm text-muted">
                        {leave.end_date}
                      </td>
                      <td className="p-5 text-sm text-muted max-w-xs truncate">
                        {leave.reason}
                      </td>
                      <td className="p-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${getStatusBadgeClass(
                            leave.status,
                          )}`}
                        >
                          {getStatusIcon(leave.status)}
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-muted">
                        No leave history records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            key="approvals"
            className="glass rounded-[32px] border border-white/5 overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-white/5">
              <h2 className="text-xl font-black text-primary flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Pending Approvals
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-primary-200/40">
                      Staff Member
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-primary-200/40">
                      Type
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-primary-200/40">
                      Dates
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-primary-200/40">
                      Reason
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-primary-200/40 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApprovals.map((leave: any) => (
                    <tr
                      key={leave.id}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors"
                    >
                      <td className="p-5 text-sm font-black text-primary">
                        {leave.staff_name || "Staff Member"}
                      </td>
                      <td className="p-5 text-sm text-muted">
                        {leave.leave_type}
                      </td>
                      <td className="p-5 text-sm text-muted">
                        {leave.start_date} to {leave.end_date}
                      </td>
                      <td className="p-5 text-sm text-muted max-w-xs truncate">
                        {leave.reason}
                      </td>
                      <td className="p-5 text-right flex justify-end gap-2">
                        <button
                          disabled={
                            approveMutation.isPending ||
                            rejectMutation.isPending
                          }
                          onClick={() =>
                            approveMutation.mutate({ id: leave.id })
                          }
                          className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          disabled={
                            approveMutation.isPending ||
                            rejectMutation.isPending
                          }
                          onClick={() =>
                            rejectMutation.mutate({ id: leave.id })
                          }
                          className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pendingApprovals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-muted">
                        No pending approvals found. Excellent!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Application Drawer / Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsApplyModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass rounded-[32px] border border-white/10 w-full max-w-xl overflow-hidden shadow-2xl relative z-10"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
              <h3 className="text-xl font-black text-primary flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-400" />
                Apply for Leave
              </h3>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-2 text-primary-200/20 hover:text-white transition-all rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">
                  Leave Type
                </label>
                <select
                  required
                  className="w-full bg-[#1b1c20] border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
                  value={formData.leave_type}
                  onChange={(e) =>
                    setFormData({ ...formData, leave_type: e.target.value })
                  }
                >
                  <option value="Sick">Sick Leave</option>
                  <option value="Annual">Annual Leave</option>
                  <option value="Maternity">Maternity</option>
                  <option value="Paternity">Paternity</option>
                  <option value="Compassionate">Compassionate</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">
                  Reason for Time Off
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide details about your time off request..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm resize-none"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                />
              </div>

              <div className="pt-4">
                <button
                  disabled={createMutation.isPending}
                  className="w-full py-4 bg-primary-500 hover:bg-primary-400 text-white rounded-[20px] font-black text-base shadow-premium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <FileQuestion className="w-5 h-5" />
                  )}
                  {createMutation.isPending
                    ? "SUBMITTING..."
                    : "SUBMIT REQUEST"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
