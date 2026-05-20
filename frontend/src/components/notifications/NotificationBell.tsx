import { useState, useEffect, useRef } from "react";
import {
  Bell,
  ShieldAlert,
  Info,
  AlertTriangle,
  CheckCircle,
  Check,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { notificationsService } from "../../api/services/notificationsService";

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  created_at: string;
}

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [emergency, setEmergency] = useState<any>(null);
  const token = useAuthStore((state) => state.token);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (token) {
      fetchNotifications();
      connectWS();
    }
    return () => ws.current?.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsService.getAll();
      // Ensure we map results if paginated
      const list = Array.isArray(data) ? data : data.results || [];
      setNotifications(list);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const connectWS = () => {
    if (!token) return;
    let wsUrl: string;
    const envURL = import.meta.env.VITE_API_URL;

    if (envURL) {
      const url = new URL(envURL);
      const protocol = url.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${protocol}//${url.host}/ws/notifications/?token=${token}`;
    } else {
      const { protocol, hostname, port } = window.location;
      const wsProtocol = protocol === "https:" ? "wss:" : "ws:";

      if (port === "" || port === "80" || port === "443") {
        wsUrl = `${wsProtocol}//${hostname}/ws/notifications/?token=${token}`;
      } else {
        wsUrl = `${wsProtocol}//${hostname}:8000/ws/notifications/?token=${token}`;
      }
    }

    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.level === "CRITICAL") {
        setEmergency(data);
      } else {
        // Map backend level representation to frontend type
        const newNotif: Notification = {
          id: data.id || Date.now(),
          title: data.title,
          message: data.message,
          notification_type: (data.level || "info").toLowerCase() as any,
          is_read: false,
          created_at: data.timestamp || new Date().toISOString(),
        };
        setNotifications((prev) => [newNotif, ...prev]);
        toast.custom((t) => (
          <div
            className={`${t.visible ? "animate-enter" : "animate-leave"} glass p-4 rounded-2xl border border-white/10 flex items-center gap-4`}
          >
            <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black text-white">{data.title}</p>
              <p className="text-xs text-primary-200/40">{data.message}</p>
            </div>
          </div>
        ));
      }
    };

    ws.current.onclose = () => {
      setTimeout(connectWS, 5000);
    };
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "error":
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-primary-400" />;
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationsService.clearAll();
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-primary-200 hover:bg-white/10 transition-all group"
        >
          <Bell className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-rose-500 border-2 border-[#020617] rounded-full animate-pulse"></span>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-16 right-0 w-96 glass rounded-[32px] border border-white/10 shadow-2xl z-[100] overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-white">
                    Notifications
                  </h3>
                  <span className="text-[9px] font-black text-primary-200/45 uppercase tracking-widest">
                    {unreadCount} UNREAD / {notifications.length} TOTAL
                  </span>
                </div>
                {notifications.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleMarkAllAsRead}
                      title="Mark all as read"
                      className="p-2 bg-white/5 hover:bg-white/10 text-muted-400 hover:text-white rounded-xl transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleClearAll}
                      title="Clear all"
                      className="p-2 bg-white/5 hover:bg-rose-950 text-muted-400 hover:text-rose-400 rounded-xl transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center space-y-3">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/5">
                      <Bell className="w-8 h-8" />
                    </div>
                    <p className="text-primary-200/30 text-sm font-medium">
                      All caught up!
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                      className={`p-4 border rounded-2xl transition-all cursor-pointer ${
                        n.is_read
                          ? "bg-white/[0.01] border-white/5 hover:bg-white/[0.03] opacity-60"
                          : "bg-white/[0.04] border-primary-500/20 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {getLevelIcon(n.notification_type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">
                            {n.title}
                          </p>
                          <p className="text-xs text-primary-200/40 mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                          <p className="text-[10px] font-black text-primary-200/20 uppercase tracking-tighter mt-2">
                            {new Date(n.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Emergency Alert Overlay */}
      <AnimatePresence>
        {emergency && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-rose-500/20 backdrop-blur-3xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-xl glass rounded-[48px] border-4 border-rose-500/50 p-12 text-center shadow-[0_0_100px_rgba(244,63,94,0.4)]"
            >
              <div className="w-24 h-24 bg-rose-500 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-lg animate-bounce">
                <ShieldAlert className="w-12 h-12" />
              </div>
              <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">
                {emergency.title}
              </h2>
              <p className="text-rose-100 text-lg font-medium leading-relaxed mb-10">
                {emergency.message}
              </p>
              <button
                onClick={() => setEmergency(null)}
                className="px-10 py-5 bg-white text-rose-500 rounded-[24px] font-black text-xl hover:scale-105 transition-transform flex items-center justify-center gap-3 mx-auto shadow-2xl"
              >
                Acknowledge Alert
                <CheckCircle className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
