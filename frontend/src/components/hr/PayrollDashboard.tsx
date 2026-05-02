import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Banknote, FileCheck, Receipt, 
  Clock, Download, ChevronRight,
  TrendingDown
} from 'lucide-react';

const mockSalaryData = [
  { month: 'Jan', amount: 2450000 },
  { month: 'Feb', amount: 2480000 },
  { month: 'Mar', amount: 2510000 },
  { month: 'Apr', amount: 2490000 },
  { month: 'May', amount: 2550000 },
];

export const PayrollDashboard = () => {
  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Payroll & HR</h1>
          <p className="text-primary-200/40 font-bold uppercase tracking-widest mt-1">Salary & Tax Management</p>
        </div>
        
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-white/10 transition-all">
            <Download className="w-5 h-5" />
            Export P9 Forms
          </button>
          <button className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-emerald-400 shadow-premium transition-all">
            <FileCheck className="w-5 h-5" />
            Run May Payroll
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-10 rounded-[48px] border border-white/10 bg-primary-500/5 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-primary-500/20 flex items-center justify-center text-primary-400">
            <Banknote className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-primary-400 uppercase tracking-widest mb-1">Total Monthly Net</p>
            <h2 className="text-4xl font-black text-white tracking-tighter">KES 2.55M</h2>
            <p className="text-xs font-bold text-primary-200/40 mt-2">64 employees onboarded</p>
          </div>
        </div>

        <div className="glass p-10 rounded-[48px] border border-white/10 bg-amber-500/5 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Receipt className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">Tax/PAYE Obligations</p>
            <h2 className="text-4xl font-black text-white tracking-tighter">KES 412,800</h2>
            <p className="text-xs font-bold text-amber-400 mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Due in 12 days
            </p>
          </div>
        </div>

        <div className="glass p-10 rounded-[48px] border border-white/10 bg-rose-500/5 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400">
            <TrendingDown className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1">Total Deductions</p>
            <h2 className="text-4xl font-black text-white tracking-tighter">KES 184,200</h2>
            <p className="text-xs font-bold text-primary-200/40 mt-2">SHIF, NSSF, and Loans</p>
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass rounded-[48px] border border-white/5 overflow-hidden p-10 space-y-10">
          <h3 className="text-2xl font-black text-white tracking-tight">Payroll Expenditure Trend</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockSalaryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={10} 
                  fontWeight={900}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={10} 
                  fontWeight={900}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#6366f1" 
                  radius={[12, 12, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-[48px] border border-white/5 p-10 space-y-10">
          <h3 className="text-2xl font-black text-white tracking-tight">Recent Leave Requests</h3>
          <div className="space-y-4">
            {[
              { name: 'Alice Wambui', type: 'Annual Leave', days: 5, date: 'May 12 - 17' },
              { name: 'John Doe', type: 'Sick Leave', days: 2, date: 'May 02 - 04' },
              { name: 'Mark Wilson', type: 'Paternity', days: 14, date: 'May 20 - Jun 03' },
            ].map((leave, i) => (
              <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-[28px] flex items-center justify-between group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-all">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{leave.name}</h4>
                    <p className="text-[10px] font-black text-primary-200/20 uppercase tracking-widest">{leave.type} • {leave.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-white">{leave.days} DAYS</span>
                  <ChevronRight className="w-5 h-5 text-primary-200/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
