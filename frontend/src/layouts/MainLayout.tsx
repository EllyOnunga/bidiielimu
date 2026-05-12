import { toast } from "react-hot-toast";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ROLES } from "../constants/roles";
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
  BrainCircuit,
  Layers,
} from "lucide-react";
import { useAuthStore, type User } from "../store/authStore";
import { ThemeToggle } from "../components/ThemeToggle";
import { CommandPalette } from "../components/CommandPalette";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "../api/services/notificationsService";
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { ElimuHubLogo } from "../components/ui/Logo";

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
      `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative ${
        isActive
          ? "text-primary-400"
          : "text-muted hover:bg-white/5 hover:text-primary"
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
        <Icon
          className={`w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-primary-400" : ""}`}
        />
        <span className="font-semibold text-sm relative z-10">{label}</span>
      </>
    )}
  </NavLink>
);

interface SidebarContentProps {
  user: User | null;
  schoolName: string;
  schoolLogo: string;
  setIsSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
}

const SidebarContent = ({
  user,
  schoolName,
  schoolLogo,
  setIsSidebarOpen,
  handleLogout,
}: SidebarContentProps) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between mb-10 px-2">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary-600 rounded-2xl shadow-premium flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
          {schoolLogo ? (
            <img
              src={schoolLogo}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          ) : (
            <ElimuHubLogo className="w-8 h-8" showText={false} />
          )}
        </div>
        <div className="min-w-0">
          <h1
            className="text-lg font-black text-primary tracking-tight truncate w-32 font-serif"
            title={schoolName}
          >
            {schoolName || "ElimuHub"}
          </h1>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
            {user?.role} PORTAL
          </p>
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
      {/* Dashboard - Accessible by all staff roles */}
      {(user?.role === ROLES.ADMIN ||
        user?.role === ROLES.PRINCIPAL ||
        user?.role === ROLES.TEACHER ||
        user?.role === ROLES.HOD ||
        user?.role === ROLES.SUPER_ADMIN ||
        user?.role === ROLES.LIBRARIAN ||
        user?.role === ROLES.FINANCE) && (
        <NavItem
          to="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Academic Section */}
      {(user?.role === ROLES.ADMIN ||
        user?.role === ROLES.PRINCIPAL ||
        user?.role === ROLES.TEACHER ||
        user?.role === ROLES.HOD) && (
        <>
          <div className="pt-4 pb-2 px-4 text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">
            Academic
          </div>
          <NavItem
            to="/students"
            icon={Users}
            label="Student Info (SIS)"
            onClick={() => setIsSidebarOpen(false)}
          />
          <NavItem
            to="/lms"
            icon={GraduationCap}
            label="Learning Portal (LMS)"
            onClick={() => setIsSidebarOpen(false)}
          />
          <NavItem
            to="/classes"
            icon={BookOpen}
            label="Academic Structure"
            onClick={() => setIsSidebarOpen(false)}
          />
          <NavItem
            to="/exams"
            icon={ClipboardList}
            label="Exams & Grading"
            onClick={() => setIsSidebarOpen(false)}
          />
          <NavItem
            to="/grading"
            icon={Layers}
            label="Grading Systems"
            onClick={() => setIsSidebarOpen(false)}
          />
          <NavItem
            to="/attendance"
            icon={CheckSquare}
            label="Attendance"
            onClick={() => setIsSidebarOpen(false)}
          />
          <NavItem
            to="/timetable"
            icon={Calendar}
            label="Timetable"
            onClick={() => setIsSidebarOpen(false)}
          />
        </>
      )}

      {/* Operations Section - Dynamic based on role */}
      {(user?.role === ROLES.ADMIN ||
        user?.role === ROLES.PRINCIPAL ||
        user?.role === ROLES.FINANCE ||
        user?.role === ROLES.LIBRARIAN ||
        user?.role === ROLES.TEACHER ||
        user?.role === ROLES.HOD) && (
        <>
          <div className="pt-4 pb-2 px-4 text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">
            Operations
          </div>

          {(user?.role === ROLES.ADMIN ||
            user?.role === ROLES.PRINCIPAL ||
            user?.role === ROLES.FINANCE) && (
            <NavItem
              to="/fees"
              icon={Wallet}
              label="Finance & Fees"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {(user?.role === ROLES.ADMIN || user?.role === ROLES.PRINCIPAL) && (
            <NavItem
              to="/hr/directory"
              icon={UserSquare2}
              label="Staff & HR"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {(user?.role === ROLES.ADMIN ||
            user?.role === ROLES.PRINCIPAL ||
            user?.role === ROLES.FINANCE) && (
            <NavItem
              to="/hr/payroll"
              icon={ClipboardList}
              label="Payroll"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {(user?.role === ROLES.ADMIN ||
            user?.role === ROLES.PRINCIPAL ||
            user?.role === ROLES.LIBRARIAN) && (
            <NavItem
              to="/inventory"
              icon={Box}
              label="Inventory"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {(user?.role === ROLES.ADMIN ||
            user?.role === ROLES.PRINCIPAL ||
            user?.role === ROLES.HOD ||
            user?.role === ROLES.TEACHER) && (
            <NavItem
              to="/discipline"
              icon={Scale}
              label="Discipline"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </>
      )}

      {/* Intelligence & System Sections */}
      {(user?.role === ROLES.ADMIN || user?.role === ROLES.PRINCIPAL) && (
        <>
          <div className="pt-4 pb-2 px-4 text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">
            Intelligence
          </div>
          <NavItem
            to="/analytics"
            icon={BrainCircuit}
            label="AI Analytics"
            onClick={() => setIsSidebarOpen(false)}
          />

          <div className="pt-4 pb-2 px-4 text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">
            System
          </div>
          <NavItem
            to="/communication"
            icon={MessageSquare}
            label="Communication"
            onClick={() => setIsSidebarOpen(false)}
          />
          <NavItem
            to="/audit-logs"
            icon={ShieldAlert}
            label="Audit Logs"
            onClick={() => setIsSidebarOpen(false)}
          />
        </>
      )}

      {/* Platform Level Section */}
      {user?.role === ROLES.SUPER_ADMIN && (
        <>
          <div className="pt-4 pb-2 px-4 text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">
            Platform Control
          </div>
          <NavItem
            to="/super-admin"
            icon={Shield}
            label="Super-Admin"
            onClick={() => setIsSidebarOpen(false)}
          />
          <NavItem
            to="/audit-logs"
            icon={ShieldAlert}
            label="System Audit"
            onClick={() => setIsSidebarOpen(false)}
          />
        </>
      )}

      {/* Portal View for Students/Parents */}
      {(user?.role === ROLES.STUDENT || user?.role === ROLES.PARENT) && (
        <>
          <NavItem
            to="/portal"
            icon={LayoutDashboard}
            label="Portal View"
            onClick={() => setIsSidebarOpen(false)}
          />
          <NavItem
            to="/lms"
            icon={GraduationCap}
            label="Learning Portal (LMS)"
            onClick={() => setIsSidebarOpen(false)}
          />
          <NavItem
            to="/timetable"
            icon={Calendar}
            label="Timetable"
            onClick={() => setIsSidebarOpen(false)}
          />
        </>
      )}
    </nav>

    <div className="mt-auto border-t border-white/5 pt-6 space-y-1">
      <NavItem
        to="/settings"
        icon={Settings}
        label="Settings"
        onClick={() => setIsSidebarOpen(false)}
      />
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 w-full text-primary-200/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all font-bold text-sm mb-4"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>

      {/* Powered By Branding */}
      <div className="flex flex-col items-center justify-center pt-4 pb-2 border-t border-white/5 opacity-50 hover:opacity-100 transition-opacity">
        <ElimuHubLogo className="w-8 h-8" showText={false} />
        <p className="text-[9px] font-bold text-white mt-2 uppercase tracking-[0.2em]">
          Powered by
        </p>
        <p className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-[#22c55e]">
          ElimuHub
        </p>
      </div>
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
    queryKey: ["notifications"],
    queryFn: notificationsService.getAll,
    enabled: user?.role !== "SUPER_ADMIN", // Super Admin doesn't have tenant-specific notifications
    select: (data) => (Array.isArray(data) ? data : data.results || []),
    refetchInterval: 30000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationsService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const markAllAsRead = () => markAllReadMutation.mutate();
  const markAsRead = (id: number) => markAsReadMutation.mutate(id);

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n: any) => !n.is_read).length
    : 0;

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
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[45] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
        w-[280px] p-6 flex flex-col glass fixed h-[calc(100vh-2rem)] top-4 left-4 rounded-[32px] z-[50] transition-all duration-500 ease-in-out
        lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-[calc(100%+2rem)]"}
        shadow-2xl lg:shadow-none
      `}
      >
        <SidebarContent
          user={user}
          schoolName={schoolName}
          schoolLogo={logoUrl || ""}
          setIsSidebarOpen={setIsSidebarOpen}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[312px]">
        {/* Header Bar */}
        <header className="sticky top-0 z-[40] px-4 md:px-6 lg:px-8 py-4">
          <div className="glass p-2 md:p-3 rounded-[24px] flex items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-3 text-primary-200/50 hover:text-white bg-white/5 rounded-2xl border border-white/5 transition-all active:scale-95 shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-white/10 shadow-sm ml-1">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ElimuHubLogo className="w-6 h-6" showText={false} />
                )}
              </div>
            </div>

            <button
              onClick={() =>
                window.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
                )
              }
              className="flex items-center gap-3 px-4 py-2.5 bg-white/5 rounded-xl text-primary-200/40 hover:text-primary-200/60 transition-all border border-white/5 flex-1 lg:max-w-md text-sm font-medium group"
            >
              <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Quick Search...</span>
              <kbd className="ml-auto bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold border border-white/10 hidden sm:inline opacity-50">
                ⌘K
              </kbd>
            </button>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2.5 rounded-xl border transition-all relative active:scale-95 ${
                    showNotifications
                      ? "bg-primary-600 border-primary-500 text-white shadow-premium"
                      : "bg-white/5 border-white/5 text-primary-200/50 hover:text-white"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-primary-950 animate-pulse shadow-glow" />
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
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-[calc(100vw-2rem)] sm:w-96 glass rounded-[24px] shadow-2xl overflow-hidden p-2 z-[60]"
                      >
                        <div className="p-4 flex items-center justify-between border-b border-white/5 mb-2">
                          <h3 className="font-bold text-white">
                            Notifications
                          </h3>
                          {unreadCount > 0 && (
                            <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase">
                              {unreadCount} New
                            </span>
                          )}
                        </div>
                        <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                          {!Array.isArray(notifications) ||
                          notifications.length === 0 ? (
                            <div className="p-10 text-center text-primary-200/30 text-xs font-medium italic">
                              No new transmissions
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <motion.div
                                key={n.id}
                                layout
                                onClick={() => markAsRead(n.id)}
                                className={`p-3.5 hover:bg-white/5 rounded-xl transition-all cursor-pointer group border border-transparent hover:border-white/5 ${!n.is_read ? "bg-primary-500/5" : ""}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                      n.notification_type === "success"
                                        ? "bg-emerald-500"
                                        : n.notification_type === "warning"
                                          ? "bg-amber-500"
                                          : "bg-primary-500"
                                    } ${n.is_read ? "opacity-20" : "shadow-glow"}`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-xs font-bold truncate ${n.is_read ? "text-primary-200/40" : "text-white"}`}
                                    >
                                      {n.title}
                                    </p>
                                    <p className="text-[10px] text-primary-200/50 line-clamp-2 mt-0.5 leading-tight">
                                      {n.message}
                                    </p>
                                    <p className="text-[8px] font-bold text-primary-200/20 mt-1.5 uppercase">
                                      {new Date(
                                        n.created_at,
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                        <button
                          onClick={markAllAsRead}
                          className="w-full py-3 text-[10px] font-black text-primary-400 hover:text-primary-300 transition-all border-t border-white/5 mt-2 uppercase tracking-[0.2em]"
                        >
                          Clear Archive
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 px-4 md:px-6 lg:px-8 pb-12 relative min-h-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="max-w-[1600px] mx-auto w-full"
          >
            <Breadcrumbs />
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};
