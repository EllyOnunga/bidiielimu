import { useState, useEffect } from 'react';
import { Package, Search, Plus, Filter, MoreVertical, QrCode, Wrench, MapPin } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Asset {
  id: string;
  name: string;
  category_name: string;
  barcode_id: string;
  status: 'AVAILABLE' | 'CHECKED_OUT' | 'MAINTENANCE' | 'REPAIR' | 'RETIRED';
  location: string;
  purchase_cost: string;
  current_value: number;
}

export const AssetList = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await axios.get('/api/v1/inventory/assets/');
      setAssets(res.data);
    } catch (err) {
      toast.error('Failed to load assets');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-500/10 text-emerald-400';
      case 'CHECKED_OUT': return 'bg-blue-500/10 text-blue-400';
      case 'MAINTENANCE': return 'bg-amber-500/10 text-amber-400';
      case 'REPAIR': return 'bg-rose-500/10 text-rose-400';
      default: return 'bg-white/5 text-white/40';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Inventory</h1>
          <p className="text-primary-200/50 mt-2 font-medium">Track and manage school assets & equipment</p>
        </div>
        <button className="px-6 py-3 bg-primary-500 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-primary-400 transition-all shadow-premium">
          <Plus className="w-5 h-5" />
          Add Asset
        </button>
      </div>

      {/* Filters & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-primary-200/30 uppercase tracking-widest">Total Assets</p>
              <p className="text-2xl font-black text-white mt-1">{assets.length}</p>
            </div>
          </div>
        </div>
        {/* ... More Stats can go here */}
      </div>

      {/* Asset Table */}
      <div className="glass rounded-[32px] border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-200/30" />
            <input 
              type="text"
              placeholder="Search by name, category or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="p-3 bg-white/5 text-white/60 rounded-xl hover:bg-white/10 transition-all">
              <Filter className="w-5 h-5" />
            </button>
            <button className="p-3 bg-white/5 text-white/60 rounded-xl hover:bg-white/10 transition-all">
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-primary-200/30 uppercase text-[10px] font-black tracking-widest">
                <th className="px-8 py-6">Asset Details</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6">Location</th>
                <th className="px-8 py-6">Current Value</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {assets.map(asset => (
                <tr key={asset.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold">{asset.name}</p>
                        <p className="text-xs text-primary-200/30 mt-0.5">{asset.category_name} • {asset.barcode_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(asset.status)}`}>
                      {asset.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-primary-200/60">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{asset.location}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-mono font-bold text-emerald-400">KES {asset.current_value.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 hover:bg-primary-500/20 rounded-lg text-primary-400 transition-all">
                        <Wrench className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
