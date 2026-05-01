import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Save, ChevronLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import client from '../api/client';

interface StudentData {
  id: number;
  name: string;
  admission: string;
  status: string;
}

export const AttendanceMarkingPage = () => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('Grade 4 - West');
  const updateStatus = (id: number, status: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const fetchStudents = async () => {
    try {
      const response = await client.get('students/');
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      const mapped = data.map((s: any) => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        admission: s.admission_number,
        status: 'PRESENT'
      }));
      setStudents(mapped);
    } catch (error) {
      console.error('Failed to fetch students', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStudents();
  }, []);

  const handleSave = () => {
    toast.success('Attendance saved successfully!');
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link to="/attendance" className="p-2 hover:bg-slate-800 rounded-xl transition-all">
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Mark Attendance</h1>
          <p className="text-slate-400 text-sm md:text-base">Recording attendance for {selectedClass}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="glass-dark p-5 md:p-6 rounded-3xl border border-white/5 space-y-3 md:space-y-4">
          <label className="block text-xs md:text-sm font-medium text-slate-400">Class/Stream</label>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 md:py-3 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option>Grade 4 - West</option>
            <option>Grade 4 - East</option>
            <option>Grade 5 - North</option>
          </select>
        </div>

        <div className="glass-dark p-5 md:p-6 rounded-3xl border border-white/5 space-y-3 md:space-y-4">
          <label className="block text-xs md:text-sm font-medium text-slate-400">Date</label>
          <input 
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 md:py-3 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="glass-dark p-5 md:p-6 rounded-3xl border border-white/5 flex items-end sm:col-span-2 lg:col-span-1">
          <button 
            onClick={handleSave}
            className="w-full py-2.5 md:py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm md:text-base"
          >
            <Save className="w-5 h-5" />
            Save Attendance
          </button>
        </div>
      </div>

      <div className="glass-dark rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-white/5 bg-white/5">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              placeholder="Filter students by name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 md:px-8 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Student Details</th>
                <th className="px-6 md:px-8 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-slate-500">Loading students...</td>
                </tr>
              ) : (
                students.map((student, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={student.id} 
                    className="hover:bg-white/[0.02] transition-all"
                  >
                    <td className="px-6 md:px-8 py-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-800 flex items-center justify-center text-[10px] md:text-xs font-bold text-slate-400 border border-white/5 shrink-0">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{student.name}</p>
                          <p className="text-xs text-slate-500 truncate">{student.admission}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 md:px-8 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <StatusButton 
                          active={student.status === 'PRESENT'} 
                          onClick={() => updateStatus(student.id, 'PRESENT')}
                          icon={Check}
                          label="Present"
                          color="green"
                        />
                        <StatusButton 
                          active={student.status === 'ABSENT'} 
                          onClick={() => updateStatus(student.id, 'ABSENT')}
                          icon={X}
                          label="Absent"
                          color="red"
                        />
                        <StatusButton 
                          active={student.status === 'LATE'} 
                          onClick={() => updateStatus(student.id, 'LATE')}
                          icon={Clock}
                          label="Late"
                          color="yellow"
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface StatusButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  color: 'green' | 'red' | 'yellow';
}

const StatusButton = ({ active, onClick, icon: Icon, label, color }: StatusButtonProps) => {
  const colors = {
    green: active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-500 hover:bg-slate-700',
    red: active ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800 text-slate-500 hover:bg-slate-700',
    yellow: active ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-800 text-slate-500 hover:bg-slate-700',
  };

  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${colors[color]}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
};
