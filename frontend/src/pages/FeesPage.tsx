import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, CheckCircle2, AlertCircle, Phone, CreditCard, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { feesService, type Payment, type StudentBalance } from '../api/services/feesService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useEffect } from 'react';

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
    <div className="space-y-6 md:space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Fee Management</h1>
          <p className="text-slate-400 text-sm md:text-base">Track collections and manage payment structures.</p>
        </div>
        <Button onClick={() => setShowPaymentModal(true)} className="gap-2 w-full sm:w-auto">
          <Plus className="w-5 h-5" /> Record New Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="glass-dark p-6 rounded-3xl border border-white/5">
          <p className="text-sm text-slate-400 mb-2">Total Collected</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl md:text-3xl font-bold text-white">KSh {(totalCollected / 1000).toFixed(1)}k</h3>
          </div>
        </div>
        <div className="glass-dark p-6 rounded-3xl border border-white/5">
          <p className="text-sm text-slate-400 mb-2">Outstanding Balance</p>
          <h3 className="text-2xl md:text-3xl font-bold text-rose-400">KSh {(totalOutstanding / 1000).toFixed(1)}k</h3>
        </div>
        <div className="glass-dark p-6 rounded-3xl border border-white/5 sm:col-span-2 lg:col-span-1">
          <p className="text-sm text-slate-400 mb-2">Completion Rate</p>
          <h3 className="text-2xl md:text-3xl font-bold text-primary-400">{completionRate}%</h3>
        </div>
      </div>

      <div className="glass-dark rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg md:text-xl font-bold text-white">Recent Transactions</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search transactions..."
              className="pl-9 bg-slate-800/50 border-slate-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="p-0">
          <Table className="min-w-[700px]">
            <TableHeader className="bg-white/5">
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead className="text-slate-400">Student</TableHead>
                <TableHead className="text-slate-400">Reference</TableHead>
                <TableHead className="text-slate-400">Amount</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-white/5 border-t border-white/5">
              {paymentsLoading ? (
                <TableSkeleton rows={8} cols={5} />
              ) : paymentsData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-12">No transactions found.</TableCell>
                </TableRow>
              ) : (
                paymentsData.map((payment: Payment) => (
                  <TableRow key={payment.id} className="hover:bg-white/5 border-white/5">
                    <TableCell>
                      <div className="text-sm font-bold text-white">{payment.student_name}</div>
                      <div className="text-[10px] md:text-xs text-slate-500">{payment.student_admission}</div>
                    </TableCell>
                    <TableCell className="font-mono text-[10px] md:text-xs text-slate-400">{payment.transaction_reference}</TableCell>
                    <TableCell className="font-bold text-sm md:text-base text-white">KSh {Number(payment.amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`flex items-center gap-1.5 text-[10px] md:text-xs font-bold ${payment.status === 'COMPLETED' ? 'text-emerald-400' : payment.status === 'FAILED' ? 'text-rose-400' : 'text-amber-400'}`}>
                        {payment.status === 'COMPLETED' && <CheckCircle2 className="w-4 h-4" />}
                        {payment.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-[10px] md:text-xs text-slate-500">{payment.payment_date}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        className="max-w-md p-0 bg-transparent border-0 shadow-none overflow-hidden"
      >
        <div className="glass-dark rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-6 md:p-8 bg-primary-600">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2.5 md:p-3 bg-white/20 rounded-2xl">
                <CreditCard className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white">Record Payment</h3>
                <p className="text-primary-100 text-xs md:text-sm">Automated M-Pesa STK Push</p>
              </div>
            </div>
          </div>

          <form onSubmit={handlePayment} className="p-6 md:p-8 space-y-4 md:space-y-6 bg-slate-900">
            <div>
              <label className="block text-xs md:text-sm font-medium text-slate-400 mb-2">Select Student</label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-all"
              >
                <option value="">Select a student...</option>
                {balances.map((b: StudentBalance) => (
                  <option key={b.student_id} value={b.student_id}>
                    {b.name} ({b.admission_number}) - Bal: KSh {Number(b.balance).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-slate-400 mb-2">Phone Number (M-Pesa)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-500" />
                <Input 
                  required
                  placeholder="0712 345 678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-12 bg-slate-800 border-slate-700 h-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-slate-400 mb-2">Amount (KSh)</label>
              <Input 
                required
                type="number"
                placeholder="Enter amount..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-slate-800 border-slate-700 font-bold text-lg md:text-xl h-12"
              />
            </div>

            <div className="p-3 md:p-4 bg-primary-500/10 border border-primary-500/20 rounded-2xl flex gap-3">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-primary-400 shrink-0" />
              <p className="text-[10px] md:text-xs text-primary-300">
                Clicking pay will send a request to the parent's phone. They will need to enter their M-Pesa PIN.
              </p>
            </div>

            <div className="flex gap-3 md:gap-4">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 h-12 bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={initiatePaymentMutation.isPending}
                className="flex-1 h-12"
              >
                {initiatePaymentMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay Now'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
