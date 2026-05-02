import { toast } from 'react-hot-toast';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  MessageSquare,
  Box,
  Scale,
  BrainCircuit
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from '../components/ThemeToggle';
import { CommandPalette } from '../components/CommandPalette';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '../api/services/notificationsService';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

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
      `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative ${isActive
        ? 'text-primary-400'
        : 'text-primary-200/50 hover:bg-white/5 hover:text-white'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <motion.div
            layoutId="activeNav"
            className="absolute inset-0 bg-primary-500/10 border border-primary-500/20 rounded-2xl z-0"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <Icon className={`w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary-400' : ''}`} />
        <span className="font-semibold text-sm relative z-10">{label}</span>
      </>
    )}
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
        <div className="w-12 h-12 bg-primary-600 rounded-2xl shadow-premium flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
          {schoolLogo ? (
            <img src={schoolLogo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <GraduationCap className="w-7 h-7 text-white" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-black text-white tracking-tight truncate w-32 font-serif" title={schoolName}>
            {schoolName || 'Scholara'}
          </h1>
          <p className="text-[10px] font-bold text-primary-400/60 uppercase tracking-widest">{user?.role} PORTAL</p>
        </div>
      </div>
      <button
        onClick={() => setIsSidebarOpen(false)}
        className="lg:hidden p-2 text-primary-200/50 hover:text-white"
      >
        <CloseIcon className="w-6 h-6" />
      </button>
    </div>

    <nav className="space-y-1.5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
      {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setIsSidebarOpen(false)} />
      )}

      {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
        <>
          <div className="pt-4 pb-2 px-4 text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">Academic</div>
          <NavItem to="/students" icon={Users} label="Student Info (SIS)" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/lms" icon={BookOpen} label="LMS & Classes" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/exams" icon={ClipboardList} label="Exams & Grading" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/attendance" icon={CheckSquare} label="Attendance" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/timetable" icon={Calendar} label="Timetable" onClick={() => setIsSidebarOpen(false)} />
        </>
      )}

      {user?.role === 'ADMIN' && (
        <>
          <div className="pt-4 pb-2 px-4 text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">Operations</div>
          <NavItem to="/finance" icon={Wallet} label="Finance & Fees" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/hr" icon={UserSquare2} label="Staff & HR" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/inventory" icon={Box} label="Inventory" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/discipline" icon={Scale} label="Discipline" onClick={() => setIsSidebarOpen(false)} />

          <div className="pt-4 pb-2 px-4 text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">Intelligence</div>
          <NavItem to="/analytics" icon={BrainCircuit} label="AI Analytics" onClick={() => setIsSidebarOpen(false)} />

          <div className="pt-4 pb-2 px-4 text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">System</div>
          <NavItem to="/communication" icon={MessageSquare} label="Communication" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/super-admin" icon={Shield} label="Super-Admin" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/audit-logs" icon={ShieldAlert} label="Audit Logs" onClick={() => setIsSidebarOpen(false)} />
        </>
      )}

      {(user?.role === 'STUDENT' || user?.role === 'PARENT') && (
        <>
          <NavItem to="/portal" icon={LayoutDashboard} label="Portal View" onClick={() => setIsSidebarOpen(false)} />
          <NavItem to="/timetable" icon={Calendar} label="Timetable" onClick={() => setIsSidebarOpen(false)} />
        </>
      )}
    </nav>

    <div className="mt-auto border-t border-white/5 pt-6 space-y-1">
      <NavItem to="/settings" icon={Settings} label="Settings" onClick={() => setIsSidebarOpen(false)} />
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 w-full text-primary-200/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all font-bold text-sm"
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
  const { schoolName, logoUrl } = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getAll,
    select: (data) => Array.isArray(data) ? data : (data.results || []),
    refetchInterval: 30000,
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
    toast.success('Logged out successfully');
  };

  const markAllAsRead = () => markAllReadMutation.mutate();
  const markAsRead = (id: number) => markAsReadMutation.mutate(id);

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.is_read).length : 0;

  return (
    <div className="flex min-h-screen bg-transparent text-white selection:bg-primary-500/30">
      <CommandPalette />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[30] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        w-72 p-6 flex flex-col glass fixed h-[calc(100vh-2rem)] top-4 left-4 rounded-[40px] z-[40] transition-transform duration-500 ease-in-out
        lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]'}
      `}>
        <SidebarContent
          user={user}
          schoolName={schoolName}
          schoolLogo={logoUrl || ''}
          setIsSidebarOpen={setIsSidebarOpen}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-80 p-4 md:p-6 lg:p-8 relative min-h-screen w-full">
        {/* Header Bar */}
        <header className="flex items-center justify-between mb-8 glass p-2 md:p-3 rounded-[32px] gap-4 sticky top-4 z-20">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-3 text-primary-200/50 hover:text-white bg-white/5 rounded-2xl border border-white/5"
          >
            <Menu className="w-6 h-6" />
          </button>

          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
            className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-2xl text-primary-200/40 hover:text-primary-200/60 transition-all border border-white/5 flex-1 lg:flex-none lg:w-80 text-sm font-medium"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Search...</span>
            <kbd className="ml-auto bg-white/10 px-2 py-1 rounded-lg text-[10px] font-bold border border-white/10 hidden sm:inline">Ctrl K</kbd>
          </button>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-3 rounded-2xl border transition-all relative ${showNotifications ? 'bg-primary-600 border-primary-500 text-white shadow-premium' : 'bg-white/5 border-white/5 text-primary-200/50 hover:text-white'
                  }`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-accent-500 rounded-full border-2 border-primary-950 animate-pulse" />
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
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      className="absolute right-0 mt-6 w-96 glass rounded-[32px] shadow-premium overflow-hidden p-3 z-[60]"
                    >
                      <div className="p-4 flex items-center justify-between">
                        <h3 className="font-black text-white text-lg">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-black bg-accent-600 text-white px-3 py-1 rounded-full uppercase tracking-tighter">{unreadCount} New</span>
                        )}
                      </div>
                      <div className="max-h-[450px] overflow-y-auto pr-1 space-y-2">
                        {!Array.isArray(notifications) || notifications.length === 0 ? (
                          <div className="p-12 text-center text-primary-200/30 text-sm font-medium">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <motion.div
                              key={n.id}
                              layout
                              onClick={() => markAsRead(n.id)}
                              className={`p-4 hover:bg-white/5 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-white/10 ${!n.is_read ? 'bg-primary-500/5' : ''}`}
                            >
                              <div className="flex items-start gap-4">
                                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${n.notification_type === 'success' ? 'bg-emerald-500' : n.notification_type === 'warning' ? 'bg-amber-500' : 'bg-primary-500'
                                  } ${n.is_read ? 'opacity-20' : ''}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-bold truncate ${n.is_read ? 'text-primary-200/40' : 'text-white'}`}>{n.title}</p>
                                  <p className="text-[11px] text-primary-200/50 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                                  <p className="text-[9px] font-bold text-primary-200/30 mt-2 uppercase tracking-tight">{new Date(n.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                      <button
                        onClick={markAllAsRead}
                        className="w-full py-4 text-xs font-black text-primary-400 hover:text-primary-300 transition-all border-t border-white/5 mt-2 uppercase tracking-widest"
                      >
                        Clear All
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Breadcrumbs />
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};
