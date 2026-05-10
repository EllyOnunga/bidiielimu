import { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, 
  Mail, Phone, MoreHorizontal,
  ChevronRight, X, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { Modal } from '../ui/Modal';

interface StaffMember {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  role: string;
  designation?: string;
  specialization?: string;
  email: string;
  phone_number: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
  is_active: boolean;
  employee_id: string;
}

export const StaffDirectory = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone_number: '',
    employee_id: '',
    designation: '',
    specialization: '',
    joining_date: new Date().toISOString().split('T')[0],
    contract_type: 'PERMANENT',
    role: 'TEACHER'
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStaff = async (query = '') => {
    try {
      setLoading(true);
      const res = await client.get('teachers/', { params: { search: query } });
      setStaff(res.data.results || res.data);
    } catch (error) {
      console.error('Failed to fetch staff', error);
      toast.error('Failed to load staff directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff(debouncedSearch);
  }, [debouncedSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await client.post('teachers/', formData);
      toast.success('Staff onboarded successfully!');
      setIsModalOpen(false);
      fetchStaff(debouncedSearch);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone_number: '',
        employee_id: '',
        designation: '',
        specialization: '',
        joining_date: new Date().toISOString().split('T')[0],
        contract_type: 'PERMANENT',
        role: 'TEACHER'
      });
    } catch (error: any) {
      const detail = error.response?.data?.detail || 'Failed to onboard staff';
      toast.error(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStaff = staff.filter(member => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Teaching') return member.designation?.toLowerCase().includes('teacher') || member.specialization;
    if (activeTab === 'Admin') return member.designation?.toLowerCase().includes('admin') || member.designation?.toLowerCase().includes('principal');
    return true;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Staff Directory</h1>
          <p className="text-primary-200/40 font-bold uppercase tracking-widest mt-1">Human Capital Management</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-primary-500 text-white rounded-[24px] font-black text-lg flex items-center gap-3 hover:bg-primary-400 shadow-premium transition-all active:scale-95"
        >
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
            placeholder="Search staff by name, role or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
          />
        </div>
        <div className="flex gap-2 p-2 bg-white/5 rounded-2xl border border-white/5">
          {['All', 'Teaching', 'Admin', 'Support'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === activeTab ? 'bg-primary-500 text-white shadow-premium' : 'text-primary-200/40 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
          <p className="text-primary-200/40 font-bold uppercase tracking-widest">Accessing Secure Records...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredStaff.map((member) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={member.id} 
              className="glass rounded-[40px] border border-white/5 overflow-hidden group hover:border-primary-500/30 transition-all"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-all shadow-inner">
                    <Users className="w-8 h-8" />
                  </div>
                  <button className="p-2 text-primary-200/20 hover:text-white transition-all">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-white">{member.first_name} {member.last_name}</h3>
                  <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-1">{member.designation || member.specialization || 'Staff'}</p>
                  <p className="text-[10px] font-black text-primary-200/20 uppercase tracking-tighter mt-1">ID: {member.employee_id}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Mail className="w-3.5 h-3.5 text-primary-200/30" />
                    <p className="text-xs text-primary-200/60 truncate">{member.email || 'No email'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-3.5 h-3.5 text-primary-200/30" />
                    <p className="text-xs text-primary-200/60">{member.phone_number}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    member.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {member.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-primary-200/20 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
          {filteredStaff.length === 0 && (
            <div className="col-span-full text-center py-20">
              <p className="text-primary-200/20 font-black text-2xl">NO STAFF MEMBERS FOUND</p>
            </div>
          )}
        </div>
      )}

      {/* Onboard Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        className="max-w-2xl bg-[#0f172a] border-white/10 p-0 overflow-hidden"
      >
        <div className="p-8 bg-gradient-to-br from-primary-500/10 to-transparent">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter">Onboard Staff</h2>
              <p className="text-primary-400 text-xs font-bold uppercase tracking-widest">Access Provisioning</p>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/5 rounded-xl text-primary-200/40 hover:text-white transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">First Name</label>
              <input 
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">Last Name</label>
              <input 
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">Work Email</label>
              <input 
                required
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">Temporary Password</label>
              <input 
                required
                type="password"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">Employee ID</label>
              <input 
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                value={formData.employee_id}
                onChange={e => setFormData({...formData, employee_id: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">Phone Number</label>
              <input 
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                value={formData.phone_number}
                onChange={e => setFormData({...formData, phone_number: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">System Role</label>
              <select
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all appearance-none"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="TEACHER" className="bg-[#0f172a]">Teacher</option>
                <option value="ADMIN" className="bg-[#0f172a]">Administrator</option>
                <option value="PRINCIPAL" className="bg-[#0f172a]">Principal</option>
                <option value="HOD" className="bg-[#0f172a]">Head of Department</option>
                <option value="LIBRARIAN" className="bg-[#0f172a]">Librarian</option>
                <option value="FINANCE" className="bg-[#0f172a]">Finance / Bursar</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">Designation</label>
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                placeholder="e.g. Senior Teacher"
                value={formData.designation}
                onChange={e => setFormData({...formData, designation: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">Joining Date</label>
              <input 
                type="date"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                value={formData.joining_date}
                onChange={e => setFormData({...formData, joining_date: e.target.value})}
              />
            </div>

            <div className="col-span-full pt-4">
              <button 
                disabled={isSubmitting}
                className="w-full py-5 bg-primary-500 hover:bg-primary-400 text-white rounded-[24px] font-black text-xl shadow-premium transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
                {isSubmitting ? 'PROVISIONING...' : 'FINALIZE ONBOARDING'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

