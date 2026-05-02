import { useState, useEffect } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, ZAxis 
} from 'recharts';
import { Target, Info, Download, BookOpen } from 'lucide-react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const AttendanceCorrelationChart = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/v1/analytics/correlation/');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load correlation data');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    const element = document.getElementById('correlation-report');
    if (!element) return;
    
    const canvas = await html2canvas(element, { backgroundColor: '#020617' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('Principal_Correlation_Report.pdf');
  };

  if (loading) return <div className="p-10 text-white font-bold">Correlating records...</div>;

  return (
    <div id="correlation-report" className="space-y-8 p-1">
      <div className="glass p-10 rounded-[48px] border border-white/5 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-primary-400" />
              <h3 className="text-2xl font-black text-white">Attendance vs. Performance</h3>
            </div>
            <p className="text-primary-200/40 text-sm mt-1">Correlation: <span className="text-white font-black">r = {data.correlation}</span></p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-4 max-w-sm">
              <Info className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-[10px] font-bold text-emerald-200/80 leading-relaxed">{data.insight}</p>
            </div>
            <button 
              onClick={exportPDF}
              className="px-6 py-4 bg-primary-500 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-primary-400 shadow-premium shrink-0"
            >
              <Download className="w-5 h-5" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Scatter Chart */}
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                type="number" 
                dataKey="attendance" 
                name="Attendance" 
                unit="%" 
                stroke="#ffffff20"
                fontSize={10}
                fontWeight={900}
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                type="number" 
                dataKey="performance" 
                name="Performance" 
                unit="%" 
                stroke="#ffffff20"
                fontSize={10}
                fontWeight={900}
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
              />
              <ZAxis type="number" range={[100, 100]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid #ffffff10',
                  borderRadius: '16px',
                  padding: '12px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                }}
                itemStyle={{ color: '#fff', fontWeight: 900 }}
              />
              <Scatter 
                name="Students" 
                data={data.data} 
                fill="#6366f1"
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Correlation Table */}
      <div className="glass p-10 rounded-[48px] border border-white/5 overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-6 h-6 text-primary-400" />
          <h3 className="text-2xl font-black text-white">Subject-Specific Correlation</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-primary-200/30 uppercase text-[10px] font-black tracking-widest border-b border-white/5">
                <th className="px-8 py-6">Subject</th>
                <th className="px-8 py-6">Correlation (r)</th>
                <th className="px-8 py-6">Sensitivity</th>
                <th className="px-8 py-6 text-right">Data Points</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {data.subject_correlations.map((row: any, i: number) => (
                <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02] transition-all group">
                  <td className="px-8 py-6 font-bold">{row.subject}</td>
                  <td className="px-8 py-6 font-mono text-primary-400">{row.correlation}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      row.correlation > 0.6 ? 'bg-rose-500/10 text-rose-400' : 
                      row.correlation > 0.3 ? 'bg-amber-500/10 text-amber-400' : 
                      'bg-white/5 text-white/40'
                    }`}>
                      {row.correlation > 0.6 ? 'Critical' : row.correlation > 0.3 ? 'Moderate' : 'Low'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right text-primary-200/40 font-bold">{row.data_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

