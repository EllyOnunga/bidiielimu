import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classesService } from "../api/services/classesService";
import { teachersService } from "../api/services/teachersService";
import {
  Clock,
  BookOpen,
  User,
  MapPin,
  Plus,
  Filter,
  X,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
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
  "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-blue-500/10",
  "bg-emerald-600/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10",
  "bg-purple-600/10 text-purple-400 border-purple-500/20 shadow-purple-500/10",
  "bg-amber-600/10 text-amber-400 border-amber-500/20 shadow-amber-500/10",
  "bg-rose-600/10 text-rose-400 border-rose-500/20 shadow-rose-500/10",
];

const formatTime = (timeString: string) => {
  const [hour, minute] = timeString.split(":");
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, "0")}:${minute} ${ampm}`;
};

interface Stream {
  id: number;
  name: string;
  grade_name: string;
}
interface Subject {
  id: number;
  name: string;
}
interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
}
interface Classroom {
  id: number;
  name: string;
}

export const TimetablePage = () => {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState("Loading...");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    day_of_week: 0,
    start_time: "08:00",
    end_time: "09:00",
    subject: "",
    teacher: "",
    classroom: "",
    stream: "",
  });

  const { data: streams = [] } = useQuery<Stream[]>({
    queryKey: ["streams"],
    queryFn: classesService.getStreams,
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: () => classesService.getSubjects(),
  });

  const { data: teachersData } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => teachersService.getAll(),
  });
  const teachers: Teacher[] = Array.isArray(teachersData) ? teachersData : (teachersData as any)?.results || [];

  const { data: classrooms = [] } = useQuery<Classroom[]>({
    queryKey: ["classrooms"],
    queryFn: classesService.getClassrooms,
  });

  const { data: scheduleData } = useQuery({
    queryKey: ["schedule-slots"],
    queryFn: classesService.getScheduleSlots,
  });

  const schedule: ScheduleSlot[] = useMemo(() => {
    const data = Array.isArray(scheduleData) ? scheduleData : (scheduleData as any)?.results || [];
    return data.map((slot: any, idx: number) => ({
      id: slot.id,
      day: slot.day_of_week_name,
      time: formatTime(slot.start_time),
      subject: slot.subject_name,
      teacher: slot.teacher_name,
      room: slot.classroom_name,
      color: colors[idx % colors.length],
    }));
  }, [scheduleData]);

  useEffect(() => {
    if (streams.length > 0 && selectedClass === "Loading...") {
      setSelectedClass(`${streams[0].grade_name} ${streams[0].name}`);
      setFormData((prev) => ({ ...prev, stream: streams[0].id.toString() }));
    }
  }, [streams, selectedClass]);

  const addSlotMutation = useMutation({
    mutationFn: (data: any) => classesService.createScheduleSlot(data),
    onSuccess: () => {
      toast.success("Operational slot synchronized");
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["schedule-slots"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Node synchronization failed");
    },
  });

  const handleAddSlot = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isModalOpen) {
      setIsModalOpen(true);
      return;
    }
    addSlotMutation.mutate(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-20"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-none">
            Smart <span className="text-gradient">Timetable</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm md:text-base font-medium max-w-xl">
            Conflict-free spectral scheduling and operational grid management
            for {selectedClass}.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Button
            variant="ghost"
            className="flex-1 lg:flex-none h-14 px-8 rounded-2xl"
          >
            <Filter className="w-5 h-5 mr-2" /> Filter Grid
          </Button>
          <Button
            onClick={handleAddSlot}
            className="flex-1 lg:flex-none h-14 px-8 rounded-2xl gap-2"
          >
            <Plus className="w-5 h-5" /> Initialize Slot
          </Button>
        </div>
      </div>

      <div className="premium-card !p-0 overflow-hidden border-white/5">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[1200px]">
            <div className="grid grid-cols-6 bg-white/[0.02] border-b border-white/5">
              <div className="p-6 border-r border-white/5 text-[10px] font-black text-muted uppercase tracking-[0.3em] flex items-center justify-center bg-white/[0.01]">
                Temporal Axis
              </div>
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="p-6 border-r border-white/5 text-[10px] font-black text-primary uppercase tracking-[0.3em] text-center"
                >
                  {day}
                </div>
              ))}
            </div>

            {TIME_SLOTS.map((time) => (
              <div
                key={time}
                className="grid grid-cols-6 border-b border-white/5 last:border-0 h-32 md:h-40"
              >
                <div className="p-6 border-r border-white/5 flex flex-col items-center justify-center bg-white/[0.03]">
                  <Clock className="w-5 h-5 text-primary-400/50 mb-2" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                    {time}
                  </span>
                </div>
                {DAYS.map((day) => {
                  const lesson = schedule.find(
                    (s) => s.day === day && s.time === time,
                  );
                  return (
                    <div
                      key={`${day}-${time}`}
                      className="p-3 border-r border-white/5 relative group transition-all"
                    >
                      <AnimatePresence>
                        {lesson ? (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ y: -3, scale: 1.02 }}
                            className={`h-full w-full rounded-[24px] p-5 border ${lesson.color} flex flex-col justify-between cursor-pointer transition-all duration-500 shadow-glow-sm`}
                          >
                            <div>
                              <div className="text-sm font-black text-primary uppercase tracking-tight leading-none mb-2 truncate">
                                {lesson.subject}
                              </div>
                              <div className="flex items-center gap-2 text-[9px] font-black text-muted uppercase tracking-widest opacity-70">
                                <User className="w-3 h-3" />
                                <span className="truncate">
                                  {lesson.teacher}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-black text-muted uppercase tracking-widest opacity-70">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{lesson.room}</span>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="h-full w-full rounded-[24px] border-2 border-dashed border-white/5 group-hover:border-primary-500/30 group-hover:bg-primary-500/5 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Plus className="w-6 h-6 text-primary-500/20" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="premium-card p-8 group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-[80px] -mr-16 -mt-16 group-hover:bg-primary-500/20 transition-all duration-700" />
          <h2 className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em] mb-8">
            Operational Metrics
          </h2>
          <div className="space-y-4 relative z-10">
            <MetricRow
              icon={BookOpen}
              label="Total Weekly Sessions"
              value={schedule.length}
              color="blue"
            />
            <MetricRow
              icon={Clock}
              label="Grid Utilization"
              value="94%"
              color="emerald"
            />
          </div>
        </div>

        <div className="premium-card p-8 group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[80px] -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-700" />
          <h2 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-8">
            Conflict Telemetry
          </h2>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 rounded-[24px] bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-glow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-black text-primary uppercase tracking-tight mb-1">
                Operational Integrity Nominal
              </p>
              <p className="text-[10px] font-black text-muted uppercase tracking-widest opacity-60">
                No scheduling overlaps detected in the current cycle.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize Schedule Node"
        className="max-w-2xl glass-morphic border-white/10 !rounded-[40px]"
      >
        <form onSubmit={handleAddSlot} className="space-y-10 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              label="Temporal Day"
              select
              value={formData.day_of_week}
              onChange={(val: any) =>
                setFormData({ ...formData, day_of_week: parseInt(val) })
              }
            >
              {DAYS.map((day, i) => (
                <option key={i} value={i} className="bg-bg-color">
                  {day}
                </option>
              ))}
            </FormField>
            <FormField
              label="Target Stream"
              select
              value={formData.stream}
              onChange={(val: any) => setFormData({ ...formData, stream: val })}
            >
              {streams.map((s) => (
                <option key={s.id} value={s.id} className="bg-bg-color">
                  {s.grade_name} {s.name}
                </option>
              ))}
            </FormField>
            <FormField
              label="Start Ingress"
              type="time"
              value={formData.start_time}
              onChange={(val: any) =>
                setFormData({ ...formData, start_time: val })
              }
            />
            <FormField
              label="End Egress"
              type="time"
              value={formData.end_time}
              onChange={(val: any) =>
                setFormData({ ...formData, end_time: val })
              }
            />
            <FormField
              label="Subject Matrix"
              select
              value={formData.subject}
              onChange={(val: any) =>
                setFormData({ ...formData, subject: val })
              }
            >
              <option value="" className="bg-bg-color">
                Select Matrix...
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id} className="bg-bg-color">
                  {s.name}
                </option>
              ))}
            </FormField>
            <FormField
              label="Faculty Node"
              select
              value={formData.teacher}
              onChange={(val: any) =>
                setFormData({ ...formData, teacher: val })
              }
            >
              <option value="" className="bg-bg-color">
                Select Node...
              </option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id} className="bg-bg-color">
                  {t.first_name} {t.last_name}
                </option>
              ))}
            </FormField>
            <FormField
              label="Spatial Unit (Room)"
              select
              value={formData.classroom}
              onChange={(val: any) =>
                setFormData({ ...formData, classroom: val })
              }
            >
              <option value="" className="bg-bg-color">
                Select Unit...
              </option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id} className="bg-bg-color">
                  {c.name}
                </option>
              ))}
            </FormField>
          </div>
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-16 text-[10px]"
              onClick={() => setIsModalOpen(false)}
            >
              Abort Process
            </Button>
            <Button 
              type="submit" 
              className="flex-[2] h-16 text-[10px]"
              disabled={addSlotMutation.isPending}
            >
              {addSlotMutation.isPending ? "Executing Node..." : "Execute Node Ingress"}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

const MetricRow = ({ icon: Icon, label, value, color }: any) => (
  <div className="flex items-center justify-between p-5 rounded-[24px] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
    <div className="flex items-center gap-4">
      <div
        className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400 border border-${color}-500/10`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-black text-muted uppercase tracking-widest">
        {label}
      </span>
    </div>
    <span className="text-xl font-black text-primary tracking-tight">
      {value}
    </span>
  </div>
);

const FormField = ({
  label,
  children,
  select,
  type = "text",
  value,
  onChange,
}: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] pl-1">
      {label}
    </label>
    {select ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-16 bg-white/5 border border-white/5 rounded-2xl px-6 text-primary text-base font-black outline-none focus:border-primary-500 transition-all appearance-none"
      >
        {children}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-16 bg-white/5 border border-white/5 rounded-2xl px-6 text-primary text-base font-black outline-none focus:border-primary-500 transition-all"
      />
    )}
  </div>
);

const Modal = ({ isOpen, onClose, title, children, className }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full overflow-hidden ${className}`}
        >
          <div className="p-10">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-primary uppercase tracking-tight">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-3 hover:bg-white/10 rounded-2xl text-muted hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default TimetablePage;
