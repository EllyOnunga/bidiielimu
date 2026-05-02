import { useState } from 'react';
import { 
  Search, Filter, Download, 
  ArrowUpRight, ArrowDownLeft, 
  Clock, MoreHorizontal, CheckCircle
} from 'lucide-react';

interface Transaction {
  id: string;
  student: string;
  type: 'PAYMENT' | 'REFUND' | 'WAIVER';
  method: 'M-PESA' | 'BANK' | 'CASH';
  amount: number;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export const TransactionHistory = () => {
  const [transactions] = useState<Transaction[]>([
    { id: 'TX1001', student: 'John Kamau', type: 'PAYMENT', method: 'M-PESA', amount: 45000, date: '2024-05-01 10:30', status: 'COMPLETED' },
    { id: 'TX1002', student: 'Mary Atieno', type: 'PAYMENT', method: 'BANK', amount: 12000, date: '2024-05-01 11:15', status: 'COMPLETED' },
    { id: 'TX1003', student: 'David Omondi', type: 'PAYMENT', method: 'CASH', amount: 5000, date: '2024-05-01 12:45', status: 'COMPLETED' },
    { id: 'TX1004', student: 'Sarah Wambui', type: 'WAIVER', method: 'BANK', amount: 2500, date: '2024-04-30 09:00', status: 'COMPLETED' },
  ]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Finance Ledger</h1>
          <p className="text-primary-200/40 font-bold uppercase tracking-widest mt-1">Real-time Transaction History</p>
        </div>
        
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-white/10 transition-all">
            <Filter className="w-5 h-5" />
            Advanced Filter
          </button>
          <button className="px-8 py-3 bg-primary-500 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-primary-400 shadow-premium transition-all">
            <Download className="w-5 h-5" />
            Export Ledger
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass p-4 rounded-[28px] border border-white/5 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-200/20" />
          <input 
            type="text" 
            placeholder="Search by student, transaction ID or reference..."
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
          />
        </div>
        <div className="flex gap-2 p-2 bg-white/5 rounded-2xl border border-white/5">
          {['All', 'Payments', 'Refunds', 'Waivers'].map((filter) => (
            <button key={filter} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'All' ? 'bg-primary-500 text-white shadow-premium' : 'text-primary-200/40 hover:text-white'}`}>
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass rounded-[40px] border border-white/5 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="px-8 py-6 text-left text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Transaction ID</th>
              <th className="px-8 py-6 text-left text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Student</th>
              <th className="px-8 py-6 text-left text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Method</th>
              <th className="px-8 py-6 text-right text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Amount</th>
              <th className="px-8 py-6 text-center text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Date & Time</th>
              <th className="px-8 py-6 text-center text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Status</th>
              <th className="px-8 py-6 text-center text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-all group">
                <td className="px-8 py-6">
                  <span className="text-primary-200/30 font-black text-xs uppercase">{tx.id}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary-400 font-black text-[10px]">
                      {tx.student.charAt(0)}
                    </div>
                    <span className="text-white font-bold">{tx.student}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black text-primary-200/60 uppercase tracking-widest">
                    {tx.method}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {tx.type === 'PAYMENT' ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> : <ArrowUpRight className="w-4 h-4 text-rose-400" />}
                    <span className={`text-lg font-black tracking-tighter ${tx.type === 'PAYMENT' ? 'text-white' : 'text-rose-400'}`}>
                      KES {tx.amount.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-primary-200/30 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    {tx.date}
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle className="w-4 h-4" />
                    {tx.status}
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <button className="p-2 text-primary-200/20 hover:text-white transition-all">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
