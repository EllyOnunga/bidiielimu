import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all relative overflow-hidden group"
      aria-label="Toggle theme"
    >
      <motion.div
        animate={{ y: theme === 'dark' ? 0 : 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Moon className="w-5 h-5" />
      </motion.div>
      <motion.div
        initial={{ y: -40 }}
        animate={{ y: theme === 'light' ? -20 : -40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="absolute top-5 left-2.5"
      >
        <Sun className="w-5 h-5" />
      </motion.div>
    </button>
  );
};
