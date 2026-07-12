import { useState } from "react";
import { MessageSquare, X, Mail, Phone, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export const FloatingContact = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => !!state.token);

  // Optionally hide on certain pages if needed, but the user requested it on ALL pages.
  // const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 bg-[#0B132B]/90 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-2xl w-64 sm:w-72"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-black text-white uppercase tracking-widest">
                Support Protocol
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/60 mb-5 leading-relaxed font-medium">
              Initialize a direct channel with our strategic advisors for
              technical or operational support.
            </p>

            <div className="space-y-3">
              <a
                href="mailto:comms@gilanios.app"
                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors group"
              >
                <div className="p-2 bg-primary-600/20 text-primary-400 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-all">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                    Email
                  </p>
                  <p className="text-xs font-bold text-white">
                    comms@gilanios.app
                  </p>
                </div>
              </a>

              <a
                href="tel:+254700888999"
                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors group"
              >
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                    Hotline
                  </p>
                  <p className="text-xs font-bold text-white">
                    +254 700 888 999
                  </p>
                </div>
              </a>

              {location.pathname !== "/" && (
                <Link
                  to={isAuthenticated ? "/support" : "/#contact"}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors group"
                >
                  <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                      Portal
                    </p>
                    <p className="text-xs font-bold text-white">
                      {isAuthenticated ? "Support Tickets" : "Contact Form"}
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary-600 hover:bg-primary-500 text-white rounded-full flex items-center justify-center shadow-premium transition-transform hover:scale-110 active:scale-95"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};
