import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  Calendar,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import client from "../api/client";
import { Button } from "../components/ui/Button";
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

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export const AttendancePage = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedStream, setSelectedStream] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: grades = [] } = useQuery({
    queryKey: ["grades"],
    queryFn: () => classesService.getGrades(),
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });

  const { data: attendanceData = [], isFetching: loadingAttendance } = useQuery(
    {
      queryKey: ["attendance", selectedDate, selectedStream],
      queryFn: async () => {
        if (!selectedStream) return [];
        const res = await client.get(`attendance/daily/?date=${selectedDate}`);
        return Array.isArray(res.data) ? res.data : res.data.results || [];
      },
      enabled: !!selectedStream,
    },
  );

  const { data: studentList = [], isFetching: loadingStudents } = useQuery({
    queryKey: ["students", selectedStream],
    queryFn: async () => {
      if (!selectedStream) return [];
      const res = await client.get(`students/?stream=${selectedStream}`);
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
    enabled: !!selectedStream,
  });

  useEffect(() => {
    if (studentList.length > 0) {
      const mapped = studentList.map((s: any) => {
        const record = attendanceData.find((a: any) => a.student === s.id);
        return {
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          admission: s.admission_number,
          status: record ? record.status : "PRESENT",
        };
      });
      setStudents(mapped);
    } else {
      setStudents([]);
    }
  }, [studentList, attendanceData]);

  const updateStatus = (id: number, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s)),
    );
  };

  const markAll = (status: AttendanceStatus) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await client.post("attendance/daily/bulk_mark/", {
        date: selectedDate,
        records: students.map((s) => ({
          student_id: s.id,
          status: s.status,
        })),
      });
      toast.success("Attendance recorded successfully!");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    } catch (err) {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.admission.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 md:space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-none">
            Attendance <span className="text-gradient">Protocol</span>
          </h1>
          <p className="text-muted text-sm md:text-base font-medium max-w-xl">
            Mark and track daily student presence across the institutional grid.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Button
            variant="outline"
            className="flex-1 lg:flex-none gap-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
            onClick={() => markAll("PRESENT")}
          >
            Mark All Present
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !selectedStream}
            className="flex-1 lg:flex-none gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Syncing..." : "Commit Records"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="premium-card space-y-4">
          <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">
            Operational Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-12 h-12"
            />
          </div>
        </div>

        <div className="premium-card space-y-4">
          <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">
            Target Deployment
          </label>
          <select
            value={selectedStream}
            onChange={(e) => setSelectedStream(e.target.value)}
            className="flex h-12 w-full rounded-xl border border-white/5 bg-white/5 px-4 text-sm text-primary outline-none focus:border-primary-500 transition-all"
          >
            <option value="" className="bg-bg-color">
              Select Stream...
            </option>
            {grades.map((g: any) => (
              <optgroup key={g.id} label={g.name} className="bg-bg-color">
                {g.streams.map((s: any) => (
                  <option key={s.id} value={s.id} className="bg-bg-color">
                    {g.name} {s.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="premium-card space-y-4 sm:col-span-2 lg:col-span-1">
          <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">
            Asset Search
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
            <Input
              placeholder="Query name or identifier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12"
            />
          </div>
        </div>
      </div>

      <div className="premium-card !p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Asset</TableHead>
              <TableHead className="text-center">Protocol Status</TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                Temporal Stamp
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingStudents || loadingAttendance ? (
              <TableSkeleton rows={10} cols={3} />
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-24 text-primary-200/20 italic text-xs uppercase tracking-widest font-black"
                >
                  {selectedStream
                    ? "No intelligence records found."
                    : "Select a target deployment to initiate tracking."}
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center text-[10px] font-black text-primary-400 border border-primary-500/10">
                        {s.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-xs font-black text-primary uppercase tracking-tight">
                          {s.name}
                        </p>
                        <p className="text-[10px] font-mono text-dim">
                          {s.admission}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
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
                  <TableCell className="text-right text-[10px] font-black text-primary-200/20 uppercase hidden sm:table-cell">
                    {selectedDate === new Date().toISOString().split("T")[0]
                      ? "Current Cycle"
                      : selectedDate}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const StatusButton = ({ active, type, icon: Icon, label, onClick }: any) => {
  const activeColors = {
    PRESENT: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40",
    ABSENT: "bg-rose-500 text-white shadow-lg shadow-rose-500/40",
    LATE: "bg-amber-500 text-white shadow-lg shadow-amber-500/40",
    EXCUSED: "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
        active
          ? activeColors[type as keyof typeof activeColors] +
            " border-transparent"
          : "bg-white/5 border-white/5 text-muted hover:text-primary hover:bg-white/10"
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};
