import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, CheckCircle2, AlertCircle, Phone, CreditCard, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { feesService, type Payment, type StudentBalance } from '../api/services/feesService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { TableSkeleton } from '../components/ui/Skeleton';

export const FeesPage = () => {
  const queryClient = useQueryClient();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: paymentsData = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', debouncedSearch],
    queryFn: () => feesService.getPayments(debouncedSearch),
    select: (data) => {
      const raw = Array.isArray(data) ? data : (data.results || []);
      return raw.map((p: any) => ({
        id: p.id,
        student_name: p.student_name || 'Student Name',
        student_admission: p.student_admission || 'ADM',
        transaction_reference: p.transaction_reference,
        amount: p.amount,
        status: p.status,
        payment_date: new Date(p.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      }));
    }
  });

  const { data: balances = [] } = useQuery({
    queryKey: ['student_balances'],
    queryFn: feesService.getBalances,
    select: (data) => Array.isArray(data) ? data : (data.results || []),
  });

  const initiatePaymentMutation = useMutation({
    mutationFn: (data: { student_id: string; amount: string; phone: string }) => feesService.initiateMpesa(data),
    onSuccess: () => {
      toast.success('STK Push sent & payment simulated successfully.');
      setShowPaymentModal(false);
      setPhoneNumber('');
      setAmount('');
      setSelectedStudentId('');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['student_balances'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to initiate M-Pesa payment.');
    }
  });

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      return toast.error("Please select a student.");
    }
    initiatePaymentMutation.mutate({
      student_id: selectedStudentId,
      amount: amount,
      phone: phoneNumber
    });
  };

  const totalExpected = balances.reduce((sum: number, b: StudentBalance) => sum + parseFloat(b.expected_fees), 0);
  const totalCollected = balances.reduce((sum: number, b: StudentBalance) => sum + parseFloat(b.total_paid), 0);
  const totalOutstanding = balances.reduce((sum: number, b: StudentBalance) => sum + parseFloat(b.balance), 0);
  const completionRate = totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : '0.0';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-24"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">Revenue <span className="text-gradient">Engine</span></h1>
          <p className="text-primary-200/50 text-base font-medium">Monitor financial health and manage secure transaction protocols.</p>
        </div>
        <Button onClick={() => setShowPaymentModal(true)} className="gap-2 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium w-full sm:w-auto">
          <Plus className="w-5 h-5" /> Execute New Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass p-8 rounded-[40px] border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-[80px] -mr-16 -mt-16 group-hover:bg-primary-500/20 transition-all" />
          <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em] mb-4">Gross Collected</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-black text-white tracking-tight">KSh {(totalCollected / 1000).toFixed(1)}k</h3>
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/10">
              <CreditCard className="w-5 h-5 text-primary-400" />
            </div>
          </div>
        </div>
        <div className="glass p-8 rounded-[40px] border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[80px] -mr-16 -mt-16 group-hover:bg-rose-500/20 transition-all" />
          <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em] mb-4">Outstanding Assets</p>
          <h3 className="text-4xl font-black text-rose-400 tracking-tight">KSh {(totalOutstanding / 1000).toFixed(1)}k</h3>
        </div>
        <div className="glass p-8 rounded-[40px] border-white/5 relative overflow-hidden group sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[80px] -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all" />
          <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em] mb-4">Collection Index</p>
          <div className="flex items-center gap-4">
            <h3 className="text-4xl font-black text-primary-400 tracking-tight">{completionRate}%</h3>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                className="h-full bg-primary-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-[40px] border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <h2 className="text-xl font-black text-white uppercase tracking-widest">Transaction Journal</h2>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/30" />
            <Input 
              placeholder="Query reference or ID..."
              className="pl-11 h-12 bg-white/5 border-white/5 rounded-2xl focus:bg-white/10 transition-all font-medium text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-white/5">
              <TableRow className="border-0 hover:bg-transparent h-16">
                <TableHead className="text-primary-200/40 text-[10px] font-black uppercase tracking-widest pl-8">Operational Unit</TableHead>
                <TableHead className="text-primary-200/40 text-[10px] font-black uppercase tracking-widest">Protocol Reference</TableHead>
                <TableHead className="text-primary-200/40 text-[10px] font-black uppercase tracking-widest">Quantum (Amount)</TableHead>
                <TableHead className="text-primary-200/40 text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-primary-200/40 text-[10px] font-black uppercase tracking-widest pr-8">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-white/5">
              {paymentsLoading ? (
                <TableSkeleton rows={10} cols={5} />
              ) : paymentsData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-32 opacity-20">
                    <CreditCard className="w-20 h-20 mx-auto mb-4" />
                    <p className="text-lg font-black uppercase tracking-widest">No Financial Activity</p>
                  </TableCell>
                </TableRow>
              ) : (
                paymentsData.map((payment: Payment, idx: number) => (
                  <motion.tr 
                    key={payment.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group transition-all h-20 border-white/5 hover:bg-white/5"
                  >
                    <TableCell className="pl-8">
                      <div className="text-sm font-black text-white uppercase tracking-tight">{payment.student_name}</div>
                      <div className="text-[10px] font-black text-primary-200/30 uppercase tracking-tighter">{payment.student_admission}</div>
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-primary-200/50 uppercase tracking-widest">{payment.transaction_reference}</TableCell>
                    <TableCell className="font-black text-base text-white tracking-tight">KSh {Number(payment.amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        payment.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        payment.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {payment.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                        {payment.status === 'PENDING' && <Loader2 className="w-3 h-3 animate-spin" />}
                        {payment.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pr-8">{payment.payment_date}</TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        className="max-w-xl glass border-white/10"
      >
        <div className="space-y-8 mt-6 pb-4">
          <div className="flex items-center gap-6 p-6 bg-primary-600 rounded-[32px] shadow-premium">
            <div className="w-16 h-16 bg-white/20 rounded-[20px] flex items-center justify-center border border-white/30">
              <CreditCard className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Record Payment</h3>
              <p className="text-primary-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Automated M-Pesa STK Push Protocol</p>
            </div>
          </div>

          <form onSubmit={handlePayment} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Target Operational Unit (Student)</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-4 text-white text-sm outline-none focus:border-primary-500 transition-all appearance-none font-medium"
                >
                  <option value="" className="bg-slate-900">Select Identity...</option>
                  {balances.map((b: StudentBalance) => (
                    <option key={b.student_id} value={b.student_id} className="bg-slate-900">
                      {b.name} ({b.admission_number}) • Bal: KSh {Number(b.balance).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">M-Pesa Gateway Line</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/30" />
                    <Input 
                      required
                      placeholder="07XX XXX XXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-12 bg-white/5 border-white/5 rounded-2xl h-14 font-black"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Quantum (Amount)</label>
                  <Input 
                    required
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-white/5 border-white/5 rounded-2xl h-14 font-black text-xl text-primary-400"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-primary-500/5 border border-primary-500/10 rounded-[28px] flex gap-4">
              <AlertCircle className="w-5 h-5 text-primary-400 shrink-0" />
              <p className="text-[10px] font-black text-primary-300 uppercase tracking-widest leading-relaxed">
                Execution will trigger an encrypted STK push to the specified terminal. User authorization (PIN) is required to finalize the transaction.
              </p>
            </div>

            <div className="flex gap-4">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 h-14 bg-white/5 border-white/5 text-primary-200/50 rounded-2xl font-black uppercase tracking-widest text-xs"
              >
                Abort
              </Button>
              <Button 
                type="submit"
                disabled={initiatePaymentMutation.isPending}
                className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium"
              >
                {initiatePaymentMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Confirm & Execute'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </motion.div>
  );
};
