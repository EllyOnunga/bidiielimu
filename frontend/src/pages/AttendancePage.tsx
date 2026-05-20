import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  Search,
  Users,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
  TableHead,
} from "../components/ui/Table";
import { TableSkeleton } from "../components/ui/Skeleton";
import { classesService } from "../api/services/classesService";
import { attendanceService } from "../api/services/attendanceService";
import { studentsService } from "../api/services/studentsService";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface StudentRow {
  id: number;
  name: string;
  admission: string;
  status: AttendanceStatus;
}

export const AttendancePage = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedStream, setSelectedStream] = useState("");
  const [localAttendance, setLocalAttendance] = useState<
    Record<number, AttendanceStatus>
  >({});
  const [search, setSearch] = useState("");

  const { data: gradesData = [] } = useQuery({
    queryKey: ["grades"],
    queryFn: () => classesService.getGrades(),
  });
  const grades = useMemo(
    () => (Array.isArray(gradesData) ? gradesData : gradesData.results || []),
    [gradesData],
  );

  const { data: attendanceRaw = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ["attendance", selectedDate, selectedStream],
    queryFn: () => attendanceService.getDailyAttendance(selectedDate),
    enabled: !!selectedStream,
  });

  const { data: studentsRaw = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["students", selectedStream],
    queryFn: () => studentsService.getAll({ stream: selectedStream }),
    enabled: !!selectedStream,
  });

  const students = useMemo(() => {
    const sList = Array.isArray(studentsRaw)
      ? studentsRaw
      : studentsRaw.results || [];
    const aList = Array.isArray(attendanceRaw)
      ? attendanceRaw
      : attendanceRaw.results || [];

    return sList.map((s: any) => {
      const record = aList.find((a: any) => a.student === s.id);
      const status =
        localAttendance[s.id] || (record ? record.status : "PRESENT");
      return {
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        admission: s.admission_number,
        status,
      };
    });
  }, [studentsRaw, attendanceRaw, localAttendance]);

  const updateStatus = (id: number, status: AttendanceStatus) => {
    setLocalAttendance((prev) => ({ ...prev, [id]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const newAttendance: Record<number, AttendanceStatus> = {};
    students.forEach((s: StudentRow) => {
      newAttendance[s.id] = status;
    });
    setLocalAttendance(newAttendance);
  };

  const bulkMarkMutation = useMutation({
    mutationFn: (data: any) => attendanceService.bulkMark(data),
    onSuccess: () => {
      toast.success("Attendance successfully saved");
      queryClient.invalidateQueries({
        queryKey: ["attendance", selectedDate, selectedStream],
      });
      setLocalAttendance({});
    },
    onError: () => {
      toast.error("Failed to save attendance");
    },
  });

  const handleSave = () => {
    bulkMarkMutation.mutate({
      date: selectedDate,
      records: students.map((s: StudentRow) => ({
        student_id: s.id,
        status: s.status,
      })),
    });
  };

  const saving = bulkMarkMutation.isPending;

  const filteredStudents = students.filter(
    (s: StudentRow) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.admission.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-20"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-none">
            Student <span className="text-gradient">Attendance</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm md:text-base font-medium max-w-xl">
            Mark and track daily attendance for your school classes.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Button
            variant="ghost"
            className="flex-1 lg:flex-none h-14 px-8 rounded-2xl text-emerald-400 hover:bg-emerald-500/10"
            onClick={() => markAll("PRESENT")}
          >
            Mark All Present
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !selectedStream}
            className="flex-1 lg:flex-none h-14 px-8 rounded-2xl gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            {saving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="premium-card p-6 space-y-4">
          <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] pl-1">
            Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-12 h-14 bg-white/5 border-white/5"
            />
          </div>
        </div>

        <div className="premium-card p-6 space-y-4">
          <Select
            label="Select Class Stream"
            value={selectedStream}
            onChange={(e) => setSelectedStream(e.target.value)}
          >
            <option value="" className="bg-bg-color">
              Select Stream...
            </option>
            {grades.map((g: any) => (
              <optgroup
                key={g.id}
                label={g.name}
                className="bg-bg-color font-black"
              >
                {g.streams.map((s: any) => (
                  <option key={s.id} value={s.id} className="bg-bg-color">
                    {g.name} {s.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </div>

        <div className="premium-card p-6 space-y-4 sm:col-span-2 lg:col-span-1">
          <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] pl-1">
            Search Students
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
            <Input
              placeholder="Search by name or admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 bg-white/5 border-white/5"
            />
          </div>
        </div>
      </div>

      <div className="premium-card !p-0 overflow-hidden border-white/5">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
          <div>
            <h2 className="text-lg font-black text-primary uppercase tracking-[0.2em]">
              Attendance Overview
            </h2>
            <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">
              Provides daily attendance trends and real-time status updates for
              the selected stream.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <div className="flex flex-col items-end">
              <p className="text-[10px] font-black text-muted uppercase tracking-widest">
                Active Students
              </p>
              <p className="text-xl font-black text-primary">
                {filteredStudents.length} Students
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary-600/10 flex items-center justify-center border border-primary-500/10">
              <Users className="w-6 h-6 text-primary-400" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-0 hover:bg-transparent h-20">
                <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest pl-10 w-[400px]">
                  Student Details
                </TableHead>
                <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest text-center">
                  Status
                </TableHead>
                <TableHead className="text-right text-muted text-[10px] font-black uppercase tracking-widest pr-10">
                  Recorded Time
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {loadingStudents || loadingAttendance ? (
                  <TableSkeleton rows={10} cols={3} />
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-40">
                      <div className="flex flex-col items-center opacity-20">
                        <Zap className="w-20 h-20 mb-6" />
                        <p className="text-lg font-black uppercase tracking-[0.3em]">
                          {selectedStream
                            ? "No students found for this class."
                            : "Please select a stream above to see the student list."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((s: StudentRow, idx: number) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="group transition-all h-24 border-white/5 hover:bg-white/[0.03]"
                    >
                      <TableCell className="pl-10">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-primary-600/10 flex items-center justify-center text-sm font-black text-primary-400 border border-primary-500/10 group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                            {s.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="text-base font-black text-primary uppercase tracking-tight leading-none mb-1.5">
                              {s.name}
                            </p>
                            <p className="text-[10px] font-black text-dim uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md inline-block">
                              {s.admission}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-3">
                          <StatusButton
                            active={s.status === "PRESENT"}
                            type="PRESENT"
                            icon={CheckCircle2}
                            label="Present"
                            onClick={() => updateStatus(s.id, "PRESENT")}
                          />
                          <StatusButton
                            active={s.status === "ABSENT"}
                            type="ABSENT"
                            icon={XCircle}
                            label="Absent"
                            onClick={() => updateStatus(s.id, "ABSENT")}
                          />
                          <StatusButton
                            active={s.status === "LATE"}
                            type="LATE"
                            icon={Clock}
                            label="Late"
                            onClick={() => updateStatus(s.id, "LATE")}
                          />
                          <StatusButton
                            active={s.status === "EXCUSED"}
                            type="EXCUSED"
                            icon={AlertCircle}
                            label="Excused"
                            onClick={() => updateStatus(s.id, "EXCUSED")}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-[10px] font-black text-dim uppercase tracking-widest pr-10">
                        {selectedDate === new Date().toISOString().split("T")[0]
                          ? "Today"
                          : selectedDate}
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
  );
};

const StatusButton = ({ active, type, icon: Icon, label, onClick }: any) => {
  const activeColors = {
    PRESENT: "bg-emerald-500 text-white shadow-glow-sm border-emerald-400/50",
    ABSENT: "bg-rose-500 text-white shadow-glow-sm border-rose-400/50",
    LATE: "bg-amber-500 text-white shadow-glow-sm border-amber-400/50",
    EXCUSED: "bg-indigo-500 text-white shadow-glow-sm border-indigo-400/50",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
        active
          ? activeColors[type as keyof typeof activeColors]
          : "bg-white/5 border-white/5 text-muted hover:text-primary hover:bg-white/10"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
};

export default AttendancePage;
