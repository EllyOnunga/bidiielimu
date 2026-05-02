import { useState } from 'react';
import { QrCode, X, CheckCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const AssetScanner = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState<'SCAN' | 'PROCESS' | 'SUCCESS'>('SCAN');
  const [assetDetails, setAssetDetails] = useState<any>(null);

  const handleScan = async (scannedToken: string) => {
    setStep('PROCESS');
    try {
      // Logic to fetch asset details based on token/barcode
      const res = await axios.get(`/api/v1/inventory/assets/?barcode_id=${scannedToken}`);
      if (res.data.length > 0) {
        setAssetDetails(res.data[0]);
      } else {
        toast.error('Asset not found');
        setStep('SCAN');
      }
    } catch (err) {
      toast.error('Scanning failed');
      setStep('SCAN');
    }
  };

  const handleAction = async (action: 'checkout' | 'checkin') => {
    try {
      if (action === 'checkout') {
        await axios.post(`/api/v1/inventory/assets/${assetDetails.id}/checkout/`, {
          user_id: 'current_user_id', // Would come from auth context
          expected_return_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      } else {
        await axios.post(`/api/v1/inventory/assets/${assetDetails.id}/checkin/`, {
          condition: 'Good'
        });
      }
      setStep('SUCCESS');
      toast.success(`${action === 'checkout' ? 'Checked out' : 'Checked in'} successfully!`);
    } catch (err) {
      toast.error('Action failed');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
      <div className="glass w-full max-w-xl rounded-[48px] border border-white/10 overflow-hidden shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-full text-white/40 transition-all z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-12">
          {step === 'SCAN' && (
            <div className="text-center space-y-8">
              <div className="w-32 h-32 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto text-primary-400 relative">
                <QrCode className="w-16 h-16" />
                <div className="absolute inset-0 border-2 border-primary-500 border-dashed rounded-full animate-spin-slow"></div>
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">Scan Asset QR</h2>
                <p className="text-primary-200/40 mt-2 font-medium italic">Point your camera at the asset tag</p>
              </div>
              <div className="flex flex-col gap-4">
                <input 
                  type="text" 
                  placeholder="Or enter Barcode manually..."
                  className="bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleScan((e.target as HTMLInputElement).value)}
                />
              </div>
            </div>
          )}

          {step === 'PROCESS' && assetDetails && (
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-primary-400">
                  <QrCode className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">{assetDetails.name}</h3>
                  <p className="text-primary-400 font-bold uppercase tracking-widest text-xs mt-1">{assetDetails.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Serial No</p>
                  <p className="text-white font-bold mt-1">{assetDetails.serial_number || 'N/A'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">Location</p>
                  <p className="text-white font-bold mt-1">{assetDetails.location}</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                {assetDetails.status === 'AVAILABLE' ? (
                  <button 
                    onClick={() => handleAction('checkout')}
                    className="flex-1 py-4 bg-primary-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-400 shadow-premium"
                  >
                    Check Out <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={() => handleAction('checkin')}
                    className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-400 shadow-lg"
                  >
                    Check In <CheckCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center space-y-8 py-8">
              <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle className="w-20 h-20" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">All Set!</h2>
                <p className="text-primary-200/40 mt-2 font-medium">The asset status has been updated.</p>
              </div>
              <button 
                onClick={onClose}
                className="w-full py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
