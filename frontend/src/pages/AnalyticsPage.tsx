import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { Users, Calendar, Award, FileDown } from 'lucide-react';
import client from '../api/client';
import { Skeleton } from '../components/ui/Skeleton';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export const AnalyticsPage = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics_detailed'],
    queryFn: async () => {
      const res = await client.get('schools/analytics_detailed/');
      return res.data;
    },
  });

  const handleExport = () => {
    window.print();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 pb-24"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">Institutional <span className="text-gradient">Intelligence</span></h1>
          <p className="text-primary-200/50 text-base font-medium">Deep-spectrum analysis of academic performance and operational efficiency.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center justify-center gap-3 h-14 px-8 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest text-xs border border-white/5 hover:bg-white/10 transition-all shadow-premium"
        >
          <FileDown className="w-5 h-5 text-primary-400" />
          Export Intelligence Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject Performance */}
        <motion.div variants={itemVariants} className="glass p-10 rounded-[40px] border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-600/20 rounded-2xl flex items-center justify-center border border-primary-500/20">
                <Award className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Academic Domain Mastery</h2>
                <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Aggregate performance across core subjects</p>
              </div>
            </div>
          </div>
          
          <div className="h-80 w-full">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-[32px]" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.subject_performance}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="subject" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 900 }} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} tick={{ fill: '#64748b', fontWeight: 900 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '24px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px' }}
                    itemStyle={{ color: '#3b82f6', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                  />
                  <Bar dataKey="average" fill="url(#barGradient)" radius={[12, 12, 4, 4]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Class Distribution */}
        <motion.div variants={itemVariants} className="glass p-10 rounded-[40px] border-white/5 relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center border border-purple-500/20">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Operational Density</h2>
              <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Student allocation across academic phases</p>
            </div>
          </div>

          <div className="h-80 w-full relative">
            {isLoading ? (
              <Skeleton className="w-72 h-72 rounded-full mx-auto" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.class_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {analytics?.class_distribution.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '24px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-2">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Attendance Trends */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass p-10 rounded-[40px] border-white/5 relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-emerald-600/20 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <Calendar className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Engagement Trajectory</h2>
              <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">30-day operational attendance tracking</p>
            </div>
          </div>

          <div className="h-80 w-full">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-[32px]" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.attendance_trend}>
                  <defs>
                    <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 900 }} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 900 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '24px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px' }}
                  />
                  <Legend iconType="circle" formatter={(value) => <span className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-2">{value}</span>} />
                  <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#presentGradient)" dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="absent" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#absentGradient)" dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
