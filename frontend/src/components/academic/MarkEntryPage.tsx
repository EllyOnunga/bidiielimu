import { useState, useEffect } from 'react';
import { 
  Save, Search, AlertCircle, 
  CheckCircle, Loader2, Upload, 
  ChevronLeft, Keyboard, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StudentMark {
  id: string;
  student_name: string;
  admission_number: string;
  score: string;
  out_of: number;
}

export const MarkEntryPage = () => {
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      // Mock fetching marks for a specific class/subject
      // In prod: await axios.get(`/api/v1/exams/mark-entry/?class=${classId}&subject=${subjectId}`)
      const mockData: StudentMark[] = [
        { id: '1', student_name: 'John Kamau', admission_number: 'ADM-101', score: '85', out_of: 100 },
        { id: '2', student_name: 'Mary Atieno', admission_number: 'ADM-102', score: '92', out_of: 100 },
        { id: '3', student_name: 'David Omondi', admission_number: 'ADM-103', score: '78', out_of: 100 },
        { id: '4', student_name: 'Sarah Wambui', admission_number: 'ADM-104', score: '88', out_of: 100 },
      ];
      setMarks(mockData);
    } catch (_) {
      toast.error('Failed to load marks');
    }
  };

  const handleScoreChange = (id: string, newScore: string) => {
    setMarks(prev => prev.map(m => m.id === id ? { ...m, score: newScore } : m));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // await axios.post('/api/v1/exams/bulk-save-marks/', { marks });
      await new Promise(r => setTimeout(r, 1000)); // Simulating API
      toast.success('All marks saved successfully!');
    } catch (err) {
      toast.error('Failed to save some marks');
    } finally {
      setSaving(false);
    }
  };

  const filteredMarks = marks.filter(m => 
    m.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button className="p-3 bg-white/5 rounded-2xl border border-white/5 text-primary-200/40 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Bulk Mark Entry</h1>
            <p className="text-primary-200/40 font-bold uppercase tracking-widest mt-1">Mathematics • Form 4 North • Term 2</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-white/10 transition-all">
            <Upload className="w-5 h-5" />
            Import CSV
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-primary-500 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-primary-400 shadow-premium transition-all"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass p-4 rounded-[28px] border border-white/5 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-200/20" />
          <input 
            type="text" 
            placeholder="Search student or admission number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
          />
        </div>
        <div className="flex gap-2 p-2 bg-white/5 rounded-2xl border border-white/5">
          <button className="px-4 py-2 bg-primary-500 text-white rounded-xl text-xs font-black uppercase tracking-widest">Active</button>
          <button className="px-4 py-2 text-primary-200/40 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">Transferred</button>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/10">
          <Keyboard className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Auto-Advance Enabled</span>
        </div>
      </div>

      {/* Mark Grid */}
      <div className="glass rounded-[40px] border border-white/5 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="px-8 py-6 text-left text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Student Details</th>
              <th className="px-8 py-6 text-left text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Admission No</th>
              <th className="px-8 py-6 text-center text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Current Grade</th>
              <th className="px-8 py-6 text-center text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Marks Entry (/{marks[0]?.out_of})</th>
              <th className="px-8 py-6 text-center text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredMarks.map((m) => (
              <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary-400 font-black">
                      {m.student_name.charAt(0)}
                    </div>
                    <span className="text-white font-bold">{m.student_name}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-primary-200/30 font-black text-xs">{m.admission_number}</span>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                    parseInt(m.score) > 80 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary-500/10 text-primary-400'
                  }`}>
                    {parseInt(m.score) > 80 ? 'A' : 'B+'}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex justify-center">
                    <input 
                      type="number"
                      value={m.score}
                      onChange={(e) => handleScoreChange(m.id, e.target.value)}
                      className="w-24 bg-white/5 border border-white/10 rounded-xl py-3 text-center text-white font-black text-lg focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all outline-none"
                    />
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  {parseInt(m.score) > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                      <CheckCircle className="w-4 h-4" />
                      Recorded
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-rose-400 text-[10px] font-black uppercase tracking-widest">
                      <AlertCircle className="w-4 h-4" />
                      Pending
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center px-10 py-6 bg-primary-500/5 border border-primary-500/10 rounded-[32px]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/20 flex items-center justify-center text-primary-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Batch Summary</p>
            <p className="text-primary-200/40 text-xs">{filteredMarks.length} students loaded. Average: 85.7%</p>
          </div>
        </div>
        <button className="flex items-center gap-2 text-white/40 hover:text-white transition-all text-xs font-black uppercase tracking-widest">
          <Download className="w-4 h-4" />
          Export Provisional Sheet
        </button>
      </div>
    </div>
  );
};
