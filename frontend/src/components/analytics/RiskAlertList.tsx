import { useState, useEffect } from 'react';
import { ShieldAlert, MessageSquare, CheckCircle, BrainCircuit, User } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface RiskProfile {
  id: string;
  student_name: string;
  grade: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence_score: number;
  reason_summary: string[];
  intervention_status: string;
}

export const RiskAlertList = () => {
  const [alerts, setAlerts] = useState<RiskProfile[]>([]);
  const [selectedRisk, setSelectedRisk] = useState<RiskProfile | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('/api/v1/analytics/dashboard/');
      setAlerts(res.data.at_risk);
    } catch (err) {
      toast.error('Failed to load risk alerts');
    }
  };

  const getRiskStyles = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
          <BrainCircuit className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">AI Early Warnings</h2>
          <p className="text-primary-200/40 text-sm font-medium">Students flagged for immediate intervention</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {alerts.map((risk) => (
          <div 
            key={risk.id}
            className="glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
          >
            {/* Confidence Bar */}
            <div 
              className="absolute top-0 left-0 h-1 bg-rose-500 transition-all duration-1000"
              style={{ width: `${risk.confidence_score * 100}%` }}
            ></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary-200/20">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-white">{risk.student_name}</h3>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${getRiskStyles(risk.risk_level)}`}>
                      {risk.risk_level}
                    </span>
                  </div>
                  <p className="text-sm text-primary-200/40 font-bold uppercase tracking-widest mt-1">{risk.grade}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 max-w-md">
                {risk.reason_summary.map((reason, i) => (
                  <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-white/40 border border-white/5">
                    {reason}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right mr-4">
                  <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">AI Confidence</p>
                  <p className="text-xl font-black text-white">{Math.round(risk.confidence_score * 100)}%</p>
                </div>
                <button 
                  onClick={() => setSelectedRisk(risk)}
                  className="px-6 py-3 bg-primary-500 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-primary-400 shadow-lg transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  Intervene
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Intervention Modal */}
      {selectedRisk && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
          <div className="glass w-full max-w-2xl rounded-[48px] border border-white/10 p-12 relative">
            <button 
              onClick={() => setSelectedRisk(null)}
              className="absolute top-8 right-8 text-white/40 hover:text-white"
            >
              Close
            </button>
            
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white">Log Intervention</h2>
                  <p className="text-primary-200/40 font-medium">For {selectedRisk.student_name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-primary-200/30 uppercase tracking-widest ml-4">Intervention Type</label>
                <div className="grid grid-cols-2 gap-4">
                  {['Parent Meeting', 'Remedial Class', 'Counseling', 'Warning Issued'].map(type => (
                    <button key={type} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-white font-bold hover:bg-primary-500/20 hover:border-primary-500/50 transition-all text-left">
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-primary-200/30 uppercase tracking-widest ml-4">Observation Notes</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white h-32 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="What was discussed or observed during the session?"
                />
              </div>

              <button className="w-full py-5 bg-emerald-500 text-white rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:bg-emerald-400 shadow-lg">
                Mark as Actioned
                <CheckCircle className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
