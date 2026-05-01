import { BarChart, Users, DollarSign, Calendar, Activity, BookOpen, Clock } from 'lucide-react';

export const DashboardMockup = () => {
  return (
    <div className="w-full aspect-[16/10] bg-slate-900 rounded-[36px] p-6 shadow-premium flex flex-col gap-6 relative overflow-hidden border border-white/10">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-wider">BidiiElimu HQ</h4>
            <p className="text-primary-200/50 text-[10px] font-bold uppercase tracking-widest">Live Overview</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700" />
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700" />
          <div className="w-8 h-8 rounded-full bg-primary-600 border border-primary-500" />
        </div>
      </div>

      {/* Grid Layout */}
      <div className="flex-1 grid grid-cols-4 gap-4 z-10">
        {/* Sidebar */}
        <div className="col-span-1 flex flex-col gap-3">
          {[
            { icon: Users, label: 'Students', active: true },
            { icon: BookOpen, label: 'Curriculum', active: false },
            { icon: Calendar, label: 'Timetable', active: false },
            { icon: DollarSign, label: 'Finances', active: false },
            { icon: Clock, label: 'Attendance', active: false },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${item.active ? 'bg-primary-600/20 border border-primary-500/30 text-white' : 'hover:bg-white/5 text-slate-400'}`}>
              <item.icon className={`w-4 h-4 ${item.active ? 'text-primary-400' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* Top Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Students', value: '1,248', trend: '+12%' },
              { label: 'Revenue (KES)', value: '4.2M', trend: '+5%' },
              { label: 'Avg Attendance', value: '96.4%', trend: '+1%' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl backdrop-blur-sm">
                <p className="text-primary-200/50 text-[9px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                <div className="flex items-end justify-between">
                  <p className="text-white font-black text-xl">{stat.value}</p>
                  <p className="text-emerald-400 text-[10px] font-bold">{stat.trend}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Main Chart Area */}
          <div className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <p className="text-white text-xs font-black uppercase tracking-widest">Performance Matrix</p>
              <BarChart className="w-4 h-4 text-slate-400" />
            </div>
            {/* Mock Chart Bars */}
            <div className="flex-1 flex items-end justify-between gap-2 pt-4">
              {[40, 70, 45, 90, 65, 80, 50, 100, 75, 85].map((height, i) => (
                <div key={i} className="w-full bg-slate-700 rounded-t-sm relative group">
                  <div 
                    className="absolute bottom-0 left-0 w-full bg-primary-500 rounded-t-sm transition-all duration-1000" 
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
