import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const PageLoader = () => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[999] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="glass-interactive p-8 rounded-3xl flex flex-col items-center gap-4 border border-white/10 shadow-premium"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-primary-500 blur-xl opacity-20 rounded-full animate-pulse-slow"></div>
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin relative z-10" />
        </div>
        <div className="text-center">
          <h3 className="text-white font-black text-lg uppercase tracking-tight">Bidii<span className="text-primary-400">Elimu</span></h3>
          <p className="text-primary-200/50 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Loading Assets...</p>
        </div>
      </motion.div>
    </div>
  );
};
