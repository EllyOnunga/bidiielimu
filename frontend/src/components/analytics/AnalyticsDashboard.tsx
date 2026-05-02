import { useState, useEffect } from 'react';
import { 
  AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie 
} from 'recharts';
import { TrendingUp, Users, Award, Percent, Calendar, Download } from 'lucide-react';
import axios from 'axios';

export const AnalyticsDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('/api/v1/analytics/dashboard/');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b'];

  if (loading) return <div className="p-10 text-white font-bold">Analyzing cohort data...</div>;

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">AI Insights</h1>
          <p className="text-primary-200/50 mt-2 font-medium italic">Predictive performance analytics & school-wide KPIs</p>
        </div>
        <button className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all">
          <Download className="w-5 h-5" />
          Export PDF Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Students', value: data.kpis.total_students, icon: Users, color: 'text-blue-400' },
          { label: 'Avg Attendance', value: `${data.kpis.avg_attendance}%`, icon: Calendar, color: 'text-emerald-400' },
          { label: 'Mean Exam Score', value: Math.round(data.kpis.mean_exam_score), icon: Award, color: 'text-rose-400' },
          { label: 'School Pass Rate', value: `${data.kpis.pass_rate}%`, icon: Percent, color: 'text-amber-400' },
        ].map((kpi, i) => (
          <div key={i} className="glass p-8 rounded-[32px] border border-white/5 hover:border-white/20 transition-all group">
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 ${kpi.color}`}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <p className="text-xs font-black text-primary-200/30 uppercase tracking-widest">{kpi.label}</p>
            <p className="text-3xl font-black text-white mt-2">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2 glass p-10 rounded-[48px] border border-white/5">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-white">Cohort Performance Trend</h3>
              <p className="text-primary-200/40 text-sm mt-1">Longitudinal analysis of grade level averages</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl text-sm">
              <TrendingUp className="w-4 h-4" />
              +5.4% growth
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="exam__name" 
                  stroke="#ffffff20" 
                  fontSize={12} 
                  fontWeight={900}
                  tickLine={false}
                  axisLine={false}
                  dy={20}
                />
                <YAxis 
                  stroke="#ffffff20" 
                  fontSize={12} 
                  fontWeight={900}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #ffffff10',
                    borderRadius: '16px',
                    padding: '12px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                  }}
                  itemStyle={{ color: '#fff', fontWeight: 900 }}
                  labelStyle={{ color: '#6366f1', marginBottom: '4px', fontWeight: 900 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="avg_score" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Pie */}
        <div className="glass p-10 rounded-[48px] border border-white/5">
          <h3 className="text-2xl font-black text-white mb-2">Grade Distribution</h3>
          <p className="text-primary-200/40 text-sm mb-10 italic">Across current academic year</p>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Grade A', value: 15 },
                    { name: 'Grade B', value: 35 },
                    { name: 'Grade C', value: 30 },
                    { name: 'Grade D', value: 20 },
                  ]}
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={2500}
                >
                  {['Grade A', 'Grade B', 'Grade C', 'Grade D'].map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-4 mt-10">
            {['Grade A', 'Grade B', 'Grade C', 'Grade D'].map((label, i) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="text-sm font-bold text-white/60">{label}</span>
                </div>
                <span className="text-sm font-black text-white">{[15, 35, 30, 20][i]}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
