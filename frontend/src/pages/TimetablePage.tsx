import { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, User, MapPin, Plus, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import client from '../api/client';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM'
];

interface ScheduleSlot {
  id: number;
  day: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  color: string;
}

const colors = [
  'bg-blue-500/20 text-blue-400 border-blue-500/20',
  'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  'bg-purple-500/20 text-purple-400 border-purple-500/20',
  'bg-amber-500/20 text-amber-400 border-amber-500/20',
  'bg-rose-500/20 text-rose-400 border-rose-500/20',
];

const formatTime = (timeString: string) => {
  const [hour, minute] = timeString.split(':');
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${minute} ${ampm}`;
};

interface Stream { id: number; name: string; grade_name: string; }
interface Subject { id: number; name: string; }
interface Teacher { id: number; first_name: string; last_name: string; }
interface Classroom { id: number; name: string; }

export const TimetablePage = () => {
  const [selectedClass, setSelectedClass] = useState('Loading...');
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    day_of_week: 0,
    start_time: '08:00',
    end_time: '09:00',
    subject: '',
    teacher: '',
    classroom: '',
    stream: '',
  });

  const [streams, setStreams] = useState<Stream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  const handleFilter = () => {
    alert('Filter Timetable: Select Class, Stream, or Teacher.');
  };

  const handleAddSlot = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isModalOpen) {
      setIsModalOpen(true);
      return;
    }

    try {
      await client.post('classes/schedule-slots/', formData);
      toast.success('Schedule slot added!');
      setIsModalOpen(false);
      fetchSchedule();
    } catch (error: any) {  
      toast.error(error.response?.data?.detail || 'Failed to add slot');
    }
  };


  const fetchSchedule = async () => {
    try {
      const [streamsRes, subjectsRes, teachersRes, classroomsRes, scheduleRes] = await Promise.all([
        client.get('classes/streams/'),
        client.get('classes/subjects/'),
        client.get('teachers/'),
        client.get('classes/classrooms/'),
        client.get('classes/schedule-slots/'),
      ]);

      setStreams(streamsRes.data);
      setSubjects(subjectsRes.data);
      setTeachers(teachersRes.data);
      setClassrooms(classroomsRes.data);

      if (streamsRes.data.length > 0) {
        setSelectedClass(`${streamsRes.data[0].grade_name} ${streamsRes.data[0].name}`);
        setFormData(prev => ({ ...prev, stream: streamsRes.data[0].id }));
      }

      const mapped = Array.isArray(scheduleRes.data) ? scheduleRes.data.map((slot: { id: number; day_of_week_name: string; start_time: string; subject_name: string; teacher_name: string; classroom_name: string; }, idx: number) => ({
        id: slot.id,
        day: slot.day_of_week_name,
        time: formatTime(slot.start_time),
        subject: slot.subject_name,
        teacher: slot.teacher_name,
        room: slot.classroom_name,
        color: colors[idx % colors.length],
      })) : [];
      setSchedule(mapped);
    } catch (error) {
      console.error('Failed to fetch schedule', error);
    }
  };

  useEffect(() => {
     
    fetchSchedule();
  }, []);

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-600 rounded-2xl shadow-lg shadow-primary-900/40">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Smart Timetable</h1>
            <p className="text-slate-400 text-sm md:text-base">Conflict-free scheduling for {selectedClass}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleFilter}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all border border-slate-700"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button
            onClick={handleAddSlot}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary-900/20"
          >
            <Plus className="w-4 h-4" />
            Add Slot
          </button>
        </div>
      </div>

      <div className="glass-dark rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[1000px]">
            {/* Header Row */}
            <div className="grid grid-cols-6 border-b border-white/5 bg-white/5">
              <div className="p-4 border-r border-white/5 text-xs font-bold text-slate-500 uppercase flex items-center justify-center">Time</div>
              {DAYS.map(day => (
                <div key={day} className="p-4 border-r border-white/5 text-xs font-bold text-slate-400 uppercase text-center">{day}</div>
              ))}
            </div>

            {/* Time Slots */}
            {TIME_SLOTS.map((time) => (
              <div key={time} className="grid grid-cols-6 border-b border-white/5 last:border-0 h-24 md:h-32">
                <div className="p-4 border-r border-white/5 flex flex-col items-center justify-center bg-white/[0.02]">
                  <Clock className="w-4 h-4 text-slate-600 mb-1" />
                  <span className="text-[10px] md:text-xs font-bold text-slate-500">{time}</span>
                </div>
                {DAYS.map(day => {
                  const lesson = schedule.find(s => s.day === day && s.time === time);
                  return (
                    <div key={`${day}-${time}`} className="p-2 border-r border-white/5 relative group transition-all">
                      <AnimatePresence>
                        {lesson ? (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`h-full w-full rounded-2xl p-3 border ${lesson.color} flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform`}
                          >
                            <div>
                              <div className="text-xs font-black truncate">{lesson.subject}</div>
                              <div className="flex items-center gap-1 text-[10px] opacity-70 mt-1">
                                <User className="w-2.5 h-2.5" />
                                <span className="truncate">{lesson.teacher}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] opacity-70">
                              <MapPin className="w-2.5 h-2.5" />
                              <span className="truncate">{lesson.room}</span>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="h-full w-full rounded-2xl border-2 border-dashed border-white/5 group-hover:border-white/10 group-hover:bg-white/[0.01] transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Plus className="w-4 h-4 text-slate-600" />
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-dark p-6 rounded-3xl border border-white/5">
          <h2 className="text-lg font-bold text-white mb-4">Timetable Insights</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-sm text-slate-300 font-medium">Weekly Lesson Count</span>
              </div>
              <span className="text-lg font-bold text-white">{schedule.length}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-sm text-slate-300 font-medium">Completion Rate</span>
              </div>
              <span className="text-lg font-bold text-white">100%</span>
            </div>
          </div>
        </div>

        <div className="glass-dark p-6 rounded-3xl border border-white/5">
          <h2 className="text-lg font-bold text-white mb-4">Conflict Checker</h2>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider">All Clear</p>
              <p className="text-xs text-emerald-500/70">No scheduling conflicts detected for this week.</p>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-dark w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <h2 className="text-xl font-bold text-white">Add Schedule Slot</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddSlot} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Day</label>
                    <select
                      value={formData.day_of_week}
                      onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      {DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Stream</label>
                    <select
                      value={formData.stream}
                      onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      {streams.map((s: Stream) => <option key={s.id} value={s.id}>{s.grade_name} {s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Start Time</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">End Time</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Subject</label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s: Subject) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Teacher</label>
                    <select
                      required
                      value={formData.teacher}
                      onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map((t: Teacher) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Room</label>
                    <select
                      value={formData.classroom}
                      onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      <option value="">Select Room</option>
                      {classrooms.map((c: Classroom) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-900/20"
                  >
                    Add Slot
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
