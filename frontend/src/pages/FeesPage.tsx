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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  feesService,
  type Payment,
  type StudentBalance,
} from "../api/services/feesService";
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

export const FeesPage = () => {
  const queryClient = useQueryClient();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
      toast.success("STK Protocol Initialized");
      setShowPaymentModal(false);
      setPhoneNumber("");
      setAmount("");
      setSelectedStudentId("");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["student_balances"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || "Gateway transmission failed",
      );
    },
  });

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return toast.error("Select target identity first.");
    initiatePaymentMutation.mutate({
      student_id: selectedStudentId,
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-24"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-none">
            Revenue <span className="text-gradient">Engine</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm md:text-base font-medium max-w-xl">
            Financial node synchronization and secure encrypted transaction
            protocols.
          </p>
        </div>
        <Button
          onClick={() => setShowPaymentModal(true)}
          className="gap-2 h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium w-full lg:w-auto"
        >
          <Zap className="w-5 h-5" /> Execute Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="premium-card p-8 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-[80px] -mr-16 -mt-16 group-hover:bg-primary-500/20 transition-all duration-700" />
          <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-4">
            Gross Collected Assets
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
            Operational Arrears
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
            Collection Index
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
              Transaction Journal
            </h2>
            <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">
              Real-time financial telemetry
            </p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/20" />
            <Input
              placeholder="Query reference or identity..."
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
                <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest pl-10">
                  Unit Identity
                </TableHead>
                <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest">
                  Protocol Ref
                </TableHead>
                <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest">
                  Quantum
                </TableHead>
                <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest">
                  Status
                </TableHead>
                <TableHead className="text-right text-muted text-[10px] font-black uppercase tracking-widest pr-10">
                  Timestamp
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {paymentsLoading ? (
                  <TableSkeleton rows={10} cols={5} />
                ) : paymentsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-40">
                      <div className="flex flex-col items-center opacity-20">
                        <CreditCard className="w-20 h-20 mb-6" />
                        <p className="text-lg font-black uppercase tracking-[0.3em]">
                          No Financial Signals
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
                      className="group transition-all h-24 border-white/5 hover:bg-white/[0.03]"
                    >
                      <TableCell className="pl-10">
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
                      <TableCell className="text-right text-[10px] font-black text-dim uppercase tracking-widest pr-10">
                        {payment.payment_date}
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
                Automated Gateway Ingestion Protocol
              </p>
            </div>
          </div>

          <form onSubmit={handlePayment} className="space-y-10">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] pl-1">
                  Target Operational Unit (Student Identity)
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full h-16 bg-white/5 border border-white/5 rounded-2xl px-6 text-primary text-base outline-none focus:border-primary-500 transition-all appearance-none font-black"
                >
                  <option value="" className="bg-bg-color">
                    Select Node Identity...
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
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] pl-1">
                    Transmission Line (M-Pesa)
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
                    Quantum Allocation (Amount)
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
                Execution will trigger an encrypted STK push to the specified
                terminal. Authorized PIN entry is required to finalize the
                financial synchronization.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 h-16 text-[10px]"
              >
                Abort Process
              </Button>
              <Button
                type="submit"
                disabled={initiatePaymentMutation.isPending}
                className="flex-[2] h-16 text-[10px]"
              >
                {initiatePaymentMutation.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                  "Authorize Transaction Protocol"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </motion.div>
  );
};

export default FeesPage;
