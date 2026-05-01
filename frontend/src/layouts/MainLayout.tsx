import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  BookOpen, 
  Wallet, 
  ClipboardList, 
  CheckSquare, 
  LogOut,
  GraduationCap,
  Search,
  Bell,
  Menu,
  X as CloseIcon,
  Shield,
  Calendar,
  ShieldAlert,
  Settings,
  TrendingUp,
  MessageSquare,
  Layers
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from '../components/ThemeToggle';
import { CommandPalette } from '../components/CommandPalette';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '../api/services/notificationsService';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import client from '../api/client';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}

const NavItem = ({ to, icon: Icon, label, onClick }: NavItemProps) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        isActive 
          ? 'bg-primary-600/10 text-primary-400 border border-primary-500/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`
    }
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </NavLink>
);

interface SidebarContentProps {
  user: {
    role: string;
    email: string;
    first_name?: string;
    last_name?: string;
  } | null;
  schoolName: string;
  schoolLogo: string;
  setIsSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
}

const SidebarContent = ({ user, schoolName, schoolLogo, setIsSidebarOpen, handleLogout }: SidebarContentProps) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between mb-10 px-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-600 rounded-xl shadow-lg shadow-primary-900/40 flex items-center justify-center overflow-hidden shrink-0">
          {schoolLogo ? (
            <img src={schoolLogo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <GraduationCap className="w-6 h-6 text-white" />
          )}
        </div>
        <h1 className="text-xl font-black text-white tracking-tight truncate max-w-[160px]" title={schoolName}>
          {schoolName}
        </h1>
      </div>
      <button 
        onClick={() => setIsSidebarOpen(false)}
        className="lg:hidden p-2 text-slate-400 hover:text-white"
      >
        <CloseIcon className="w-6 h-6" />
      </button>
    </div>
    
    <nav className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
      {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
        <>
          <NavItem to="/students" icon={Users} label="Students" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/classes" icon={BookOpen} label="Classes" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/exams" icon={ClipboardList} label="Exams" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/attendance" icon={CheckSquare} label="Attendance" onClick={() => setIsSidebarOpen(false)} />
        </>
      )}

      {user?.role === 'ADMIN' && (
        <>
          <NavItem to="/teachers" icon={UserSquare2} label="Teachers" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/fees" icon={Wallet} label="Fees" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/super-admin" icon={Shield} label="Super-Admin" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/analytics" icon={TrendingUp} label="Analytics" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/communication" icon={MessageSquare} label="Communication" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/grading" icon={Layers} label="Grading Systems" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/audit-logs" icon={ShieldAlert} label="Audit Logs" onClick={() => setIsSidebarOpen(false)} />
        </>
      )}

      <NavItem to="/timetable" icon={Calendar} label="Timetable" onClick={() => setIsSidebarOpen(false)} />
      
      {(user?.role === 'STUDENT' || user?.role === 'PARENT') && (
        <NavItem to="/portal" icon={LayoutDashboard} label="Portal View" onClick={() => setIsSidebarOpen(false)} />
      )}
    </nav>

    <div className="mt-auto border-t border-slate-800 pt-6">
      <NavItem to="/settings" icon={Settings} label="Settings" onClick={() => setIsSidebarOpen(false)} />
      <button 
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl transition-all font-medium text-sm mt-1"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </div>
  </div>
);

export const MainLayout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getAll,
    select: (data) => Array.isArray(data) ? data : (data.results || []),
    refetchInterval: 30000,
  });

  const { data: schoolInfo = { name: '', logo: '' } } = useQuery({
    queryKey: ['school_settings'],
    queryFn: async () => {
      const res = await client.get('schools/settings/');
      return {
        name: res.data.school_name || '',
        logo: res.data.school_logo || ''
      };
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationsService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAllAsRead = () => markAllReadMutation.mutate();
  const markAsRead = (id: number) => markAsReadMutation.mutate(id);

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return (
    <div className="flex min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] transition-colors duration-300">
      <CommandPalette />
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[30] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        w-72 border-r border-slate-800 p-6 flex flex-col glass-dark fixed h-full z-[40] transition-transform duration-300
        lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent 
          user={user} 
          schoolName={schoolInfo.name} 
          schoolLogo={schoolInfo.logo}
          setIsSidebarOpen={setIsSidebarOpen} 
          handleLogout={handleLogout} 
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-4 md:p-6 lg:p-10 relative min-h-screen w-full overflow-x-hidden">
        {/* Header Bar */}
        <header className="flex items-center justify-between mb-8 md:mb-10 bg-slate-900/40 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-white/5 gap-4 relative z-50">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-xl border border-slate-700/50"
          >
            <Menu className="w-6 h-6" />
          </button>

          <button 
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
            className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-xl text-slate-400 hover:text-slate-300 transition-all border border-slate-700/50 flex-1 lg:flex-none lg:w-64 text-sm"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="ml-auto bg-slate-700 px-1.5 py-0.5 rounded text-[10px] hidden sm:inline">Ctrl K</kbd>
          </button>

          <div className="flex items-center gap-2 md:gap-4 relative">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 md:p-2.5 rounded-xl border transition-all relative ${
                  showNotifications ? 'bg-primary-600 border-primary-500 text-white' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white'
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary-500 rounded-full border-2 border-[#0f172a]" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowNotifications(false)}
                      className="fixed inset-0 z-[-1]"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-80 glass-dark rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-2 z-[60]"
                    >
                      <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="font-bold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-[10px] bg-primary-600 text-white px-2 py-0.5 rounded-full">{unreadCount} New</span>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {!Array.isArray(notifications) || notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 text-sm">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => markAsRead(n.id)}
                              className={`p-4 hover:bg-white/5 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-white/5 mb-1 ${!n.is_read ? 'bg-primary-500/5' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${
                                  n.notification_type === 'success' ? 'bg-emerald-500' : n.notification_type === 'warning' ? 'bg-amber-500' : 'bg-primary-500'
                                } ${n.is_read ? 'opacity-30' : ''}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${n.is_read ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                                  <p className="text-[10px] text-slate-500 line-clamp-2">{n.message}</p>
                                  <p className="text-[8px] text-slate-600 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <button 
                        onClick={markAllAsRead}
                        className="w-full py-3 text-xs font-bold text-slate-400 hover:text-primary-400 transition-all border-t border-white/5"
                      >
                        Mark All as Read
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <Breadcrumbs />
        <Outlet />
      </main>
    </div>
  );
};
