import { useState } from 'react';
import { Mail, Send, Phone, Users, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const CommunicationPage = () => {
  const [activeTab, setActiveTab] = useState<'email' | 'sms'>('email');
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    recipients: '', // Comma separated emails
    phones: '', // Comma separated phones
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      if (activeTab === 'email') {
        const emailList = formData.recipients.split(',').map(e => e.trim());
        await client.post('notifications/bulk_email/', {
          subject: formData.subject,
          message: formData.message,
          recipients: emailList
        });
        toast.success(`Email sent to ${emailList.length} recipients`);
      } else {
        const phoneList = formData.phones.split(',').map(p => p.trim());
        await client.post('notifications/bulk_sms/', {
          message: formData.message,
          phones: phoneList
        });
        toast.success(`SMS sent to ${phoneList.length} recipients`);
      }
      setFormData({ subject: '', message: '', recipients: '', phones: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">

      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Communication Center</h1>
        <p className="text-slate-400">Broadcast messages to parents, students, and staff via Email or SMS.</p>
      </div>

      <div className="flex gap-4 p-1.5 bg-slate-800/50 rounded-2xl w-fit border border-white/5">
        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'email' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4" />
          Bulk Email
        </button>
        <button
          onClick={() => setActiveTab('sms')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'sms' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Phone className="w-4 h-4" />
          Bulk SMS
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-dark p-8 rounded-3xl border border-white/5">
          <form onSubmit={handleSend} className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${activeTab === 'email' ? 'bg-blue-500/10' : 'bg-emerald-500/10'}`}>
                {activeTab === 'email' ? <Mail className="w-6 h-6 text-blue-400" /> : <Phone className="w-6 h-6 text-emerald-400" />}
              </div>
              <h2 className="text-xl font-bold text-white">Compose {activeTab === 'email' ? 'Email' : 'SMS'}</h2>
            </div>

            {activeTab === 'email' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Subject Line</label>
                <Input
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Enter email subject..."
                  className="bg-slate-800/50 border-slate-700 h-12"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">
                {activeTab === 'email' ? 'Recipients (Comma separated emails)' : 'Recipients (Comma separated phone numbers)'}
              </label>
              <textarea
                required
                value={activeTab === 'email' ? formData.recipients : formData.phones}
                onChange={(e) => setFormData({ ...formData, [activeTab === 'email' ? 'recipients' : 'phones']: e.target.value })}
                placeholder={activeTab === 'email' ? "parent1@gmail.com, parent2@gmail.com..." : "0712345678, 0722334455..."}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Message Content</label>
              <textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={activeTab === 'email' ? "Dear Parents, we would like to inform you..." : "School Notice: Reopening dates have been changed..."}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500 min-h-[200px] transition-all"
              />
              {activeTab === 'sms' && (
                <p className="text-[10px] text-slate-500 text-right">{formData.message.length} characters • {Math.ceil(formData.message.length / 160)} SMS units</p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={sending}
              className="w-full h-14 text-lg font-bold shadow-xl shadow-primary-900/20"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send {activeTab === 'email' ? 'Broadcast' : 'SMS'}
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="glass-dark p-6 rounded-3xl border border-white/5">
            <h3 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              Quick Select Groups
            </h3>
            <div className="space-y-3">
              <button className="w-full p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left group">
                <p className="text-sm font-bold text-white group-hover:text-primary-400">All Parents</p>
                <p className="text-[10px] text-slate-500">Approx. 450 contacts</p>
              </button>
              <button className="w-full p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left group">
                <p className="text-sm font-bold text-white group-hover:text-primary-400">Class Teachers</p>
                <p className="text-[10px] text-slate-500">12 staff members</p>
              </button>
              <button className="w-full p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left group">
                <p className="text-sm font-bold text-white group-hover:text-primary-400">Board of Management</p>
                <p className="text-[10px] text-slate-500">8 members</p>
              </button>
            </div>
          </div>

          <div className="glass-dark p-6 rounded-3xl border border-white/5 bg-primary-600/5">
            <h3 className="text-sm font-bold text-primary-400 uppercase mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Usage Statistics
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Monthly SMS Limit</span>
                  <span className="text-white font-bold">1,240 / 5,000</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500" style={{ width: '25%' }}></div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-[10px] text-amber-300/80">
                  You are using the standard email relay. Deliverability might be limited for high volume broadcasts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
