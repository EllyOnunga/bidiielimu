import { useState } from 'react';
import { 
  Users, Search, Plus, 
  Mail, Phone, MoreHorizontal,
  ChevronRight
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
}

export const StaffDirectory = () => {
  const [staff] = useState<StaffMember[]>([
    { id: '1', name: 'Dr. Jane Smith', role: 'Principal', department: 'Administration', email: 'jane.smith@scholara.edu', phone: '+254 711 222 333', status: 'ACTIVE' },
    { id: '2', name: 'Mark Wilson', role: 'Head of Maths', department: 'Sciences', email: 'mark.wilson@scholara.edu', phone: '+254 711 444 555', status: 'ACTIVE' },
    { id: '3', name: 'Sarah Atieno', role: 'Bursar', department: 'Finance', email: 'sarah.atieno@scholara.edu', phone: '+254 711 666 777', status: 'ACTIVE' },
    { id: '4', name: 'James Omondi', role: 'Librarian', department: 'Humanities', email: 'james.omondi@scholara.edu', phone: '+254 711 888 999', status: 'ON_LEAVE' },
  ]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Staff Directory</h1>
          <p className="text-primary-200/40 font-bold uppercase tracking-widest mt-1">Human Capital Management</p>
        </div>
        
        <button className="px-8 py-4 bg-primary-500 text-white rounded-[24px] font-black text-lg flex items-center gap-3 hover:bg-primary-400 shadow-premium transition-all">
          <Plus className="w-6 h-6" />
          Onboard New Staff
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass p-4 rounded-[28px] border border-white/5 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-200/20" />
          <input 
            type="text" 
            placeholder="Search staff by name, role or department..."
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
          />
        </div>
        <div className="flex gap-2 p-2 bg-white/5 rounded-2xl border border-white/5">
          {['All', 'Teaching', 'Admin', 'Support'].map((tab) => (
            <button key={tab} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'All' ? 'bg-primary-500 text-white shadow-premium' : 'text-primary-200/40 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {staff.map((member) => (
          <div key={member.id} className="glass rounded-[40px] border border-white/5 overflow-hidden group hover:border-primary-500/30 transition-all">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-all">
                  <Users className="w-8 h-8" />
                </div>
                <button className="p-2 text-primary-200/20 hover:text-white transition-all">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              
              <div>
                <h3 className="text-xl font-black text-white">{member.name}</h3>
                <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-1">{member.role}</p>
                <p className="text-[10px] font-black text-primary-200/20 uppercase tracking-tighter mt-1">{member.department}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Mail className="w-3.5 h-3.5 text-primary-200/30" />
                  <p className="text-xs text-primary-200/60">{member.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-3.5 h-3.5 text-primary-200/30" />
                  <p className="text-xs text-primary-200/60">{member.phone}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  member.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {member.status.replace('_', ' ')}
                </span>
                <ChevronRight className="w-4 h-4 text-primary-200/20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
