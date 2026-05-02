import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Smartphone, Zap, TrendingUp, 
  RefreshCcw, AlertTriangle 
} from 'lucide-react';

const mockDailyData = [
  { day: 'Mon', amount: 120000 },
  { day: 'Tue', amount: 450000 },
  { day: 'Wed', amount: 890000 },
  { day: 'Thu', amount: 230000 },
  { day: 'Fri', amount: 670000 },
  { day: 'Sat', amount: 340000 },
  { day: 'Sun', amount: 150000 },
];

export const MPesaDashboard = () => {
  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-[#3BB34A] rounded-3xl flex items-center justify-center text-white shadow-lg">
            <Smartphone className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">M-Pesa Gateway</h1>
            <p className="text-primary-200/40 font-bold uppercase tracking-widest mt-1">Real-time Mobile Collections</p>
          </div>
        </div>
        
        <button className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-[24px] font-black text-lg flex items-center gap-3 hover:bg-white/10 shadow-premium transition-all">
          <RefreshCcw className="w-6 h-6" />
          Sync Transactions
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-10 rounded-[48px] border border-white/10 bg-[#3BB34A]/5 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-[#3BB34A]/20 flex items-center justify-center text-[#3BB34A]">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-[#3BB34A] uppercase tracking-widest mb-1">Today's Volume</p>
            <h2 className="text-4xl font-black text-white tracking-tighter">KES 642,500</h2>
            <p className="text-xs font-bold text-emerald-400 mt-2">+12% from yesterday</p>
          </div>
        </div>

        <div className="glass p-10 rounded-[48px] border border-white/10 bg-primary-500/5 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-primary-500/20 flex items-center justify-center text-primary-400">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-primary-400 uppercase tracking-widest mb-1">Active STK Pushes</p>
            <h2 className="text-4xl font-black text-white tracking-tighter">24 PENDING</h2>
            <p className="text-xs font-bold text-primary-200/40 mt-2">Avg response: 12 seconds</p>
          </div>
        </div>

        <div className="glass p-10 rounded-[48px] border border-white/10 bg-rose-500/5 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1">Failed Attempts</p>
            <h2 className="text-4xl font-black text-white tracking-tighter">3 FAILED</h2>
            <p className="text-xs font-bold text-rose-400 mt-2">Timeout or Insufficient Funds</p>
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="glass rounded-[48px] border border-white/5 overflow-hidden p-10 space-y-10">
        <h3 className="text-2xl font-black text-white tracking-tight">Collection Trends (Last 7 Days)</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockDailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="day" 
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
                itemStyle={{ color: '#fff' }}
              />
              <Bar 
                dataKey="amount" 
                fill="#3BB34A" 
                radius={[12, 12, 0, 0]} 
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
