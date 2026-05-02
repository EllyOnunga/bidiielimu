import { 
  Settings, Globe, Shield, Palette, 
  Upload, Save, Layout, Lock,
  ExternalLink, CheckCircle
} from 'lucide-react';

export const TenantSettings = () => {
  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">System Settings</h1>
          <p className="text-primary-200/40 font-bold uppercase tracking-widest mt-1">Configure your school environment</p>
        </div>
        <button className="px-8 py-4 bg-primary-500 text-white rounded-[24px] font-black text-lg flex items-center gap-3 hover:bg-primary-400 shadow-premium transition-all">
          <Save className="w-6 h-6" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Navigation */}
        <div className="space-y-2">
          {[
            { label: 'General Info', icon: Settings, active: true },
            { label: 'Branding & UI', icon: Palette, active: false },
            { label: 'Custom Domain', icon: Globe, active: false },
            { label: 'Academic Scales', icon: Layout, active: false },
            { label: 'Security & Auth', icon: Shield, active: false },
            { label: 'Payment Gateway', icon: Lock, active: false },
          ].map((item) => (
            <button 
              key={item.label}
              className={`w-full p-5 rounded-3xl flex items-center gap-4 transition-all ${
                item.active 
                ? 'bg-primary-500 text-white shadow-premium' 
                : 'text-primary-200/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-bold text-sm uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Branding Section */}
          <div className="glass p-10 rounded-[48px] border border-white/5 space-y-10">
            <h3 className="text-2xl font-black text-white flex items-center gap-4">
              <Palette className="w-6 h-6 text-indigo-400" />
              School Branding
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-black text-primary-200/30 uppercase tracking-widest">School Logo</label>
                <div className="w-40 h-40 bg-white/5 border-2 border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center gap-4 group hover:border-primary-500/50 transition-all cursor-pointer">
                  <Upload className="w-8 h-8 text-primary-200/20 group-hover:text-primary-500" />
                  <p className="text-[10px] font-black text-primary-200/20 uppercase tracking-widest">Replace Logo</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-primary-200/30 uppercase tracking-widest">School Name</label>
                  <input type="text" defaultValue="Greenwood Academy" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:ring-4 focus:ring-primary-500/20 outline-none" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-primary-200/30 uppercase tracking-widest">Platform Theme</label>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-500 border-4 border-white ring-4 ring-primary-500/20 cursor-pointer"></div>
                    <div className="w-12 h-12 rounded-full bg-rose-500 hover:scale-110 transition-all cursor-pointer"></div>
                    <div className="w-12 h-12 rounded-full bg-emerald-500 hover:scale-110 transition-all cursor-pointer"></div>
                    <div className="w-12 h-12 rounded-full bg-amber-500 hover:scale-110 transition-all cursor-pointer"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Domain Section */}
          <div className="glass p-10 rounded-[48px] border border-white/5 space-y-10">
            <h3 className="text-2xl font-black text-white flex items-center gap-4">
              <Globe className="w-6 h-6 text-emerald-400" />
              Custom Domain
            </h3>
            <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[32px] flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Current Active Domain</p>
                <div className="flex items-center gap-3">
                  <h4 className="text-2xl font-black text-white tracking-tight">portal.greenwood.edu</h4>
                  <ExternalLink className="w-4 h-4 text-white/20" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                <CheckCircle className="w-4 h-4" />
                Active & Verified
              </div>
            </div>
            <div className="p-8 bg-white/5 rounded-[32px] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary-400">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">SSL Certificate</p>
                  <p className="text-primary-200/40 text-[10px] font-black uppercase">Auto-Renewed by Scholara</p>
                </div>
              </div>
              <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10">Renew Early</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
