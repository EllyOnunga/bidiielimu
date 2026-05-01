import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  User, School, Bell, Save,
  CreditCard, Palette, GraduationCap, Mail, MessageSquare, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import client from '../api/client';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

type ActiveTab = 'profile' | 'school' | 'academic' | 'finance' | 'branding' | 'notifications';

export const SettingsPage = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    current_term: 'Term 1',
    academic_year: '2026',
    currency: 'KES',
    tax_percentage: '0.00',
    enable_email_notifications: true,
    enable_sms_notifications: false,
    accent_color: '#6366f1',
  });

  const [schoolProfile, setSchoolProfile] = useState({
    name: '',
    address: '',
    contact_email: '',
    contact_phone: '',
  });

  const fetchSettings = useCallback(async () => {
    try {
      const response = await client.get('schools/settings/');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings', error);
    }
  }, []);

  const fetchSchoolProfile = useCallback(async () => {
    if (!user?.school) return;
    try {
      const response = await client.get(`/schools/${user.school}/`);
      setSchoolProfile({
        name: response.data.name,
        address: response.data.address || '',
        contact_email: response.data.contact_email || '',
        contact_phone: response.data.contact_phone || '',
      });
    } catch (error) {
      console.error('Failed to fetch school profile', error);
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings();
    if (user?.role === 'ADMIN') {

      fetchSchoolProfile();
    }
  }, [user?.role, fetchSettings, fetchSchoolProfile]);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.patch('schools/settings/', settings);
      toast.success('Settings updated successfully');
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.patch(`/schools/${user?.school}/`, schoolProfile);
      toast.success('School profile updated successfully');
    } catch {
      toast.error('Failed to update school profile');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', icon: User, label: 'My Profile' },
    { id: 'school', icon: School, label: 'School Profile', adminOnly: true },
    { id: 'academic', icon: GraduationCap, label: 'Academic', adminOnly: true },
    { id: 'finance', icon: CreditCard, label: 'Financial', adminOnly: true },
    { id: 'branding', icon: Palette, label: 'Branding', adminOnly: true },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-24 max-w-7xl mx-auto"
    >
      <div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">Platform <span className="text-gradient">Control</span></h1>
        <p className="text-primary-200/50 text-base font-medium">Fine-tune your institutional ecosystem and personal preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Tabs */}
        <div className="lg:w-72 space-y-3">
          {tabs.map((tab) => {
            if (tab.adminOnly && user?.role !== 'ADMIN') return null;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-[24px] transition-all relative overflow-hidden group ${isActive
                  ? 'glass text-white shadow-premium'
                  : 'text-primary-200/40 hover:bg-white/5 hover:text-white'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary-600/10 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'text-primary-400 scale-110' : 'group-hover:scale-110'}`} />
                <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>{tab.label}</span>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="glass p-10 md:p-12 rounded-[40px] border-white/5 shadow-premium min-h-[500px]"
            >
              {activeTab === 'profile' && (
                <div className="space-y-10">
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Identity Configuration</h2>
                    <p className="text-primary-200/30 text-[10px] font-black uppercase tracking-[0.2em]">Manage your personal credentials within the network.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Operational Handle</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/20" />
                        <Input
                          type="text"
                          value={`${user?.first_name || ''} ${user?.last_name || ''}`}
                          readOnly
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-12 py-4 text-white text-sm font-black uppercase tracking-tight opacity-50 cursor-not-allowed h-auto"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Primary Transmission Line</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/20" />
                        <Input
                          type="email"
                          value={user?.email || ''}
                          readOnly
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-12 py-4 text-white text-sm font-black tracking-tight opacity-50 cursor-not-allowed h-auto"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'school' && (
                <form onSubmit={handleUpdateProfile} className="space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Institutional Profile</h2>
                      <p className="text-primary-200/30 text-[10px] font-black uppercase tracking-[0.2em]">Define your school's global identity parameters.</p>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="gap-2 h-14 px-8 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium disabled:opacity-50 transition-all shrink-0"
                    >
                      <Save className="w-4 h-4" />
                      Commit Changes
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Institutional Name</label>
                      <Input
                        type="text"
                        value={schoolProfile.name}
                        onChange={(e) => setSchoolProfile({ ...schoolProfile, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-black uppercase tracking-tight focus:bg-white/10 focus:border-primary-500/50 outline-none transition-all h-auto"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Global Contact Point</label>
                      <Input
                        type="email"
                        value={schoolProfile.contact_email}
                        onChange={(e) => setSchoolProfile({ ...schoolProfile, contact_email: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-black tracking-tight focus:bg-white/10 focus:border-primary-500/50 outline-none transition-all h-auto"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Physical Coordinates (Address)</label>
                      <textarea
                        value={schoolProfile.address}
                        onChange={(e) => setSchoolProfile({ ...schoolProfile, address: e.target.value })}
                        rows={3}
                        className="w-full bg-white/5 border border-white/5 rounded-[28px] px-6 py-5 text-white text-sm font-medium focus:bg-white/10 focus:border-primary-500/50 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>
                </form>
              )}

              {activeTab === 'academic' && (
                <form onSubmit={handleUpdateSettings} className="space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Phase Synchronization</h2>
                      <p className="text-primary-200/30 text-[10px] font-black uppercase tracking-[0.2em]">Synchronize institutional clocks and academic cycles.</p>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="gap-2 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium"
                    >
                      <Save className="w-4 h-4" />
                      Apply Cycle
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Current Chronos (Year)</label>
                      <div className="relative">
                        <select
                          value={settings.academic_year}
                          onChange={(e) => setSettings({ ...settings, academic_year: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-black uppercase tracking-tight focus:bg-white/10 focus:border-primary-500/50 outline-none transition-all appearance-none"
                        >
                          <option value="2025" className="bg-slate-900">2025 Cycle</option>
                          <option value="2026" className="bg-slate-900">2026 Cycle</option>
                          <option value="2027" className="bg-slate-900">2027 Cycle</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/30 rotate-90" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Active Sector (Term)</label>
                      <div className="relative">
                        <select
                          value={settings.current_term}
                          onChange={(e) => setSettings({ ...settings, current_term: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-black uppercase tracking-tight focus:bg-white/10 focus:border-primary-500/50 outline-none transition-all appearance-none"
                        >
                          <option value="Term 1" className="bg-slate-900">Sector Alpha (Term 1)</option>
                          <option value="Term 2" className="bg-slate-900">Sector Beta (Term 2)</option>
                          <option value="Term 3" className="bg-slate-900">Sector Gamma (Term 3)</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/30 rotate-90" />
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {activeTab === 'finance' && (
                <form onSubmit={handleUpdateSettings} className="space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Financial Engine</h2>
                      <p className="text-primary-200/30 text-[10px] font-black uppercase tracking-[0.2em]">Configure revenue protocols and taxation matrices.</p>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="gap-2 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium"
                    >
                      <Save className="w-4 h-4" />
                      Update Engine
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Base Currency Protocol</label>
                      <Input
                        type="text"
                        value={settings.currency}
                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-black uppercase tracking-tight focus:bg-white/10 focus:border-primary-500/50 outline-none transition-all h-auto"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Taxation Index (%)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.tax_percentage}
                        onChange={(e) => setSettings({ ...settings, tax_percentage: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-black focus:bg-white/10 focus:border-primary-500/50 outline-none transition-all h-auto"
                      />
                    </div>
                  </div>
                </form>
              )}

              {activeTab === 'branding' && (
                <form onSubmit={handleUpdateSettings} className="space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Visual DNA</h2>
                      <p className="text-primary-200/30 text-[10px] font-black uppercase tracking-[0.2em]">Inject your institution's color signature into the ecosystem.</p>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="gap-2 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium"
                    >
                      <Palette className="w-4 h-4" />
                      Apply Signature
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">Primary Spectrum (Accent)</label>
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="relative group">
                        <Input
                          type="color"
                          value={settings.accent_color}
                          onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                          className="w-24 h-24 rounded-[32px] bg-transparent border-none cursor-pointer shadow-premium p-0"
                        />
                        <div className="absolute inset-0 rounded-[32px] border-4 border-white/20 pointer-events-none group-hover:border-white/40 transition-all" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Input
                          type="text"
                          value={settings.accent_color}
                          onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                          className="bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-black uppercase tracking-widest text-sm focus:bg-white/10 transition-all outline-none h-auto"
                        />
                        <p className="text-[9px] font-black text-primary-200/20 uppercase tracking-widest">Hexadecimal Spectrum Index</p>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {activeTab === 'notifications' && (
                <form onSubmit={handleUpdateSettings} className="space-y-12">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Transmission Matrix</h2>
                      <p className="text-primary-200/30 text-[10px] font-black uppercase tracking-[0.2em]">Configure external communication and alert protocols.</p>
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="gap-2 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium"
                    >
                      <Save className="w-4 h-4" />
                      Sync Matrix
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`flex items-center justify-between p-8 rounded-[32px] border transition-all ${settings.enable_email_notifications ? 'bg-primary-600/10 border-primary-500/20' : 'bg-white/5 border-white/5 opacity-60'}`}>
                      <div className="flex items-center gap-6">
                        <div className={`p-4 rounded-2xl transition-colors ${settings.enable_email_notifications ? 'bg-primary-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-white/10 text-primary-200/20'}`}>
                          <Mail className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">Email Stream</p>
                          <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest mt-1">Institutional Reports & Logs</p>
                        </div>
                      </div>
                      <div
                        onClick={() => setSettings({ ...settings, enable_email_notifications: !settings.enable_email_notifications })}
                        className={`w-14 h-8 rounded-full relative cursor-pointer transition-all duration-300 ${settings.enable_email_notifications ? 'bg-primary-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/10'}`}
                      >
                        <motion.div
                          animate={{ x: settings.enable_email_notifications ? 28 : 4 }}
                          className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg"
                        />
                      </div>
                    </div>

                    <div className={`flex items-center justify-between p-8 rounded-[32px] border transition-all ${settings.enable_sms_notifications ? 'bg-emerald-600/10 border-emerald-500/20' : 'bg-white/5 border-white/5 opacity-60'}`}>
                      <div className="flex items-center gap-6">
                        <div className={`p-4 rounded-2xl transition-colors ${settings.enable_sms_notifications ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-white/10 text-primary-200/20'}`}>
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">Direct SMS Link</p>
                          <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest mt-1">High-Priority Alert Protocols</p>
                        </div>
                      </div>
                      <div
                        onClick={() => setSettings({ ...settings, enable_sms_notifications: !settings.enable_sms_notifications })}
                        className={`w-14 h-8 rounded-full relative cursor-pointer transition-all duration-300 ${settings.enable_sms_notifications ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/10'}`}
                      >
                        <motion.div
                          animate={{ x: settings.enable_sms_notifications ? 28 : 4 }}
                          className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
