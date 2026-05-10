import { motion } from 'framer-motion';
import { Scale, ShieldAlert, Construction } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const DisciplinePage = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8"
    >
      <div className="relative">
        <div className="w-24 h-24 bg-primary-500/10 rounded-[32px] flex items-center justify-center border border-primary-500/20">
          <Scale className="w-12 h-12 text-primary-400" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center border-4 border-primary-950">
          <Construction className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <h1 className="text-4xl font-black text-white uppercase tracking-tight">Discipline <span className="text-gradient">Module</span></h1>
        <p className="text-primary-200/50 font-medium">
          The comprehensive student conduct and co-curricular portfolio tracking system is currently being integrated into the ElimuHub core.
        </p>
      </div>

      <div className="glass p-8 rounded-[32px] border-white/5 max-w-lg w-full space-y-6">
        <div className="flex items-center gap-4 text-left">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-white">Under Construction</h3>
            <p className="text-xs text-primary-200/40">Expected deployment: Version 1.2.0</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-primary-200/30">
            <span>Integration Progress</span>
            <span>65%</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '65%' }}
              className="h-full bg-primary-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            />
          </div>
        </div>

        <Button onClick={() => navigate('/students')} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium">
          Back to Students SIS
        </Button>
      </div>
    </motion.div>
  );
};
