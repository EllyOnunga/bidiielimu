import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Users, UserSquare2, BookOpen, Wallet, ClipboardList, CheckSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const items = [
  { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', to: '/students', icon: Users },
  { id: 'teachers', label: 'Teachers', to: '/teachers', icon: UserSquare2 },
  { id: 'classes', label: 'Classes', to: '/classes', icon: BookOpen },
  { id: 'fees', label: 'Fees', to: '/fees', icon: Wallet },
  { id: 'exams', label: 'Exams', to: '/exams', icon: ClipboardList },
  { id: 'attendance', label: 'Attendance', to: '/attendance', icon: CheckSquare },
];

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (to: string) => {
    navigate(to);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-xl glass-dark rounded-2xl shadow-2xl overflow-hidden border border-white/10 relative z-10"
          >
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                autoFocus
                placeholder="Search anything... (e.g., Students, Exams)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder-slate-500"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/5 rounded-lg text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {filteredItems.length > 0 ? (
                <div className="space-y-1">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.to)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary-500/10 hover:text-primary-400 text-slate-300 transition-all text-left group"
                    >
                      <item.icon className="w-5 h-5 text-slate-500 group-hover:text-primary-400" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No results found for "{search}"
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-900/50 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              <div className="flex gap-4">
                <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 mr-1">↵</kbd> Select</span>
                <span><kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 mr-1">esc</kbd> Close</span>
              </div>
              <span>EliteEdu Search</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
