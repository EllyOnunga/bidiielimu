import { useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Users,
  UserPlus,
  FileText,
  MoreHorizontal,
  BookOpen,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { classesService } from "../api/services/classesService";
import { studentsService } from "../api/services/studentsService";
import { teachersService } from "../api/services/teachersService";

export interface Student {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  gender: string;
  guardians?: { first_name: string; last_name: string; phone_number: string }[];
  is_active: boolean;
  stream_name: string;
  grade_name: string;
}

export interface StreamInfo {
  id: number;
  name: string;
  grade_level_name: string;
  teacher: number | null;
  teacher_name: string | null;
  student_count: number;
}

export const ClassDetailPage = () => {
  const { streamId, gradeId } = useParams<{ streamId?: string; gradeId?: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardData, setOnboardData] = useState({
    admission_number: "",
    first_name: "",
    last_name: "",
    gender: "M",
    date_of_birth: "",
  });
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [showAssignSubjectModal, setShowAssignSubjectModal] = useState(false);
  const [assignSubjectData, setAssignSubjectData] = useState({
    subject: "",
    teacher: "",
    academic_year: "2026",
    periods_per_week: 5,
  });

  const isGradeView = !!gradeId;

  // Grade Streams Query
  const { data: streamsRaw = [], isLoading: loadingStreams } = useQuery({
    queryKey: ["streams", gradeId],
    queryFn: () => classesService.getStreamsByGrade(gradeId!),
    enabled: !!gradeId,
  });
  const streams = useMemo(() => Array.isArray(streamsRaw) ? streamsRaw : (streamsRaw as any).results || [], [streamsRaw]);

  // Stream Info Query
  const { data: streamInfo, isLoading: loadingStreamInfo } = useQuery<StreamInfo>({
    queryKey: ["stream", streamId],
    queryFn: () => classesService.getStreamById(streamId!),
    enabled: !!streamId,
  });

  // Students Query
  const { data: studentsRaw = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["students", streamId],
    queryFn: () => studentsService.getAll({ stream: streamId }),
    enabled: !!streamId,
  });
  const students = useMemo(() => {
    const data = Array.isArray(studentsRaw) ? studentsRaw : (studentsRaw as any).results || [];
    return data as Student[];
  }, [studentsRaw]);

  // Subject Assignments Query
  const { data: assignmentsRaw = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ["subject-assignments", streamId],
    queryFn: () => classesService.getAssignments(),
    enabled: !!streamId,
  });
  const subjectAssignments = useMemo(() => {
    const data = Array.isArray(assignmentsRaw) ? assignmentsRaw : (assignmentsRaw as any).results || [];
    return streamId ? data.filter((a: any) => a.stream === parseInt(streamId)) : data;
  }, [assignmentsRaw, streamId]);

  const loading = loadingStreams || loadingStreamInfo || loadingStudents || loadingAssignments;

  // Teachers Query
  const { data: teachersRaw = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => teachersService.getAll(),
  });
  const teachers = useMemo(() => Array.isArray(teachersRaw) ? teachersRaw : (teachersRaw as any).results || [], [teachersRaw]);

  // Subjects Query
  const { data: subjectsRaw = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => classesService.getSubjects(),
  });
  const subjects = useMemo(() => Array.isArray(subjectsRaw) ? subjectsRaw : (subjectsRaw as any).results || [], [subjectsRaw]);

  // Mutations
  const onboardStudentMutation = useMutation({
    mutationFn: (data: any) => studentsService.create({
      ...data,
      stream: streamInfo?.id,
      enrollment_date: new Date().toISOString().split("T")[0],
    }),
    onSuccess: () => {
      toast.success("Student onboarded to stream");
      setShowOnboardModal(false);
      setOnboardData({ admission_number: "", first_name: "", last_name: "", gender: "M", date_of_birth: "" });
      queryClient.invalidateQueries({ queryKey: ["students", streamId] });
      queryClient.invalidateQueries({ queryKey: ["stream", streamId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Onboarding failed");
    }
  });

  const assignTeacherMutation = useMutation({
    mutationFn: (teacherId: number) => classesService.updateStream(streamInfo!.id, { teacher: teacherId }),
    onSuccess: () => {
      toast.success("Class teacher assigned");
      setShowAssignTeacherModal(false);
      queryClient.invalidateQueries({ queryKey: ["stream", streamId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Assignment failed");
    }
  });

  const assignSubjectMutation = useMutation({
    mutationFn: (data: any) => classesService.createAssignment(data),
    onSuccess: () => {
      toast.success("Subject assigned successfully");
      setShowAssignSubjectModal(false);
      setAssignSubjectData({
        subject: "",
        teacher: "",
        academic_year: "2026",
        periods_per_week: 5,
      });
      queryClient.invalidateQueries({ queryKey: ["subject-assignments", streamId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to assign subject");
    }
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: (id: number) => classesService.deleteAssignment(id),
    onSuccess: () => {
      toast.success("Assignment removed");
      queryClient.invalidateQueries({ queryKey: ["subject-assignments", streamId] });
    },
    onError: () => {
      toast.error("Failed to remove assignment");
    }
  });

  const handleOnboardStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamInfo) return;
    onboardStudentMutation.mutate(onboardData);
  };

  const handleAssignTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamInfo || !selectedTeacher) return;
    assignTeacherMutation.mutate(parseInt(selectedTeacher));
  };

  const handleAssignSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamInfo || !assignSubjectData.subject || !assignSubjectData.teacher) {
      toast.error("Please select both subject and teacher");
      return;
    }
    assignSubjectMutation.mutate({
      subject: parseInt(assignSubjectData.subject),
      teacher: parseInt(assignSubjectData.teacher),
      stream: parseInt(streamId!),
      academic_year: assignSubjectData.academic_year,
      periods_per_week: assignSubjectData.periods_per_week,
    });
  };

  const handleRemoveAssignment = (assignmentId: number) => {
    if (!confirm("Remove this subject assignment?")) return;
    removeAssignmentMutation.mutate(assignmentId);
  };

  const filtered = students.filter(
    (s) =>
      `${s.first_name} ${s.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      s.admission_number.toLowerCase().includes(search.toLowerCase()),
  );

  const breadcrumb = isGradeView
    ? "Streams"
    : streamInfo
      ? `${streamInfo.grade_level_name} — ${streamInfo.name}`
      : "Loading...";

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/classes")}
            className="p-2 hover:bg-white/10 rounded-xl transition-all"
          >
            <ChevronLeft className="w-6 h-6 text-muted" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-dim font-bold mb-1">
              <span
                className="hover:text-primary-400 cursor-pointer"
                onClick={() => navigate("/classes")}
              >
                Classes
              </span>
              <span>›</span>
              <span className="text-primary-400">{breadcrumb}</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-primary tracking-tight">
              {streamInfo
                ? `${streamInfo.grade_level_name} ${streamInfo.name}`
                : "Loading..."}
            </h1>
            <p className="text-muted text-sm mt-0.5 flex items-center gap-3">
              {streamInfo?.teacher_name
                ? `Class Teacher: ${streamInfo.teacher_name}`
                : "No class teacher assigned"}
              {" · "}
              <span className="text-primary-400 font-bold">
                {streamInfo?.student_count ?? 0} students
              </span>
              {!isGradeView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTeacher(streamInfo?.teacher ? streamInfo.teacher.toString() : "");
                    setShowAssignTeacherModal(true);
                  }}
                >
                  Assign Teacher
                </Button>
              )}
            </p>
          </div>
        </div>

        <Link
          to="/students"
          className="flex items-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary-900/20"
        >
          <UserPlus className="w-5 h-5" />
          Add Student
        </Link>
      </div>

      {/* Grade Streams View */}
      {isGradeView && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream: any) => (
            <div
              key={stream.id}
              onClick={() => navigate(`/classes/${stream.id}`)}
              className="premium-card p-6 cursor-pointer hover:border-primary-500/40 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black text-primary">{stream.name}</h3>
                  <p className="text-xs text-muted mt-1">{stream.teacher_name || "No lead"}</p>
                </div>
                <Users className="w-5 h-5 text-primary-400" />
              </div>
              <div className="text-sm text-muted">{stream.student_count} students enrolled</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {!isGradeView && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Students",
              value: students.length,
              icon: Users,
              color: "bg-primary-500/10 text-primary-400",
            },
            {
              label: "Active",
              value: students.filter((s) => s.is_active).length,
              icon: CheckCircle2,
              color: "bg-emerald-500/10 text-emerald-400",
            },
            {
              label: "Inactive",
              value: students.filter((s) => !s.is_active).length,
              icon: XCircle,
              color: "bg-rose-500/10 text-rose-400",
            },
            {
              label: "Subjects",
              value: "—",
              icon: BookOpen,
              color: "bg-amber-500/10 text-amber-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass p-5 rounded-2xl border border-white/5 flex items-center gap-4"
            >
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted font-bold">{stat.label}</p>
                <p className="text-2xl font-black text-primary">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Table */}
      {!isGradeView && (
        <div className="glass rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between gap-4">
            <Button onClick={() => setShowOnboardModal(true)} className="gap-2">
              <UserPlus className="w-4 h-4" /> Onboard to Stream
            </Button>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or admission no..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-primary text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
                    Adm No
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
                    Guardian Contact
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted">
                      Loading students...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Users className="w-12 h-12 text-dim mx-auto mb-4" />
                      <p className="text-muted font-medium">
                        No students in this class yet.
                      </p>
                      <Link
                        to="/students"
                        className="text-primary-400 text-sm hover:underline mt-2 inline-block"
                      >
                        Add the first student →
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filtered.map((student, idx) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-white/[0.02] transition-all group"
                    >
                      <td className="px-6 py-4 text-sm font-mono text-primary-400">
                        {student.admission_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-xs font-bold text-muted shrink-0">
                            {student.first_name[0]}
                            {student.last_name[0]}
                          </div>
                          <span className="text-sm font-semibold text-primary">
                            {student.first_name} {student.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {student.gender === "M"
                          ? "Male"
                          : student.gender === "F"
                            ? "Female"
                            : "Other"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-primary">
                          {student.guardians?.[0]
                            ? `${student.guardians[0].first_name} ${student.guardians[0].last_name}`.trim()
                            : "—"}
                        </div>
                        <div className="text-xs text-muted">
                          {student.guardians?.[0]?.phone_number || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium border ${student.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-muted border-white/10"}`}
                        >
                          {student.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/students/${student.id}/report`}
                            className="p-2 hover:bg-primary-500/10 text-muted hover:text-primary-400 rounded-lg transition-all"
                            title="View Report Card"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                          <button className="p-2 hover:bg-white/10 rounded-lg text-muted transition-all">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onboard Student Modal */}
      <Modal
        isOpen={showOnboardModal}
        onClose={() => setShowOnboardModal(false)}
        title="Onboard Student to Stream"
      >
        <form onSubmit={handleOnboardStudent} className="space-y-6 mt-4">
          <input
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm"
            placeholder="Admission Number"
            value={onboardData.admission_number}
            onChange={(e) => setOnboardData({ ...onboardData, admission_number: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm"
              placeholder="First Name"
              value={onboardData.first_name}
              onChange={(e) => setOnboardData({ ...onboardData, first_name: e.target.value })}
              required
            />
            <input
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm"
              placeholder="Last Name"
              value={onboardData.last_name}
              onChange={(e) => setOnboardData({ ...onboardData, last_name: e.target.value })}
              required
            />
          </div>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm"
            value={onboardData.gender}
            onChange={(e) => setOnboardData({ ...onboardData, gender: e.target.value })}
          >
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
          <input
            type="date"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm"
            value={onboardData.date_of_birth}
            onChange={(e) => setOnboardData({ ...onboardData, date_of_birth: e.target.value })}
            required
          />
          <Button type="submit" className="w-full">Onboard Student</Button>
        </form>
      </Modal>

      {/* Assign Class Teacher Modal */}
      <Modal
        isOpen={showAssignTeacherModal}
        onClose={() => setShowAssignTeacherModal(false)}
        title="Assign Class Teacher"
      >
        <form onSubmit={handleAssignTeacher} className="space-y-6 mt-4">
          <select
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm"
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            required
          >
            <option value="">Select teacher...</option>
            {teachers.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.user?.first_name} {t.user?.last_name} — {t.specialization || "General"}
              </option>
            ))}
          </select>
          <Button type="submit" className="w-full">Assign Teacher</Button>
        </form>
      </Modal>

      {/* Assign Subject to Stream Modal */}
      <Modal
        isOpen={showAssignSubjectModal}
        onClose={() => setShowAssignSubjectModal(false)}
        title="Assign Subject to Stream"
      >
        <form onSubmit={handleAssignSubject} className="space-y-6 mt-4">
          <div>
            <label className="text-sm text-muted mb-1 block">Subject</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm"
              value={assignSubjectData.subject}
              onChange={(e) => setAssignSubjectData({ ...assignSubjectData, subject: e.target.value })}
              required
            >
              <option value="">Select subject...</option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-muted mb-1 block">Teacher</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm"
              value={assignSubjectData.teacher}
              onChange={(e) => setAssignSubjectData({ ...assignSubjectData, teacher: e.target.value })}
              required
            >
              <option value="">Select teacher...</option>
              {teachers.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.user?.first_name} {t.user?.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted mb-1 block">Academic Year</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm"
                value={assignSubjectData.academic_year}
                onChange={(e) => setAssignSubjectData({ ...assignSubjectData, academic_year: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Periods/Week</label>
              <input
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm"
                value={assignSubjectData.periods_per_week}
                onChange={(e) => setAssignSubjectData({ ...assignSubjectData, periods_per_week: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">Assign Subject</Button>
        </form>
      </Modal>

      {/* Assigned Subjects Section */}
      {!isGradeView && (
        <div className="glass rounded-3xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-primary">Assigned Subjects</h3>
            <Button
              size="sm"
              onClick={() => {
                setShowAssignSubjectModal(true);
              }}
            >
              Assign Subject
            </Button>
          </div>

          {subjectAssignments.length === 0 ? (
            <p className="text-muted text-sm">No subjects assigned to this stream yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjectAssignments.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center group"
                >
                  <div>
                    <div className="font-bold text-primary">{assignment.subject_name}</div>
                    <div className="text-sm text-muted">
                      Teacher: {assignment.teacher_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-muted">
                      {assignment.academic_year}<br />
                      {assignment.periods_per_week} periods/week
                    </div>
                    <button
                      onClick={() => handleRemoveAssignment(assignment.id)}
                      className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-500 transition-all p-1"
                      title="Remove assignment"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
