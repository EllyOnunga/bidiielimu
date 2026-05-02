import { useState } from 'react';
import { 
  Box, Search, Plus, 
  AlertTriangle, ArrowDownLeft,
  BookOpen, Pencil, Truck,
  MoreHorizontal
} from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  category: 'STATIONERY' | 'LAB' | 'LIBRARY' | 'GENERAL';
  quantity: number;
  unit: string;
  min_threshold: number;
  last_restock: string;
}

export const InventoryManager = () => {
  const [stock] = useState<StockItem[]>([
    { id: '1', name: 'Exercise Books (A4)', category: 'STATIONERY', quantity: 1240, unit: 'PCS', min_threshold: 500, last_restock: '2024-04-15' },
    { id: '2', name: 'Microscope Slides', category: 'LAB', quantity: 45, unit: 'BOX', min_threshold: 10, last_restock: '2024-03-20' },
    { id: '3', name: 'Textbook: Grade 4 Math', category: 'LIBRARY', quantity: 120, unit: 'PCS', min_threshold: 150, last_restock: '2023-12-10' },
    { id: '4', name: 'Chalk (White)', category: 'GENERAL', quantity: 24, unit: 'BOX', min_threshold: 50, last_restock: '2024-04-28' },
  ]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Inventory & Stock</h1>
          <p className="text-primary-200/40 font-bold uppercase tracking-widest mt-1">Resource & Supply Management</p>
        </div>
        
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-white/10 transition-all">
            <Truck className="w-5 h-5" />
            New Procurement
          </button>
          <button className="px-8 py-3 bg-primary-500 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-primary-400 shadow-premium transition-all">
            <Plus className="w-6 h-6" />
            Add Item
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Categories', value: '12', icon: Box, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Low Stock Alerts', value: '4', icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'Library Collection', value: '8.4K', icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Procured (Month)', value: 'KES 142K', icon: ArrowDownLeft, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map((kpi, i) => (
          <div key={i} className="glass p-8 rounded-[40px] border border-white/5 space-y-4">
            <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className="text-3xl font-black text-white tracking-tighter">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="glass p-4 rounded-[28px] border border-white/5 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-200/20" />
          <input 
            type="text" 
            placeholder="Search items by name or SKU..."
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
          />
        </div>
        <div className="flex gap-2 p-2 bg-white/5 rounded-2xl border border-white/5">
          {['All', 'Stationery', 'Library', 'Lab'].map((tab) => (
            <button key={tab} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'All' ? 'bg-primary-500 text-white shadow-premium' : 'text-primary-200/40 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table */}
      <div className="glass rounded-[40px] border border-white/5 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="px-8 py-6 text-left text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Resource Name</th>
              <th className="px-8 py-6 text-left text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Category</th>
              <th className="px-8 py-6 text-center text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Current Stock</th>
              <th className="px-8 py-6 text-center text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Health</th>
              <th className="px-8 py-6 text-right text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Last Restock</th>
              <th className="px-8 py-6 text-center text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((item) => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-all">
                      {item.category === 'LIBRARY' ? <BookOpen size={20} /> : <Pencil size={20} />}
                    </div>
                    <span className="text-white font-bold">{item.name}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-primary-200/30 font-black text-xs uppercase tracking-widest">{item.category}</span>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className="text-lg font-black text-white">{item.quantity.toLocaleString()} {item.unit}</span>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {item.quantity < item.min_threshold ? (
                      <span className="px-3 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2">
                        <AlertTriangle size={12} />
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg">Optimal</span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <span className="text-xs text-primary-200/40 font-bold">{item.last_restock}</span>
                </td>
                <td className="px-8 py-6 text-center">
                  <button className="p-2 text-primary-200/20 hover:text-white transition-all">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
