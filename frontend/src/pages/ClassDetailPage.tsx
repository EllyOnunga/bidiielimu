import { useState, useMemo, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronDown,
  Users,
  BookOpen,
  CheckCircle2,
  XCircle,
  Search,
  UserPlus,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { classesService } from "../api/services/classesService";
import { studentsService } from "../api/services/studentsService";
import { Select } from "../components/ui/Select";
import { teachersService } from "../api/services/teachersService";

export interface Student {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  gender: string;
  guardians?: { first_name: string; last_name: string; phone_number: string }[];
  is_active: boolean;
  stream?: number;
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
  const { streamId, gradeId } = useParams<{
    streamId?: string;
    gradeId?: string;
  }>();
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

  const [activeOnboardStreamId, setActiveOnboardStreamId] = useState<
    number | null
  >(null);
  const [expandedStreams, setExpandedStreams] = useState<
    Record<number, boolean>
  >({});

  const isGradeView = !!gradeId;
  const isValidStreamId = !!streamId && !isNaN(Number(streamId));

  useEffect(() => {
    if (streamId && isNaN(Number(streamId))) {
      navigate("/classes", { replace: true });
    }
  }, [streamId, navigate]);

  // Grade Info Query
  const { data: gradeInfo, isLoading: loadingGradeInfo } = useQuery({
    queryKey: ["grade-info", gradeId],
    queryFn: () => classesService.getGradeById(gradeId!),
    enabled: isGradeView && !!gradeId,
  });

  // Grade Streams Query
  const { data: streamsRaw = [], isLoading: loadingStreams } = useQuery({
    queryKey: ["streams", gradeId],
    queryFn: () => classesService.getStreamsByGrade(gradeId!),
    enabled: !!gradeId,
  });
  const streams = useMemo(
    () =>
      Array.isArray(streamsRaw)
        ? streamsRaw
        : (streamsRaw as any).results || [],
    [streamsRaw],
  );

  // Expand first stream by default once streams are loaded
  useEffect(() => {
    if (streams.length > 0) {
      setExpandedStreams((prev) => {
        const updated = { ...prev };
        streams.forEach((stream: any, idx: number) => {
          if (updated[stream.id] === undefined) {
            updated[stream.id] = idx === 0;
          }
        });
        return updated;
      });
    }
  }, [streams]);

  const toggleStream = (id: number) => {
    setExpandedStreams((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Stream Info Query
  const { data: streamInfo, isLoading: loadingStreamInfo } =
    useQuery<StreamInfo>({
      queryKey: ["stream", streamId],
      queryFn: () => classesService.getStreamById(streamId!),
      enabled: isValidStreamId,
    });

  // Students Query (loads all students in the grade if isGradeView, or in the specific stream)
  const { data: studentsRaw = [], isLoading: loadingStudents } = useQuery({
    queryKey: [
      "students",
      isGradeView ? `grade-${gradeId}` : `stream-${streamId}`,
    ],
    queryFn: () =>
      isGradeView
        ? studentsService.getAll({ grade: gradeId })
        : studentsService.getAll({ stream: streamId }),
    enabled: isGradeView ? !!gradeId : isValidStreamId,
  });
  const students = useMemo(() => {
    const data = Array.isArray(studentsRaw)
      ? studentsRaw
      : (studentsRaw as any).results || [];
    return data as Student[];
  }, [studentsRaw]);

  // Subject Assignments Query
  const { data: assignmentsRaw = [], isLoading: loadingAssignments } = useQuery(
    {
      queryKey: ["subject-assignments", streamId],
      queryFn: () => classesService.getAssignments(),
      enabled: isValidStreamId,
    },
  );
  const subjectAssignments = useMemo(() => {
    const data = Array.isArray(assignmentsRaw)
      ? assignmentsRaw
      : (assignmentsRaw as any).results || [];
    return isValidStreamId
      ? data.filter((a: any) => a.stream === parseInt(streamId))
      : data;
  }, [assignmentsRaw, streamId, isValidStreamId]);

  const loading =
    loadingStreams ||
    loadingStreamInfo ||
    loadingStudents ||
    loadingAssignments ||
    (isGradeView && loadingGradeInfo);

  // Teachers Query
  const { data: teachersRaw = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => teachersService.getAll(),
  });
  const teachers = useMemo(
    () =>
      Array.isArray(teachersRaw)
        ? teachersRaw
        : (teachersRaw as any).results || [],
    [teachersRaw],
  );

  // Subjects Query
  const { data: subjectsRaw = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => classesService.getSubjects(),
  });
  const subjects = useMemo(
    () =>
      Array.isArray(subjectsRaw)
        ? subjectsRaw
        : (subjectsRaw as any).results || [],
    [subjectsRaw],
  );

  // Mutations
  const onboardStudentMutation = useMutation({
    mutationFn: (data: any) =>
      studentsService.create({
        ...data,
        stream: activeOnboardStreamId || streamInfo?.id,
        enrollment_date: new Date().toISOString().split("T")[0],
      }),
    onSuccess: () => {
      toast.success("Student onboarded to stream");
      setShowOnboardModal(false);
      setOnboardData({
        admission_number: "",
        first_name: "",
        last_name: "",
        gender: "M",
        date_of_birth: "",
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["stream"] });
      queryClient.invalidateQueries({ queryKey: ["streams"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Onboarding failed");
    },
  });

  const assignTeacherMutation = useMutation({
    mutationFn: (teacherId: number) =>
      classesService.updateStream(streamInfo!.id, { teacher: teacherId }),
    onSuccess: () => {
      toast.success("Class teacher assigned");
      setShowAssignTeacherModal(false);
      queryClient.invalidateQueries({ queryKey: ["stream", streamId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Assignment failed");
    },
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
      queryClient.invalidateQueries({
        queryKey: ["subject-assignments", streamId],
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to assign subject");
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: (id: number) => classesService.deleteAssignment(id),
    onSuccess: () => {
      toast.success("Assignment removed");
      queryClient.invalidateQueries({
        queryKey: ["subject-assignments", streamId],
      });
    },
    onError: () => {
      toast.error("Failed to remove assignment");
    },
  });

  const handleOnboardStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGradeView && !streamInfo) return;
    if (isGradeView && !activeOnboardStreamId) {
      toast.error("Please select a target stream");
      return;
    }
    onboardStudentMutation.mutate(onboardData);
  };

  const handleAssignTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamInfo || !selectedTeacher) return;
    assignTeacherMutation.mutate(parseInt(selectedTeacher));
  };

  const handleAssignSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !streamInfo ||
      !assignSubjectData.subject ||
      !assignSubjectData.teacher
    ) {
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
    ? gradeInfo?.name || "Class View"
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
              {isGradeView
                ? gradeInfo?.name || "Loading Class..."
                : streamInfo
                  ? `${streamInfo.grade_level_name} ${streamInfo.name}`
                  : "Loading..."}
            </h1>
            <div className="text-muted text-sm mt-0.5 flex flex-wrap items-center gap-3">
              {isGradeView ? (
                <span>
                  Total Streams:{" "}
                  <strong className="text-primary">{streams.length}</strong>
                </span>
              ) : streamInfo?.teacher_name ? (
                <span>
                  Class Teacher:{" "}
                  <strong className="text-primary">
                    {streamInfo.teacher_name}
                  </strong>
                </span>
              ) : (
                <span>No class teacher assigned</span>
              )}
              <span>·</span>
              <span className="text-primary-400 font-bold">
                {isGradeView
                  ? `${gradeInfo?.student_count ?? 0} students`
                  : `${streamInfo?.student_count ?? 0} students`}
              </span>
              {!isGradeView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTeacher(
                      streamInfo?.teacher ? streamInfo.teacher.toString() : "",
                    );
                    setShowAssignTeacherModal(true);
                  }}
                  className="h-8 px-3 text-[10px]"
                >
                  Assign Teacher
                </Button>
              )}
            </div>
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

      {/* Grade Search Bar */}
      {isGradeView && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-4 md:p-6 rounded-2xl border border-white/5">
          <p className="text-xs font-bold text-muted uppercase tracking-widest pl-1">
            Query class structure & student registry
          </p>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student names or admission numbers..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-primary text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      )}

      {/* Grade Streams View */}
      {isGradeView && (
        <div className="space-y-6">
          {streams.length === 0 ? (
            <div className="premium-card p-12 text-center text-muted">
              <Users className="w-12 h-12 text-dim mx-auto mb-4" />
              <p className="font-semibold text-primary">No Streams Deployed</p>
              <p className="text-xs text-muted mt-1">
                Please add a stream to initialize the academic grid.
              </p>
            </div>
          ) : (
            streams.map((stream: any) => {
              const isExpanded = !!expandedStreams[stream.id];
              // Filter students for this specific stream
              const streamStudents = students.filter(
                (s) => s.stream === stream.id,
              );
              // Apply search filter if any
              const filteredStreamStudents = streamStudents.filter(
                (s) =>
                  `${s.first_name} ${s.last_name}`
                    .toLowerCase()
                    .includes(search.toLowerCase()) ||
                  s.admission_number
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              );

              return (
                <div
                  key={stream.id}
                  className="premium-card !p-0 border border-white/5 overflow-hidden transition-all duration-300"
                >
                  {/* Stream Card Header */}
                  <div
                    onClick={() => toggleStream(stream.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 cursor-pointer bg-white/[0.01] hover:bg-white/[0.03] transition-all select-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-600/10 border border-primary-500/10 flex items-center justify-center text-primary-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-primary uppercase tracking-tight flex items-center gap-3">
                          {stream.name}
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/5 border border-white/5 text-primary-200/50">
                            {streamStudents.length} Students
                          </span>
                        </h3>
                        <p className="text-xs text-muted mt-0.5">
                          {stream.teacher_name
                            ? `Class Teacher: ${stream.teacher_name}`
                            : "No Class Teacher Assigned"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Action buttons inside header */}
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveOnboardStreamId(stream.id);
                          setShowOnboardModal(true);
                        }}
                        className="gap-1.5 text-[10px] h-10 px-4"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Onboard
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/classes/${stream.id}`);
                        }}
                        className="text-[10px] h-10 px-4"
                      >
                        Manage Stream
                      </Button>
                      <button className="p-2 hover:bg-white/10 rounded-xl transition-all">
                        <ChevronDown
                          className={`w-5 h-5 text-muted transition-transform duration-300 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Area (Students Table) */}
                  {isExpanded && (
                    <div className="border-t border-white/5 bg-black/10">
                      {filteredStreamStudents.length === 0 ? (
                        <div className="p-8 text-center text-muted text-xs">
                          {streamStudents.length === 0 ? (
                            <>
                              <p className="font-semibold text-primary mb-1">
                                No Students Registered
                              </p>
                              <p className="text-muted">
                                Click the "Onboard" button to add students to
                                this stream.
                              </p>
                            </>
                          ) : (
                            <p>No students match your query "{search}".</p>
                          )}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left min-w-[700px]">
                            <thead>
                              <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="px-6 py-3 text-[10px] font-black text-muted uppercase tracking-wider">
                                  Adm No
                                </th>
                                <th className="px-6 py-3 text-[10px] font-black text-muted uppercase tracking-wider">
                                  Student
                                </th>
                                <th className="px-6 py-3 text-[10px] font-black text-muted uppercase tracking-wider">
                                  Gender
                                </th>
                                <th className="px-6 py-3 text-[10px] font-black text-muted uppercase tracking-wider">
                                  Guardian Contact
                                </th>
                                <th className="px-6 py-3 text-[10px] font-black text-muted uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-[10px] font-black text-muted uppercase tracking-wider text-right">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {filteredStreamStudents.map((student) => (
                                <tr
                                  key={student.id}
                                  className="hover:bg-white/[0.02] transition-all group"
                                >
                                  <td className="px-6 py-3.5 text-sm font-mono text-primary-400">
                                    {student.admission_number}
                                  </td>
                                  <td className="px-6 py-3.5">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-xs font-bold text-muted shrink-0">
                                        {student.first_name[0]}
                                        {student.last_name[0]}
                                      </div>
                                      <span className="text-sm font-semibold text-primary">
                                        {student.first_name} {student.last_name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-3.5 text-sm text-muted">
                                    {student.gender === "M"
                                      ? "Male"
                                      : student.gender === "F"
                                        ? "Female"
                                        : "Other"}
                                  </td>
                                  <td className="px-6 py-3.5">
                                    <div className="text-sm text-primary">
                                      {student.guardians?.[0]
                                        ? `${student.guardians[0].first_name} ${student.guardians[0].last_name}`.trim()
                                        : "—"}
                                    </div>
                                    <div className="text-xs text-muted">
                                      {student.guardians?.[0]?.phone_number ||
                                        "—"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-3.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${
                                        student.is_active
                                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                          : "bg-white/5 text-muted border-white/10"
                                      }`}
                                    >
                                      {student.is_active
                                        ? "Active"
                                        : "Inactive"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3.5 text-right">
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
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
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
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-muted"
                    >
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
          {isGradeView && (
            <Select
              label="Target Stream"
              required
              value={activeOnboardStreamId || ""}
              onChange={(e) =>
                setActiveOnboardStreamId(
                  e.target.value ? parseInt(e.target.value) : null,
                )
              }
            >
              <option value="" className="bg-bg-color">
                Select target stream...
              </option>
              {streams.map((s: any) => (
                <option key={s.id} value={s.id} className="bg-bg-color">
                  {s.name}
                </option>
              ))}
            </Select>
          )}
          <input
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm"
            placeholder="Admission Number"
            value={onboardData.admission_number}
            onChange={(e) =>
              setOnboardData({
                ...onboardData,
                admission_number: e.target.value,
              })
            }
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm"
              placeholder="First Name"
              value={onboardData.first_name}
              onChange={(e) =>
                setOnboardData({ ...onboardData, first_name: e.target.value })
              }
              required
            />
            <input
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm"
              placeholder="Last Name"
              value={onboardData.last_name}
              onChange={(e) =>
                setOnboardData({ ...onboardData, last_name: e.target.value })
              }
              required
            />
          </div>
          <Select
            label="Gender"
            value={onboardData.gender}
            onChange={(e) =>
              setOnboardData({ ...onboardData, gender: e.target.value })
            }
          >
            <option value="M" className="bg-bg-color">
              Male
            </option>
            <option value="F" className="bg-bg-color">
              Female
            </option>
          </Select>
          <input
            type="date"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm"
            value={onboardData.date_of_birth}
            onChange={(e) =>
              setOnboardData({ ...onboardData, date_of_birth: e.target.value })
            }
            required
          />
          <Button type="submit" className="w-full">
            Onboard Student
          </Button>
        </form>
      </Modal>

      {/* Assign Class Teacher Modal */}
      <Modal
        isOpen={showAssignTeacherModal}
        onClose={() => setShowAssignTeacherModal(false)}
        title="Assign Class Teacher"
      >
        <form onSubmit={handleAssignTeacher} className="space-y-6 mt-4">
          <Select
            label="Teacher"
            required
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
          >
            <option value="" className="bg-bg-color">
              Select teacher...
            </option>
            {teachers.map((t: any) => (
              <option key={t.id} value={t.id} className="bg-bg-color">
                {t.user?.first_name} {t.user?.last_name} —{" "}
                {t.specialization || "General"}
              </option>
            ))}
          </Select>
          <Button type="submit" className="w-full">
            Assign Teacher
          </Button>
        </form>
      </Modal>

      {/* Assign Subject to Stream Modal */}
      <Modal
        isOpen={showAssignSubjectModal}
        onClose={() => setShowAssignSubjectModal(false)}
        title="Assign Subject to Stream"
      >
        <form onSubmit={handleAssignSubject} className="space-y-6 mt-4">
          <Select
            label="Subject"
            required
            value={assignSubjectData.subject}
            onChange={(e) =>
              setAssignSubjectData({
                ...assignSubjectData,
                subject: e.target.value,
              })
            }
          >
            <option value="" className="bg-bg-color">
              Select subject...
            </option>
            {subjects.map((s: any) => (
              <option key={s.id} value={s.id} className="bg-bg-color">
                {s.name}
              </option>
            ))}
          </Select>

          <Select
            label="Teacher"
            required
            value={assignSubjectData.teacher}
            onChange={(e) =>
              setAssignSubjectData({
                ...assignSubjectData,
                teacher: e.target.value,
              })
            }
          >
            <option value="" className="bg-bg-color">
              Select teacher...
            </option>
            {teachers.map((t: any) => (
              <option key={t.id} value={t.id} className="bg-bg-color">
                {t.user?.first_name} {t.user?.last_name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted mb-1 block">
                Academic Year
              </label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm"
                value={assignSubjectData.academic_year}
                onChange={(e) =>
                  setAssignSubjectData({
                    ...assignSubjectData,
                    academic_year: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">
                Periods/Week
              </label>
              <input
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm"
                value={assignSubjectData.periods_per_week}
                onChange={(e) =>
                  setAssignSubjectData({
                    ...assignSubjectData,
                    periods_per_week: parseInt(e.target.value) || 1,
                  })
                }
                min="1"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Assign Subject
          </Button>
        </form>
      </Modal>

      {/* Assigned Subjects Section */}
      {!isGradeView && (
        <div className="glass rounded-3xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-primary">
              Assigned Subjects
            </h3>
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
            <p className="text-muted text-sm">
              No subjects assigned to this stream yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjectAssignments.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center group"
                >
                  <div>
                    <div className="font-bold text-primary">
                      {assignment.subject_name}
                    </div>
                    <div className="text-sm text-muted">
                      Teacher: {assignment.teacher_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-muted">
                      {assignment.academic_year}
                      <br />
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
