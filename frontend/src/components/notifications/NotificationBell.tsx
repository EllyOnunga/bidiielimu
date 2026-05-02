import { useState, useEffect, useRef } from 'react';
import { Bell, ShieldAlert, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: string;
}

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [emergency, setEmergency] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    connectWS();
    return () => ws.current?.close();
  }, []);

  const connectWS = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = 'localhost:8000'; // Update for production
    
    ws.current = new WebSocket(`${protocol}//${host}/ws/notifications/`);
    
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.level === 'CRITICAL') {
        setEmergency(data);
      } else {
        setNotifications(prev => [data, ...prev]);
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} glass p-4 rounded-2xl border border-white/10 flex items-center gap-4`}>
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
      console.log('WS Disconnected. Reconnecting in 5s...');
      setTimeout(connectWS, 5000);
    };
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'CRITICAL': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      default: return <Info className="w-4 h-4 text-primary-400" />;
    }
  };

  return (
    <>
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-primary-200 hover:bg-white/10 transition-all group"
        >
          <Bell className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {notifications.length > 0 && (
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
                <h3 className="text-lg font-black text-white">Notifications</h3>
                <span className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest">{notifications.length} NEW</span>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center space-y-3">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/5">
                      <Bell className="w-8 h-8" />
                    </div>
                    <p className="text-primary-200/30 text-sm font-medium">All caught up!</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-all cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">{getLevelIcon(n.level)}</div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{n.title}</p>
                          <p className="text-xs text-primary-200/40 mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] font-black text-primary-200/20 uppercase tracking-tighter mt-2">Just Now</p>
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
              <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">{emergency.title}</h2>
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
