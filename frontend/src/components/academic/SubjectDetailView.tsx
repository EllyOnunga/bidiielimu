import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { 
  TrendingUp, Users, Target, Award, 
  ArrowLeft, Calendar, Filter, Download
} from 'lucide-react';

const mockTrendData = [
  { term: 'Term 1 2023', avg: 68 },
  { term: 'Term 2 2023', avg: 72 },
  { term: 'Term 3 2023', avg: 75 },
  { term: 'Term 1 2024', avg: 71 },
  { term: 'Term 2 2024', avg: 82 },
];

const mockDistribution = [
  { grade: 'A', count: 12 },
  { grade: 'A-', count: 18 },
  { grade: 'B+', count: 25 },
  { grade: 'B', count: 22 },
  { grade: 'B-', count: 15 },
  { grade: 'C+', count: 8 },
];

export const SubjectDetailView = () => {
  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-6">
          <button className="p-4 bg-white/5 rounded-3xl border border-white/5 text-primary-200/40 hover:text-white transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter">Mathematics</h1>
            <p className="text-primary-200/40 font-bold uppercase tracking-widest mt-2 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Form 4 North • Primary Focus
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button className="px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-white/10 transition-all">
            <Filter className="w-5 h-5" />
            Filter Period
          </button>
          <button className="px-8 py-4 bg-primary-500 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-primary-400 shadow-premium transition-all">
            <Download className="w-5 h-5" />
            Full Analysis PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Subject Mean', value: '82.4%', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Top Score', value: '98/100', icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Total Students', value: '42', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Target Mean', value: '85.0%', icon: Target, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        ].map((kpi, i) => (
          <div key={i} className="glass p-8 rounded-[40px] border border-white/5 space-y-6">
            <div className={`w-14 h-14 rounded-2xl ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
              <kpi.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className="text-4xl font-black text-white tracking-tighter">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Trend */}
        <div className="lg:col-span-2 glass rounded-[48px] border border-white/5 overflow-hidden p-10 space-y-10">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-white tracking-tight">Performance Trend</h3>
            <div className="flex items-center gap-4 text-[10px] font-black text-primary-200/40 uppercase tracking-widest">
              <Calendar className="w-4 h-4" />
              Last 5 Terms
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="term" 
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
                <Area 
                  type="monotone" 
                  dataKey="avg" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#trendGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="glass rounded-[48px] border border-white/5 overflow-hidden p-10 space-y-10">
          <h3 className="text-2xl font-black text-white tracking-tight">Grade Spread</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockDistribution} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="grade" 
                  type="category" 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={12} 
                  fontWeight={900}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar 
                  dataKey="count" 
                  fill="#10b981" 
                  radius={[0, 10, 10, 0]} 
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insight Section */}
      <div className="bg-primary-500/5 border border-primary-500/10 p-10 rounded-[48px] flex flex-col md:flex-row items-center gap-10">
        <div className="w-24 h-24 bg-primary-500 rounded-3xl flex items-center justify-center text-white shrink-0 shadow-premium">
          <TrendingUp className="w-12 h-12" />
        </div>
        <div>
          <h4 className="text-2xl font-black text-white mb-2">Academic Insight</h4>
          <p className="text-primary-200/60 leading-relaxed text-lg italic">
            "Mathematics performance has increased by 11% since the last intervention. 
            The current grade distribution suggests a strong B+ cluster. Focus on moving the 
            top 18 students into the A category for the upcoming National Exams."
          </p>
        </div>
      </div>
    </div>
  );
};
