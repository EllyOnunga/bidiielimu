import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  CreditCard,
  Loader2,
  TrendingUp,
  ShieldCheck,
  Zap,
  Download,
  Printer,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  feesService,
  type Payment,
  type StudentBalance,
} from "../api/services/feesService";
import { useAuthStore } from "../store/authStore";
import { studentsService } from "../api/services/studentsService";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import { TableSkeleton } from "../components/ui/Skeleton";

export const FeesPage = () => {
  const queryClient = useQueryClient();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const user = useAuthStore((state) => state.user);
  const isPortalView = user?.role === "PARENT" || user?.role === "STUDENT";

  // Bulk Print & Individual Receipt States
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<number[]>([]);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  const [bulkPrintTaskId, setBulkPrintTaskId] = useState<string | null>(null);
  const [bulkPrintProgress, setBulkPrintProgress] = useState(0);
  const [bulkPrintStatus, setBulkPrintStatus] = useState<string | null>(null);
  const [bulkPrintTotal, setBulkPrintTotal] = useState(0);
  const [bulkPrintCurrent, setBulkPrintCurrent] = useState(0);
  const [isSingleDownloading, setIsSingleDownloading] = useState<number | null>(
    null,
  );

  // Clear selections when search query changes
  useEffect(() => {
    setSelectedPaymentIds([]);
  }, [debouncedSearch]);

  const handleDownloadSingleReceipt = async (
    paymentId: number,
    transactionRef: string,
  ) => {
    setIsSingleDownloading(paymentId);
    try {
      const blob = await feesService.downloadReceipt(paymentId);
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `receipt_${transactionRef}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Receipt downloaded successfully!");
    } catch (err: any) {
      toast.error("Failed to download receipt.");
      console.error(err);
    } finally {
      setIsSingleDownloading(null);
    }
  };

  const handleBulkPrint = async () => {
    if (selectedPaymentIds.length === 0) return;
    setIsBulkPrinting(true);
    setBulkPrintProgress(0);
    setBulkPrintStatus("PENDING");
    setBulkPrintTotal(selectedPaymentIds.length);
    setBulkPrintCurrent(0);

    try {
      const response = await feesService.bulkPrint(selectedPaymentIds);
      const blob = response.data;

      if (blob.type === "application/json") {
        const text = await blob.text();
        const data = JSON.parse(text);
        if (data.task_id) {
          setBulkPrintTaskId(data.task_id);
          setBulkPrintStatus(data.status || "PENDING");
          toast.loading("Bulk printing task started in background...", {
            id: "bulk-print-toast",
          });
        } else {
          throw new Error("No task ID returned");
        }
      } else {
        // Direct synchronous PDF returned!
        const url = window.URL.createObjectURL(
          new Blob([blob], { type: "application/pdf" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "bulk_receipts.pdf");
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);

        // Open in print window
        const printWindow = window.open(url, "_blank");
        if (printWindow) {
          printWindow.addEventListener("load", () => {
            printWindow.print();
          });
        }

        toast.success("Receipts downloaded successfully!");
        setSelectedPaymentIds([]);
        setIsBulkPrinting(false);
      }
    } catch (err: any) {
      toast.error("Failed to compile bulk receipts.");
      console.error(err);
      setIsBulkPrinting(false);
    }
  };

  // Poll background task status
  useEffect(() => {
    if (!bulkPrintTaskId) return;

    let intervalId: any;
    const pollStatus = async () => {
      try {
        const data = await feesService.getTaskStatus(bulkPrintTaskId);
        setBulkPrintStatus(data.status);
        setBulkPrintCurrent(data.current || 0);
        setBulkPrintTotal(data.total || selectedPaymentIds.length || 1);

        const percent =
          data.total > 0 ? Math.round((data.current / data.total) * 100) : 0;
        setBulkPrintProgress(percent);

        if (data.status === "SUCCESS") {
          clearInterval(intervalId);
          toast.dismiss("bulk-print-toast");
          setBulkPrintTaskId(null);
          setIsBulkPrinting(false);

          if (data.download_url) {
            const link = document.createElement("a");
            link.href = data.download_url;
            link.setAttribute("download", "bulk_receipts.pdf");
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);

            // Open in new window for print dialog
            window.open(data.download_url, "_blank");
            toast.success("Bulk receipts generated and downloaded!");
          } else {
            toast.error("Download URL not found in completed task.");
          }
          setSelectedPaymentIds([]);
        } else if (data.status === "FAILURE") {
          clearInterval(intervalId);
          toast.dismiss("bulk-print-toast");
          setBulkPrintTaskId(null);
          setIsBulkPrinting(false);
          toast.error(data.errors?.[0] || "Bulk receipt generation failed.");
        }
      } catch (err: any) {
        console.error("Error polling bulk print status:", err);
        clearInterval(intervalId);
        toast.dismiss("bulk-print-toast");
        setBulkPrintTaskId(null);
        setIsBulkPrinting(false);
        toast.error("Failed checking background status.");
      }
    };

    intervalId = setInterval(pollStatus, 2000);
    pollStatus();

    return () => clearInterval(intervalId);
  }, [bulkPrintTaskId]);

  const { data: children = [] } = useQuery({
    queryKey: ["my-children"],
    queryFn: () => studentsService.getMyChildren(),
    enabled: user?.role === "PARENT",
  });

  const [portalSelectedStudentId, setPortalSelectedStudentId] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (!portalSelectedStudentId) {
      if (user?.role === "PARENT" && children.length > 0) {
        setPortalSelectedStudentId(children[0].id);
      }
    }
  }, [children, user, portalSelectedStudentId]);

  const { data: portalFeeSummary, isLoading: loadingPortalFees } = useQuery({
    queryKey: ["portal-fee-summary", portalSelectedStudentId],
    queryFn: () => feesService.getFeeSummary(portalSelectedStudentId),
    enabled: isPortalView,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: paymentsData = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["payments", debouncedSearch],
    queryFn: () => feesService.getPayments(debouncedSearch),
    select: (data) => {
      const raw = Array.isArray(data) ? data : data.results || [];
      return raw.map((p: any) => ({
        id: p.id,
        student_name: p.student_name || "Unknown Unit",
        student_admission: p.student_admission || "ADM-000",
        transaction_reference: p.transaction_reference,
        amount: p.amount,
        status: p.status,
        payment_date: new Date(p.payment_date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      }));
    },
  });

  const { data: balances = [] } = useQuery({
    queryKey: ["student_balances"],
    queryFn: feesService.getBalances,
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });

  const initiatePaymentMutation = useMutation({
    mutationFn: (data: { student_id: string; amount: string; phone: string }) =>
      feesService.initiateMpesa(data),
    onSuccess: () => {
      toast.success("M-Pesa payment request sent");
      setShowPaymentModal(false);
      setPhoneNumber("");
      setAmount("");
      setSelectedStudentId("");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["student_balances"] });
      queryClient.invalidateQueries({ queryKey: ["portal-fee-summary"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Payment request failed");
    },
  });

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudentId = isPortalView
      ? (portalSelectedStudentId || portalFeeSummary?.student_id)?.toString()
      : selectedStudentId;

    if (!targetStudentId) return toast.error("Please select a student first.");
    initiatePaymentMutation.mutate({
      student_id: targetStudentId,
      amount: amount,
      phone: phoneNumber,
    });
  };

  const totalExpected = balances.reduce(
    (sum: number, b: StudentBalance) => sum + parseFloat(b.expected_fees),
    0,
  );
  const totalCollected = balances.reduce(
    (sum: number, b: StudentBalance) => sum + parseFloat(b.total_paid),
    0,
  );
  const totalOutstanding = balances.reduce(
    (sum: number, b: StudentBalance) => sum + parseFloat(b.balance),
    0,
  );
  const completionRate =
    totalExpected > 0
      ? ((totalCollected / totalExpected) * 100).toFixed(1)
      : "0.0";

  if (isPortalView) {
    const summary = portalFeeSummary;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12 pb-24"
      >
        {/* Header & Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-none">
              Fees & <span className="text-gradient">Payments</span>
            </h1>
            <p className="text-muted text-xs sm:text-sm md:text-base font-medium max-w-xl">
              Monitor school fee balances, review payment logs, and execute
              secure digital transactions.
            </p>
          </div>
          <Button
            onClick={() => setShowPaymentModal(true)}
            className="gap-2 h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium w-full lg:w-auto"
          >
            <Zap className="w-5 h-5" /> Pay School Fees
          </Button>
        </div>

        {/* Parent Switcher */}
        {user?.role === "PARENT" && children.length > 1 && (
          <div className="flex gap-2 p-1.5 bg-slate-800/50 rounded-2xl border border-white/5 self-start overflow-x-auto max-w-full no-scrollbar">
            {children.map((child: any) => (
              <button
                key={child.id}
                onClick={() => setPortalSelectedStudentId(child.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  portalSelectedStudentId === child.id
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {child.first_name}
              </button>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Billed */}
          <div className="premium-card p-8 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-[80px] -mr-16 -mt-16 group-hover:bg-primary-500/20 transition-all duration-700" />
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-4">
              Total Invoiced Fees
            </p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary tracking-tight leading-none">
                {loadingPortalFees
                  ? "..."
                  : `KSh ${(summary?.expected_fees || 0).toLocaleString()}`}
              </h3>
              <div className="w-14 h-14 rounded-2xl bg-primary-600/10 flex items-center justify-center border border-primary-500/10 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6 text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* Paid */}
          <div className="premium-card p-8 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[80px] -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-700" />
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-4">
              Total Fees Paid
            </p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-400 tracking-tight leading-none">
                {loadingPortalFees
                  ? "..."
                  : `KSh ${(summary?.total_paid || 0).toLocaleString()}`}
              </h3>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="premium-card p-8 group relative overflow-hidden sm:col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[80px] -mr-16 -mt-16 group-hover:bg-rose-500/20 transition-all duration-700" />
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-4">
              Outstanding Balance
            </p>
            <div className="flex items-end justify-between">
              <h3
                className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none ${summary?.balance > 0 ? "text-rose-400" : "text-emerald-400"}`}
              >
                {loadingPortalFees
                  ? "..."
                  : `KSh ${(summary?.balance || 0).toLocaleString()}`}
              </h3>
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${summary?.balance > 0 ? "bg-rose-500/10 border-rose-500/10" : "bg-emerald-500/10 border-emerald-500/10"}`}
              >
                <AlertCircle
                  className={`w-6 h-6 ${summary?.balance > 0 ? "text-rose-400" : "text-emerald-400"}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ledger */}
        <div className="premium-card !p-0 overflow-hidden border-white/5">
          <div className="p-8 border-b border-white/5 bg-white/[0.01]">
            <h2 className="text-lg font-black text-primary uppercase tracking-[0.2em]">
              Payment History
            </h2>
            <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">
              Detailed history of all fees paid
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-0 hover:bg-transparent h-20">
                  <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest pl-10">
                    Transaction ID
                  </TableHead>
                  <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest">
                    Payment Method
                  </TableHead>
                  <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest">
                    Payment Amount
                  </TableHead>
                  <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest">
                    Date Paid
                  </TableHead>
                  <TableHead className="text-right text-muted text-[10px] font-black uppercase tracking-widest pr-10">
                    Receipt
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPortalFees ? (
                  <TableSkeleton rows={5} cols={5} />
                ) : !summary?.recent_payments?.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-24">
                      <div className="flex flex-col items-center opacity-20">
                        <CreditCard className="w-16 h-16 mb-4" />
                        <p className="text-sm font-black uppercase tracking-[0.3em]">
                          No Payments Recorded
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  summary.recent_payments.map((p: any, idx: number) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="group transition-all h-20 border-white/5 hover:bg-white/[0.03]"
                    >
                      <TableCell className="pl-10 font-mono text-xs text-primary-400 font-black uppercase tracking-widest">
                        {p.transaction_id || "VERIFIED"}
                      </TableCell>
                      <TableCell className="text-sm font-bold text-slate-300">
                        <span className="bg-white/5 px-3 py-1 rounded-lg border border-white/5 text-[10px] font-black uppercase tracking-widest">
                          {p.payment_method}
                        </span>
                      </TableCell>
                      <TableCell className="font-black text-base text-primary tracking-tight">
                        KSh {Number(p.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-[10px] font-black text-dim uppercase tracking-widest">
                        {p.payment_date}
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isSingleDownloading === p.id}
                          onClick={() =>
                            handleDownloadSingleReceipt(
                              p.id,
                              p.transaction_id || "VERIFIED",
                            )
                          }
                          className="h-9 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5 bg-white/5 text-primary hover:bg-primary-600 hover:text-white flex items-center justify-center gap-1.5 ml-auto"
                        >
                          {isSingleDownloading === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* M-Pesa Modal */}
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          className="max-w-2xl glass-morphic border-white/10 !rounded-[40px]"
        >
          <div className="space-y-12 mt-8">
            <div className="flex items-center gap-8 p-8 bg-primary-600 rounded-[32px] shadow-glow-lg border border-white/20">
              <div className="w-20 h-20 bg-white/20 rounded-[24px] flex items-center justify-center border border-white/30 backdrop-blur-md">
                <CreditCard className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-2">
                  Record Transaction
                </h3>
                <p className="text-primary-100 text-[10px] font-black uppercase tracking-[0.3em] opacity-80">
                  Pay instantly using M-Pesa
                </p>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-10">
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] pl-1">
                    Student
                  </label>
                  <Input
                    disabled
                    value={`${summary?.name} (${summary?.admission_number})`}
                    className="h-14 font-black bg-white/5 border-white/5 text-slate-300"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] pl-1">
                      M-Pesa Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400/50" />
                      <Input
                        required
                        placeholder="07XX XXX XXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-14 h-16 font-black text-lg tracking-widest"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] pl-1">
                      Payment Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary-400/50 font-black text-lg">
                        KSh
                      </span>
                      <Input
                        required
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-16 h-16 font-black text-2xl text-primary border-primary-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-primary-600/5 border border-primary-600/10 rounded-[32px] flex gap-5">
                <ShieldCheck className="w-8 h-8 text-primary-400 shrink-0" />
                <p className="text-[11px] font-black text-primary-300/80 uppercase tracking-widest leading-relaxed">
                  This will send an instant M-Pesa payment prompt (STK push) to
                  your phone. Enter your M-Pesa PIN on your phone to complete
                  the payment.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 h-16 text-[10px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={initiatePaymentMutation.isPending}
                  className="flex-[2] h-16 text-[10px]"
                >
                  {initiatePaymentMutation.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  ) : (
                    "Send Payment Prompt"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-24"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-none">
            Fee <span className="text-gradient">Management</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm md:text-base font-medium max-w-xl">
            Track and manage all fee collections, balances, and payment records.
          </p>
        </div>
        <Button
          onClick={() => setShowPaymentModal(true)}
          className="gap-2 h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium w-full lg:w-auto"
        >
          <Zap className="w-5 h-5" /> Pay Fees
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="premium-card p-8 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-[80px] -mr-16 -mt-16 group-hover:bg-primary-500/20 transition-all duration-700" />
          <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-4">
            Total Fees Collected
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary tracking-tight leading-none">
              KSh {(totalCollected / 1000).toFixed(1)}k
            </h3>
            <div className="w-14 h-14 rounded-2xl bg-primary-600/10 flex items-center justify-center border border-primary-500/10 group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6 text-primary-400" />
            </div>
          </div>
        </div>

        <div className="premium-card p-8 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[80px] -mr-16 -mt-16 group-hover:bg-rose-500/20 transition-all duration-700" />
          <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-4">
            Outstanding Fees
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-rose-400 tracking-tight leading-none">
              KSh {(totalOutstanding / 1000).toFixed(1)}k
            </h3>
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/10">
              <AlertCircle className="w-6 h-6 text-rose-400/50" />
            </div>
          </div>
        </div>

        <div className="premium-card p-8 group relative overflow-hidden sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[80px] -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-700" />
          <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-4">
            Fee Collection Progress
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary-400 tracking-tight leading-none">
                {completionRate}%
              </h3>
              <TrendingUp className="w-6 h-6 text-primary-400/50" />
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                className="h-full bg-primary-600 rounded-full shadow-glow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card !p-0 overflow-hidden border-white/5">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
          <div>
            <h2 className="text-lg font-black text-primary uppercase tracking-[0.2em]">
              Payment Records
            </h2>
            <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">
              View and search all school fee payments
            </p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/20" />
            <Input
              placeholder="Search by student name or transaction code..."
              className="pl-12 h-14 bg-white/5 border-white/5"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-0 hover:bg-transparent h-20">
                <TableHead className="w-12 pl-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary-600 focus:ring-primary-500 focus:ring-offset-bg-color cursor-pointer transition-all"
                    checked={
                      paymentsData.length > 0 &&
                      selectedPaymentIds.length ===
                        paymentsData.filter(
                          (p: any) => p.status === "COMPLETED",
                        ).length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        const completed = paymentsData
                          .filter((p: any) => p.status === "COMPLETED")
                          .map((p: any) => p.id);
                        setSelectedPaymentIds(completed);
                      } else {
                        setSelectedPaymentIds([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest pl-4">
                  Student Details
                </TableHead>
                <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest">
                  M-Pesa Ref
                </TableHead>
                <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest">
                  Amount
                </TableHead>
                <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest">
                  Status
                </TableHead>
                <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest">
                  Date Paid
                </TableHead>
                <TableHead className="text-right text-muted text-[10px] font-black uppercase tracking-widest pr-10">
                  Receipt
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {paymentsLoading ? (
                  <TableSkeleton rows={10} cols={7} />
                ) : paymentsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-40">
                      <div className="flex flex-col items-center opacity-20">
                        <CreditCard className="w-20 h-20 mb-6" />
                        <p className="text-lg font-black uppercase tracking-[0.3em]">
                          No payments found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentsData.map((payment: Payment, idx: number) => (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`group transition-all h-24 border-white/5 hover:bg-white/[0.03] ${
                        selectedPaymentIds.includes(payment.id)
                          ? "bg-primary-600/[0.02]"
                          : ""
                      }`}
                    >
                      <TableCell className="pl-10">
                        {payment.status === "COMPLETED" ? (
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary-600 focus:ring-primary-500 focus:ring-offset-bg-color cursor-pointer transition-all"
                            checked={selectedPaymentIds.includes(payment.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPaymentIds((prev) => [
                                  ...prev,
                                  payment.id,
                                ]);
                              } else {
                                setSelectedPaymentIds((prev) =>
                                  prev.filter((id) => id !== payment.id),
                                );
                              }
                            }}
                          />
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                      </TableCell>
                      <TableCell className="pl-4">
                        <div className="text-base font-black text-primary uppercase tracking-tight leading-none mb-1.5">
                          {payment.student_name}
                        </div>
                        <div className="text-[10px] font-black text-dim uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md inline-block">
                          {payment.student_admission}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-primary-400 font-black uppercase tracking-widest">
                        {payment.transaction_reference}
                      </TableCell>
                      <TableCell className="font-black text-lg text-primary tracking-tight">
                        KSh {Number(payment.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                            payment.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : payment.status === "FAILED"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {payment.status === "COMPLETED" && (
                            <CheckCircle2 className="w-3.5 h-3.5 shadow-glow-sm" />
                          )}
                          {payment.status === "PENDING" && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          )}
                          {payment.status}
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] font-black text-dim uppercase tracking-widest">
                        {payment.payment_date}
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        {payment.status === "COMPLETED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isSingleDownloading === payment.id}
                            onClick={() =>
                              handleDownloadSingleReceipt(
                                payment.id,
                                payment.transaction_reference || "VERIFIED",
                              )
                            }
                            className="h-9 w-9 p-0 rounded-lg border border-white/5 bg-white/5 text-primary hover:bg-primary-600 hover:text-white flex items-center justify-center ml-auto"
                            title="Download Receipt"
                          >
                            {isSingleDownloading === payment.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        className="max-w-2xl glass-morphic border-white/10 !rounded-[40px]"
      >
        <div className="space-y-12 mt-8">
          <div className="flex items-center gap-8 p-8 bg-primary-600 rounded-[32px] shadow-glow-lg border border-white/20">
            <div className="w-20 h-20 bg-white/20 rounded-[24px] flex items-center justify-center border border-white/30 backdrop-blur-md">
              <CreditCard className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-2">
                Record Transaction
              </h3>
              <p className="text-primary-100 text-[10px] font-black uppercase tracking-[0.3em] opacity-80">
                Pay instantly using M-Pesa
              </p>
            </div>
          </div>

          <form onSubmit={handlePayment} className="space-y-10">
            <div className="space-y-8">
              <Select
                label="Select Student"
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                <option value="" className="bg-bg-color">
                  Select a student...
                </option>
                {balances.map((b: StudentBalance) => (
                  <option
                    key={b.student_id}
                    value={b.student_id}
                    className="bg-bg-color"
                  >
                    {b.name} ({b.admission_number}) • Balance: KSh{" "}
                    {Number(b.balance).toLocaleString()}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] pl-1">
                    M-Pesa Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400/50" />
                    <Input
                      required
                      placeholder="07XX XXX XXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-14 h-16 font-black text-lg tracking-widest"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] pl-1">
                    Payment Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary-400/50 font-black text-lg">
                      KSh
                    </span>
                    <Input
                      required
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-16 h-16 font-black text-2xl text-primary border-primary-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-primary-600/5 border border-primary-600/10 rounded-[32px] flex gap-5">
              <ShieldCheck className="w-8 h-8 text-primary-400 shrink-0" />
              <p className="text-[11px] font-black text-primary-300/80 uppercase tracking-widest leading-relaxed">
                This will send an instant M-Pesa payment prompt (STK push) to
                your phone. Enter your M-Pesa PIN on your phone to complete the
                payment.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 h-16 text-[10px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={initiatePaymentMutation.isPending}
                className="flex-[2] h-16 text-[10px]"
              >
                {initiatePaymentMutation.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                  "Send Payment Prompt"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectedPaymentIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-xl glass-morphic border border-white/10 rounded-2xl shadow-glow-lg px-6 py-4 flex items-center justify-between gap-4 backdrop-blur-md bg-slate-900/80"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center border border-primary-500/30">
                <FileText className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-widest leading-none">
                  {selectedPaymentIds.length} Selected
                </p>
                <p className="text-[10px] text-muted font-bold uppercase mt-1">
                  Ready to compile & print
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPaymentIds([])}
                className="text-[10px] h-10 px-4 rounded-xl text-slate-400 hover:text-white"
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={handleBulkPrint}
                disabled={isBulkPrinting}
                className="gap-2 text-[10px] h-10 px-5 rounded-xl uppercase tracking-widest font-black"
              >
                {isBulkPrinting && !bulkPrintTaskId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5" />
                )}
                Print Receipts
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Print Progress Modal */}
      <Modal
        isOpen={isBulkPrinting && !!bulkPrintTaskId}
        onClose={() => {
          if (bulkPrintStatus === "SUCCESS" || bulkPrintStatus === "FAILURE") {
            setBulkPrintTaskId(null);
            setIsBulkPrinting(false);
          }
        }}
        className="max-w-md glass-morphic border-white/10 !rounded-[32px] p-6 text-center"
      >
        <div className="space-y-8 mt-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center mx-auto">
            {bulkPrintStatus === "SUCCESS" ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
            ) : bulkPrintStatus === "FAILURE" ? (
              <AlertCircle className="w-8 h-8 text-rose-400" />
            ) : (
              <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            )}
          </div>

          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">
              {bulkPrintStatus === "SUCCESS"
                ? "Compilation Complete"
                : bulkPrintStatus === "FAILURE"
                  ? "Compilation Failed"
                  : "Compiling Receipts"}
            </h3>
            <p className="text-[10px] font-black text-muted uppercase tracking-widest">
              {bulkPrintStatus === "SUCCESS"
                ? "Your document is ready for printing"
                : bulkPrintStatus === "FAILURE"
                  ? "Something went wrong in the background"
                  : `Processing ${bulkPrintCurrent} of ${bulkPrintTotal} receipts`}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-dim uppercase">
              <span>Progress</span>
              <span className="font-mono text-primary-400">
                {bulkPrintProgress}%
              </span>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${bulkPrintProgress}%` }}
                className="h-full bg-primary-600 rounded-full shadow-glow-sm"
              />
            </div>
          </div>

          <div className="text-[10px] text-muted font-bold uppercase tracking-widest bg-white/[0.02] p-4 rounded-xl border border-white/5">
            Do not close this page. The system is securely compiling
            tenant-locked PDFs in a dedicated, background context.
          </div>

          {(bulkPrintStatus === "SUCCESS" || bulkPrintStatus === "FAILURE") && (
            <Button
              onClick={() => {
                setBulkPrintTaskId(null);
                setIsBulkPrinting(false);
              }}
              className="w-full h-12 uppercase tracking-widest text-[10px] font-black"
            >
              Dismiss
            </Button>
          )}
        </div>
      </Modal>
    </motion.div>
  );
};

export default FeesPage;
