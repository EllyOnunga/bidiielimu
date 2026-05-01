import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  User, School, Bell, Save,
  CreditCard, Palette, GraduationCap, Mail, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import client from '../api/client';
import { toast } from 'react-hot-toast';

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
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-slate-400">Manage your account and platform preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 space-y-2">
          {tabs.map((tab) => {
            if (tab.adminOnly && user?.role !== 'ADMIN') return null;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="glass-dark p-8 rounded-3xl border border-white/5 shadow-2xl"
            >
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Full Name</label>
                      <input
                        type="text"
                        value={`${user?.first_name || ''} ${user?.last_name || ''}`}
                        readOnly
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white cursor-not-allowed opacity-70"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Email Address</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        readOnly
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white cursor-not-allowed opacity-70"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'school' && (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">School Profile</h2>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">School Name</label>
                      <input
                        type="text"
                        value={schoolProfile.name}
                        onChange={(e) => setSchoolProfile({ ...schoolProfile, name: e.target.value })}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Contact Email</label>
                      <input
                        type="email"
                        value={schoolProfile.contact_email}
                        onChange={(e) => setSchoolProfile({ ...schoolProfile, contact_email: e.target.value })}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 transition-all outline-none"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-medium text-slate-400">Address</label>
                      <textarea
                        value={schoolProfile.address}
                        onChange={(e) => setSchoolProfile({ ...schoolProfile, address: e.target.value })}
                        rows={3}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 transition-all outline-none resize-none"
                      />
                    </div>
                  </div>
                </form>
              )}

              {activeTab === 'academic' && (
                <form onSubmit={handleUpdateSettings} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Academic Configuration</h2>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Save Settings
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Current Academic Year</label>
                      <select
                        value={settings.academic_year}
                        onChange={(e) => setSettings({ ...settings, academic_year: e.target.value })}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 transition-all outline-none"
                      >
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Current Term</label>
                      <select
                        value={settings.current_term}
                        onChange={(e) => setSettings({ ...settings, current_term: e.target.value })}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 transition-all outline-none"
                      >
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Term 3">Term 3</option>
                      </select>
                    </div>
                  </div>
                </form>
              )}

              {activeTab === 'finance' && (
                <form onSubmit={handleUpdateSettings} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Financial Preferences</h2>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Apply Changes
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Currency Symbol</label>
                      <input
                        type="text"
                        value={settings.currency}
                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Tax / VAT (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={settings.tax_percentage}
                        onChange={(e) => setSettings({ ...settings, tax_percentage: e.target.value })}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 transition-all outline-none"
                      />
                    </div>
                  </div>
                </form>
              )}

              {activeTab === 'branding' && (
                <form onSubmit={handleUpdateSettings} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Branding & Theme</h2>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Apply Branding
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium text-slate-400">Primary Accent Color</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={settings.accent_color}
                        onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                        className="w-16 h-16 rounded-2xl bg-transparent border-none cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.accent_color}
                        onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                        className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono"
                      />
                    </div>
                  </div>
                </form>
              )}

              {activeTab === 'notifications' && (
                <form onSubmit={handleUpdateSettings} className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Notification Preferences</h2>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Save Toggles
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Email Notifications</p>
                          <p className="text-xs text-slate-500">Receive grade reports and fee receipts via email</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enable_email_notifications}
                        onChange={(e) => setSettings({ ...settings, enable_email_notifications: e.target.checked })}
                        className="w-6 h-6 accent-primary-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white font-medium">SMS Alerts</p>
                          <p className="text-xs text-slate-500">Instant alerts for attendance and emergencies</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enable_sms_notifications}
                        onChange={(e) => setSettings({ ...settings, enable_sms_notifications: e.target.checked })}
                        className="w-6 h-6 accent-primary-500"
                      />
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
