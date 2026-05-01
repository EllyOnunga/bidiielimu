import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Users, Calendar, Award, FileDown } from 'lucide-react';
import client from '../api/client';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
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

  return (
    <div className="space-y-8 pb-20">
      <Breadcrumbs />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Advanced Analytics</h1>
          <p className="text-slate-400">Deep dive into school performance and trends.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold border border-slate-700 hover:bg-slate-700 transition-all shadow-lg"
        >
          <FileDown className="w-5 h-5" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject Performance */}
        <div className="glass-dark p-8 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary-500/10 rounded-xl">
              <Award className="w-6 h-6 text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Subject Performance</h2>
          </div>
          
          <div className="h-80 w-full">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-2xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.subject_performance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="subject" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Bar dataKey="average" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Class Distribution */}
        <div className="glass-dark p-8 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-purple-500/10 rounded-xl">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Class Distribution</h2>
          </div>

          <div className="h-80 w-full">
            {isLoading ? (
              <Skeleton className="w-64 h-64 rounded-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.class_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics?.class_distribution.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Attendance Trends */}
        <div className="lg:col-span-2 glass-dark p-8 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Calendar className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Attendance Trends (Last 30 Days)</h2>
          </div>

          <div className="h-80 w-full">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-2xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.attendance_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="absent" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
