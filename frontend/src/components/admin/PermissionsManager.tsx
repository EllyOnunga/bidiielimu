import { useState } from 'react';
import {
  ShieldAlert, Lock, Unlock, Users, Info,
  ChevronRight, Save
} from 'lucide-react';

interface RolePermission {
  module: string;
  permissions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
}

export const PermissionsManager = () => {
  const [activeRole, setActiveRole] = useState('Teacher');
  const [permissions] = useState<RolePermission[]>([
    { module: 'Student Records', permissions: { view: true, create: true, edit: true, delete: false } },
    { module: 'Examinations', permissions: { view: true, create: true, edit: true, delete: true } },
    { module: 'Financials', permissions: { view: false, create: false, edit: false, delete: false } },
    { module: 'HR & Staff', permissions: { view: true, create: false, edit: false, delete: false } },
    { module: 'Communication', permissions: { view: true, create: true, edit: true, delete: false } },
  ]);

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Access Governance</h1>
          <p className="text-primary-200/40 font-bold uppercase tracking-widest mt-1">Granular Role-Based Permissions</p>
        </div>
        <button className="px-8 py-4 bg-indigo-500 text-white rounded-[24px] font-black text-lg flex items-center gap-3 hover:bg-indigo-400 shadow-premium transition-all">
          <Save className="w-6 h-6" />
          Update Permissions
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Role Selector */}
        <div className="glass p-8 rounded-[48px] border border-white/5 space-y-6 self-start">
          <h4 className="text-xs font-black text-white/40 uppercase tracking-widest">Select Role</h4>
          <div className="space-y-2">
            {['Admin', 'Teacher', 'Bursar', 'Librarian', 'Parent', 'Student'].map((role) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${activeRole === role
                    ? 'bg-primary-500 text-white shadow-premium'
                    : 'text-primary-200/40 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <span className="font-bold text-sm">{role}</span>
                {activeRole === role && <ChevronRight size={16} />}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="lg:col-span-3 space-y-8">
          <div className="glass p-10 rounded-[48px] border border-white/5 space-y-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">{activeRole} Privileges</h3>
                  <p className="text-xs font-bold text-primary-200/40 uppercase tracking-widest mt-1">Managed via Global RBAC Policy</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                <Info size={14} />
                Restricted System Role
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-5 px-8 text-[10px] font-black text-primary-200/20 uppercase tracking-widest">
                <div className="col-span-2">Module Name</div>
                <div className="text-center">View</div>
                <div className="text-center">Create/Edit</div>
                <div className="text-center">Delete</div>
              </div>

              {permissions.map((perm, i) => (
                <div key={i} className="grid grid-cols-5 items-center p-8 bg-white/[0.02] border border-white/5 rounded-[32px] group hover:bg-white/[0.04] transition-all">
                  <div className="col-span-2 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary-200/60 group-hover:bg-primary-500 group-hover:text-white transition-all">
                      <Lock size={18} />
                    </div>
                    <span className="text-white font-bold">{perm.module}</span>
                  </div>

                  <div className="flex justify-center">
                    <button className={`p-2 rounded-lg transition-all ${perm.permissions.view ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {perm.permissions.view ? <Unlock size={18} /> : <Lock size={18} />}
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <button className={`p-2 rounded-lg transition-all ${perm.permissions.create ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {perm.permissions.create ? <Unlock size={18} /> : <Lock size={18} />}
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <button className={`p-2 rounded-lg transition-all ${perm.permissions.delete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {perm.permissions.delete ? <Unlock size={18} /> : <Lock size={18} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-10 bg-indigo-500/5 border border-indigo-500/10 rounded-[48px] flex items-center gap-8">
            <div className="w-16 h-16 bg-indigo-500 rounded-3xl flex items-center justify-center text-white shrink-0 shadow-premium">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-black text-white mb-1">Impact Analysis</h4>
              <p className="text-primary-200/60 text-sm leading-relaxed">
                Changes to the <span className="text-white font-bold">{activeRole}</span> role will instantly affect <span className="text-white font-bold">48 active users</span>.
                All active sessions will be updated in real-time via the WebSocket notification layer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
