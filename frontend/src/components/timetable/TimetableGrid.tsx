import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  useDraggable, 
  useDroppable, 
  DragOverlay,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Clock, User, MapPin, AlertCircle, Sparkles, Save } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Slot {
  id: string;
  subject_name: string;
  teacher_name: string;
  classroom_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const DraggableSlot = ({ slot }: { slot: Slot }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: slot.id,
    data: slot
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-3 bg-primary-600/20 border border-primary-500/30 rounded-xl cursor-grab active:cursor-grabbing hover:bg-primary-600/30 transition-all group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <h4 className="text-xs font-black text-white truncate mb-1">{slot.subject_name}</h4>
        <div className="flex items-center gap-1.5 text-[10px] text-primary-200/60 mb-0.5">
          <User className="w-2.5 h-2.5" />
          <span className="truncate">{slot.teacher_name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-primary-200/60">
          <MapPin className="w-2.5 h-2.5" />
          <span>{slot.classroom_name}</span>
        </div>
      </div>
    </div>
  );
};

const DroppableCell = ({ day, time, children, hasConflict }: any) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `${day}-${time}`,
    data: { day, time }
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[80px] p-1 border-r border-b border-white/5 transition-all relative ${
        isOver ? 'bg-primary-500/10' : ''
      } ${hasConflict ? 'bg-rose-500/5 ring-1 ring-inset ring-rose-500/20' : ''}`}
    >
      {children}
      {hasConflict && (
        <div className="absolute top-1 right-1">
          <AlertCircle className="w-3 h-3 text-rose-400" />
        </div>
      )}
    </div>
  );
};

export const TimetableGrid = ({ streamId }: { streamId: string }) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const times = ['08:00', '08:45', '09:30', '10:15', '11:00', '11:45', '12:30', '14:00', '14:45'];

  useEffect(() => {
    fetchSlots();
  }, [streamId]);

  const fetchSlots = async () => {
    const res = await axios.get(`/api/v1/classes/schedule-slots/?stream=${streamId}`);
    setSlots(res.data);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const [newDay, newTime] = over.id.split('-');
    const slotId = active.id;

    try {
      // Validate with backend before moving
      const checkRes = await axios.post('/api/v1/classes/timetable/check-conflict/', {
        id: slotId,
        day_of_week: days.indexOf(newDay),
        start_time: newTime,
        // ... other required fields for validation
      });

      if (checkRes.data.status === 'conflict') {
        toast.error('Conflict detected: ' + JSON.stringify(checkRes.data.errors));
        return;
      }

      // Update locally first for snappiness
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, day_of_week: days.indexOf(newDay), start_time: newTime } : s));
      
      // Save to backend
      await axios.patch(`/api/v1/classes/schedule-slots/${slotId}/`, {
        day_of_week: days.indexOf(newDay),
        start_time: newTime
      });
      
      toast.success('Timetable updated');
    } catch (err) {
      toast.error('Failed to move slot');
      fetchSlots(); // Revert
    }
  };

  const generateTimetable = async () => {
    setIsGenerating(true);
    const toastId = toast.loading('Generating optimal timetable...');
    try {
      const res = await axios.post('/api/v1/classes/timetable/generate/', { stream_id: streamId });
      toast.success(`Generated ${res.data.success} slots!`, { id: toastId });
      fetchSlots();
    } catch (err) {
      toast.error('Generation failed', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="glass rounded-[32px] overflow-hidden p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-white">Class Timetable</h2>
          <p className="text-primary-200/50 text-sm">Drag and drop to reschedule or use AI to automate</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={generateTimetable}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold text-sm shadow-premium transition-all disabled:opacity-50"
          >
            {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Auto-Generate
          </button>
          <button className="p-3 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 transition-all">
            <Save className="w-5 h-5" />
          </button>
        </div>
      </div>

      <DndContext onDragStart={({ active }) => setActiveId(active.id as string)} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-[100px_repeat(5,1fr)] bg-white/5 border border-white/10 rounded-[24px] overflow-hidden">
          {/* Header Row */}
          <div className="p-4 border-r border-b border-white/10 bg-white/5" />
          {days.map(day => (
            <div key={day} className="p-4 border-r border-b border-white/10 bg-white/5 text-center text-xs font-black text-primary-400 uppercase tracking-widest">
              {day}
            </div>
          ))}

          {/* Time Rows */}
          {times.map(time => (
            <React.Fragment key={time}>
              <div className="p-4 border-r border-b border-white/10 text-center flex items-center justify-center gap-2">
                <Clock className="w-3 h-3 text-primary-400/50" />
                <span className="text-xs font-bold text-white/60">{time}</span>
              </div>
              {days.map(day => {
                const dayIdx = days.indexOf(day);
                const slot = slots.find(s => s.day_of_week === dayIdx && s.start_time.startsWith(time));
                return (
                  <DroppableCell key={`${day}-${time}`} day={day} time={time}>
                    {slot && <DraggableSlot slot={slot} />}
                  </DroppableCell>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="p-3 bg-primary-500 text-white rounded-xl shadow-2xl opacity-90 scale-105 border border-white/20">
              <h4 className="text-xs font-black truncate">{slots.find(s => s.id === activeId)?.subject_name}</h4>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
