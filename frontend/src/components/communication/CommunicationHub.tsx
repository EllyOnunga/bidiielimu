import { useState, useEffect } from 'react';
import { 
  Send, Calendar, Megaphone, 
  Clock, MapPin, Plus,
  MessageSquare, Loader2, Sparkles
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const CommunicationHub = () => {
  const [activeTab, setActiveTab] = useState<'notices' | 'sms' | 'calendar'>('notices');
  const [notices, setNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [smsMessage, setSmsMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [noticeRes, eventRes] = await Promise.all([
        axios.get('/api/v1/notifications/notices/'),
        axios.get('/api/v1/notifications/events/')
      ]);
      setNotices(noticeRes.data);
      setEvents(eventRes.data);
    } catch (err) {
      toast.error('Failed to load communication data');
    }
  };

  const handleSendSMS = async () => {
    if (!smsMessage) return toast.error('Please enter a message');
    setIsSending(true);
    try {
      await axios.post('/api/v1/notifications/notices/broadcast_sms/', { message: smsMessage });
      toast.success('Mass SMS Broadcast initiated!');
      setSmsMessage('');
    } catch (err) {
      toast.error('SMS Broadcast failed');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Communication Hub</h1>
          <p className="text-primary-200/40 font-bold uppercase tracking-widest mt-1">Manage school-wide broadcasts</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          {(['notices', 'calendar', 'sms'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                ? 'bg-primary-500 text-white shadow-premium' 
                : 'text-primary-200/40 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'notices' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <Megaphone className="w-5 h-5 text-indigo-400" />
                  Recent Notices
                </h3>
                <button className="p-2 bg-white/5 rounded-lg border border-white/10 text-white hover:bg-white/10 transition-all">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {notices.map((notice) => (
                  <div key={notice.id} className="glass p-8 rounded-[32px] border border-white/5 hover:border-white/10 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                        {notice.target_audience}
                      </span>
                      <p className="text-[10px] font-black text-primary-200/20 uppercase tracking-widest">
                        {new Date(notice.published_at).toLocaleDateString()}
                      </p>
                    </div>
                    <h4 className="text-xl font-black text-white mb-2">{notice.title}</h4>
                    <p className="text-primary-200/60 leading-relaxed">{notice.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="glass rounded-[48px] border border-white/5 overflow-hidden p-10">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-white flex items-center gap-4">
                  <Calendar className="w-6 h-6 text-primary-400" />
                  School Calendar
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {events.map((event) => (
                  <div key={event.id} className="flex gap-8 group">
                    <div className="w-20 text-center">
                      <p className="text-2xl font-black text-white tracking-tighter">
                        {new Date(event.start_date).getDate()}
                      </p>
                      <p className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest">
                        {new Date(event.start_date).toLocaleString('default', { month: 'short' })}
                      </p>
                    </div>
                    <div className="flex-1 bg-white/[0.02] border border-white/5 p-6 rounded-[24px] group-hover:bg-white/[0.04] transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-black text-white">{event.title}</h4>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary-200/30">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary-200/30">
                              <MapPin className="w-3.5 h-3.5" />
                              {event.location || 'School Campus'}
                            </span>
                          </div>
                        </div>
                        {event.is_holiday && (
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg">Holiday</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sms' && (
            <div className="glass p-12 rounded-[48px] border border-white/10 space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Send className="w-64 h-64 text-white" />
              </div>
              <div className="relative">
                <h3 className="text-3xl font-black text-white">Mass SMS Broadcast</h3>
                <p className="text-primary-200/40 font-medium mt-2">Direct alerts to all registered parent phone numbers</p>
              </div>

              <div className="space-y-4 relative">
                <div className="flex justify-between items-center px-4">
                  <label className="text-xs font-black text-primary-200/30 uppercase tracking-widest">Message Composer</label>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${smsMessage.length > 160 ? 'text-rose-500' : 'text-primary-200/40'}`}>
                    {smsMessage.length} / 160 CHARS
                  </span>
                </div>
                <textarea 
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder="Type your broadcast message here..."
                  className="w-full h-48 bg-white/5 border border-white/10 rounded-[32px] p-8 text-white text-lg focus:ring-4 focus:ring-primary-500/20 transition-all outline-none resize-none shadow-inner"
                />
              </div>

              <div className="bg-primary-500/5 border border-primary-500/10 p-6 rounded-3xl flex items-start gap-4">
                <Sparkles className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                <p className="text-xs text-primary-200/60 leading-relaxed italic">
                  Note: This message will be sent to approximately 450 guardians. Ensure information is accurate as SMS cannot be unsent.
                </p>
              </div>

              <button 
                onClick={handleSendSMS}
                disabled={isSending || !smsMessage}
                className="w-full py-5 bg-primary-500 text-white rounded-[24px] font-black text-xl flex items-center justify-center gap-3 hover:bg-primary-400 shadow-premium transition-all transform hover:scale-[1.01] disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                {isSending ? 'Broadcasting...' : 'Broadcast to All Parents'}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar / Stats */}
        <div className="space-y-8">
          <div className="glass p-8 rounded-[40px] border border-white/5 space-y-6">
            <h4 className="text-sm font-black text-white/40 uppercase tracking-widest">Broadcast Stats</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-primary-200/60">Total Guardians</p>
                <p className="text-lg font-black text-white">452</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-primary-200/60">SMS Success Rate</p>
                <p className="text-lg font-black text-emerald-400">98.2%</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-primary-200/60">Active Notices</p>
                <p className="text-lg font-black text-white">12</p>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-[40px] border border-white/5 space-y-6">
            <h4 className="text-sm font-black text-white/40 uppercase tracking-widest">Upcoming Meetings</h4>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-primary-200 group-hover:bg-primary-500 transition-all">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">PTM: Form 4 North</p>
                    <p className="text-[10px] font-bold text-primary-200/20">TOMORROW • 14:00</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all">
              Manage PTMs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
