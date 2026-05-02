import { useState } from 'react';
import { ShoppingBag, Send, X, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const ProcurementForm = ({ onClose }: { onClose: () => void }) => {
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: 1,
    estimated_unit_cost: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('/api/v1/inventory/procurement/', formData);
      toast.success('Procurement request submitted!');
      onClose();
    } catch (err) {
      toast.error('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
      <div className="glass w-full max-w-2xl rounded-[48px] border border-white/10 overflow-hidden shadow-2xl relative">
        <div className="p-12">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">New Request</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/40"><X /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-primary-200/30 uppercase tracking-widest ml-4">Item Name</label>
                <input 
                  required
                  type="text"
                  value={formData.item_name}
                  onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="e.g. Dell Latitude 5420"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-primary-200/30 uppercase tracking-widest ml-4">Quantity</label>
                <input 
                  required
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-primary-200/30 uppercase tracking-widest ml-4">Estimated Unit Cost (KES)</label>
              <input 
                required
                type="number"
                value={formData.estimated_unit_cost}
                onChange={(e) => setFormData({...formData, estimated_unit_cost: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="50000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-primary-200/30 uppercase tracking-widest ml-4">Justification / Reason</label>
              <textarea 
                required
                rows={4}
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                placeholder="Explain why this item is needed..."
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-primary-500/10 rounded-2xl border border-primary-500/20 text-primary-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>Your request will be sent to the school accountant and principal for approval.</p>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 bg-primary-500 text-white rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:bg-primary-400 transition-all shadow-premium disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Send Request'}
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
