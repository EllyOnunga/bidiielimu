import { useState, useMemo, useEffect } from "react";
import {
  Download,
  ChevronLeft,
  Printer,
  Users,
  ShieldCheck,
  Star,
  Award,
  TrendingUp,
  Sparkles,
  Save,
  Settings,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsService } from "../api/services/studentsService";
import { schoolsService } from "../api/services/schoolsService";
import { reportsService } from "../api/services/reportsService";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/Button";

interface MarkRow {
  subject_id: number;
  subject_name: string;
  score: number;
  grade: string;
  points: number;
  remarks: string;
}

interface StudentInfo {
  name: string;
  admission: string;
  class: string;
  class_teacher: string;
  email: string;
  guardians?: { first_name: string; last_name: string; phone_number: string }[];
  photo: string | null;
  term: string;
  academic_year: string;
  marks: MarkRow[];
  attendance: {
    present_days: number;
    absent_days: number;
    total_days: number;
    percentage: number;
  };
  remarks: {
    teacher: string;
    principal: string;
    is_official: boolean;
  };
  summary: {
    total_score: number;
    mean_score: number;
    total_points: number;
    mean_grade: string;
    overall_remarks: string;
    class_position?: number;
    stream_position?: number;
    total_in_class?: number;
    total_in_stream?: number;
  };
}

export const ReportCardPage = () => {
  const { id: studentId } = useParams();
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const isStaff =
    user?.role === "TEACHER" ||
    user?.role === "PRINCIPAL" ||
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN";
  const isTeacher =
    user?.role === "TEACHER" ||
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN";
  const isPrincipal =
    user?.role === "PRINCIPAL" ||
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN";

  const { data: reportData, isLoading: fetchingReport } = useQuery({
    queryKey: ["report-card", studentId],
    queryFn: () => studentsService.getReportCard(Number(studentId)),
    enabled: !!studentId,
  });

  const { data: settingsData, isLoading: fetchingSettings } = useQuery({
    queryKey: ["school-settings"],
    queryFn: schoolsService.getSettings,
  });

  // Fetch student report card metadata (StudentReport)
  const { data: reportMetaList, isLoading: fetchingMeta } = useQuery({
    queryKey: ["report-meta", studentId, reportData?.exam?.id],
    queryFn: () =>
      reportsService.getReports({
        student: Number(studentId),
        exam: reportData?.exam?.id,
      }),
    enabled: !!studentId && !!reportData?.exam?.id,
  });

  const reportMeta = useMemo(() => {
    const data = reportMetaList;
    return Array.isArray(data) ? data[0] : data?.results?.[0] || null;
  }, [reportMetaList]);

  // Form states for Teacher and Principal remarks
  const [teacherComment, setTeacherComment] = useState("");
  const [principalComment, setPrincipalComment] = useState("");
  const [reportStatus, setReportStatus] = useState<string>("DRAFT");

  // Sync form states when metadata is loaded
  useEffect(() => {
    if (reportMeta) {
      setTeacherComment(reportMeta.teacher_comment || "");
      setPrincipalComment(reportMeta.principal_comment || "");
      setReportStatus(reportMeta.status || "DRAFT");
    } else if (reportData?.remarks) {
      setTeacherComment(reportData.remarks.teacher || "");
      setPrincipalComment(reportData.remarks.principal || "");
      setReportStatus(reportData.remarks.is_official ? "PUBLISHED" : "DRAFT");
    }
  }, [reportMeta, reportData]);

  const cleanInt = (v: any, fallback: number): number => {
    if (typeof v === "number") return v;
    if (!v) return fallback;
    const match = String(v).match(/\d+/);
    return match ? Number(match[0]) : fallback;
  };

  const saveReportMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        student: Number(studentId),
        exam: reportData?.exam?.id,
        term: cleanInt(reportData?.exam?.term, 1),
        academic_year: cleanInt(reportData?.exam?.academic_year, 2026),
        teacher_comment: teacherComment,
        principal_comment: principalComment,
        status: reportStatus as any,
      };

      if (reportMeta?.id) {
        return reportsService.updateReport(reportMeta.id, payload);
      } else {
        return reportsService.createReport(payload);
      }
    },
    onSuccess: () => {
      toast.success("Student remarks saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["report-card", studentId] });
      queryClient.invalidateQueries({
        queryKey: ["report-meta", studentId, reportData?.exam?.id],
      });
    },
    onError: () => {
      toast.error("Failed to save remarks.");
    },
  });

  const aiDraftMutation = useMutation({
    mutationFn: async () => {
      let reportId = reportMeta?.id;
      if (!reportId) {
        // Initialize draft report first
        const init = await reportsService.createReport({
          student: Number(studentId),
          exam: reportData?.exam?.id,
          term: cleanInt(reportData?.exam?.term, 1),
          academic_year: cleanInt(reportData?.exam?.academic_year, 2026),
          status: "DRAFT",
        });
        reportId = init.id;
      }
      return reportsService.generateAIDraft(reportId);
    },
    onSuccess: (data: any) => {
      toast.success("AI draft generated successfully!");
      setTeacherComment(data.ai_comment_draft || data.detail || "");
      queryClient.invalidateQueries({ queryKey: ["report-card", studentId] });
      queryClient.invalidateQueries({
        queryKey: ["report-meta", studentId, reportData?.exam?.id],
      });
    },
    onError: () => {
      toast.error("Failed to generate AI draft remarks");
    },
  });

  const fetching = fetchingReport || fetchingSettings || fetchingMeta;

  const studentData: StudentInfo = reportData
    ? {
        name: reportData.student.name,
        admission: reportData.student.admission_number,
        class: reportData.student.grade_level
          ? `${reportData.student.grade_level} ${reportData.student.stream || ""}`
          : "",
        class_teacher: reportData.student.class_teacher || "",
        email: reportData.student.email || "",
        guardians: reportData.student.guardians || [],
        photo: reportData.student.photo || null,
        term: reportData.exam.term,
        academic_year: reportData.exam.academic_year,
        marks: reportData.results,
        summary: reportData.summary,
        attendance: reportData.attendance,
        remarks: reportData.remarks,
      }
    : {
        name: "",
        admission: "",
        class: "",
        class_teacher: "",
        email: "",
        guardians: [],
        photo: null,
        term: "",
        academic_year: "",
        marks: [],
        attendance: {
          present_days: 0,
          absent_days: 0,
          total_days: 0,
          percentage: 0,
        },
        remarks: { teacher: "", principal: "", is_official: false },
        summary: {
          total_score: 0,
          mean_score: 0,
          total_points: 0,
          mean_grade: "",
          overall_remarks: "",
        },
      };

  const schoolInfo = {
    name: settingsData?.school_name || "",
    address: settingsData?.school_address || "",
    email: settingsData?.school_email || "",
    logo: settingsData?.school_logo || null,
    principalName: settingsData?.principal_name || "",
    motto: settingsData?.school_motto || "Elite Excellence in Education",
    accentColor: settingsData?.accent_color || "#3b82f6",
  };

  const generatePDF = async () => {
    setLoading(true);
    const element = document.getElementById("report-card");
    if (!element) return;
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        "FAST",
      );
      pdf.save(`Official_Report_${studentData.admission}.pdf`);
      toast.success("Document downloaded successfully");
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-24"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 print:hidden">
        <div className="flex items-center gap-6">
          <Link
            to={
              user?.role === "PARENT" || user?.role === "STUDENT"
                ? "/portal"
                : "/students"
            }
            className="p-4 bg-white/5 hover:bg-white/10 rounded-[20px] transition-all border border-white/5 group"
          >
            <ChevronLeft className="w-6 h-6 text-muted group-hover:text-primary transition-colors" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tight leading-none mb-2">
              Student <span className="text-gradient">Report Card</span>
            </h1>
            <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">
              {fetching
                ? "Loading Report Card..."
                : `Official record for ${studentData.name}`}
            </p>
          </div>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <Button
            variant="ghost"
            onClick={() => window.print()}
            className="flex-1 lg:flex-none h-14 px-8 rounded-2xl gap-2 text-[10px] font-black uppercase tracking-widest border-white/10"
          >
            <Printer className="w-5 h-5" /> Print Report
          </Button>
          <Button
            onClick={generatePDF}
            disabled={loading || fetching}
            className="flex-1 lg:flex-none h-14 px-8 rounded-2xl gap-2 text-[10px] font-black uppercase tracking-widest shadow-premium"
          >
            <Download className="w-5 h-5" />{" "}
            {loading ? "Generating..." : "Download Official PDF"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Appraisal Editor Panel (Visible only to teachers and administrators) */}
        {isStaff && (
          <div className="xl:col-span-4 space-y-6 print:hidden">
            <div className="premium-card p-6 sm:p-8 space-y-6 border-white/10 bg-white/[0.02] backdrop-blur-xl">
              <div>
                <h3 className="text-base font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary-400" />
                  Appraisal Desk
                </h3>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">
                  Add student remarks & change report status
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-slate-400">
                  Report Status
                </span>
                <span
                  className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                    reportStatus === "PUBLISHED"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                      : reportStatus === "APPROVED"
                        ? "bg-blue-500/15 text-blue-400 border-blue-500/20"
                        : reportStatus === "REVIEWED"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                          : "bg-white/10 text-muted border-white/15"
                  }`}
                >
                  {reportStatus}
                </span>
              </div>

              {/* Class Teacher Section */}
              <div className="space-y-3.5 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Class Teacher's Remarks
                  </label>
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => aiDraftMutation.mutate()}
                      disabled={aiDraftMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1 bg-primary-600/10 hover:bg-primary-600/20 border border-primary-500/20 text-[9px] font-black text-primary-400 uppercase tracking-widest rounded-xl transition-all"
                    >
                      <Sparkles className="w-3 h-3 text-primary-400" />
                      {aiDraftMutation.isPending ? "Drafting..." : "AI Assist"}
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={teacherComment}
                  onChange={(e) => setTeacherComment(e.target.value)}
                  disabled={!isTeacher}
                  placeholder={
                    isTeacher
                      ? "Write encouraging terminal comments about the student's performance..."
                      : "Class teacher comments can only be entered by the class teacher..."
                  }
                  className="w-full bg-white/5 border border-white/10 text-primary p-4 rounded-2xl outline-none focus:border-primary-500 transition-all text-xs font-semibold leading-relaxed placeholder:text-muted/30"
                />
              </div>

              {/* Head Teacher / Principal Section */}
              <div className="space-y-3.5 pt-4 border-t border-white/5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  Head Teacher / Principal Remarks
                </label>
                <textarea
                  rows={4}
                  value={principalComment}
                  onChange={(e) => setPrincipalComment(e.target.value)}
                  disabled={!isPrincipal}
                  placeholder={
                    isPrincipal
                      ? "Write principal's standard terminal assessment..."
                      : "Head teacher comments can only be entered by administrators or head teacher..."
                  }
                  className="w-full bg-white/5 border border-white/10 text-primary p-4 rounded-2xl outline-none focus:border-primary-500 transition-all text-xs font-semibold leading-relaxed placeholder:text-muted/30"
                />
              </div>

              {/* Report Workflow / Status Change */}
              {isPrincipal && (
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Set Report Workflow
                  </label>
                  <select
                    value={reportStatus}
                    onChange={(e) => setReportStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 text-primary px-4 py-3 rounded-2xl outline-none text-xs font-bold"
                  >
                    <option value="DRAFT">DRAFT (Work In Progress)</option>
                    <option value="REVIEWED">
                      REVIEWED (Teacher Remarks Ready)
                    </option>
                    <option value="APPROVED">
                      APPROVED (Ready for Release)
                    </option>
                    <option value="PUBLISHED">
                      PUBLISHED (Release to Parents)
                    </option>
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <Button
                onClick={() => saveReportMutation.mutate()}
                disabled={saveReportMutation.isPending}
                className="w-full h-13 rounded-2xl gap-2 font-black uppercase tracking-widest text-[10px] shadow-glow-sm"
              >
                <Save className="w-4 h-4" />
                {saveReportMutation.isPending
                  ? "Saving..."
                  : "Save & Update Appraisal"}
              </Button>
            </div>
          </div>
        )}

        {/* Report Card A4 Sheet */}
        <div
          className={`${isStaff ? "xl:col-span-8" : "xl:col-span-12"} flex justify-center w-full`}
        >
          <div
            id="report-card"
            className="w-full max-w-[210mm] bg-white text-slate-900 p-16 shadow-[0_40px_100px_rgba(0,0,0,0.4)] relative overflow-hidden flex flex-col min-h-[297mm]"
          >
            {/* Watermark/Texture */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none overflow-hidden flex items-center justify-center rotate-12">
              <div className="grid grid-cols-4 gap-20">
                {Array.from({ length: 40 }).map((_, i) => (
                  <ShieldCheck key={i} className="w-40 h-40" />
                ))}
              </div>
            </div>

            <div className="relative z-10 flex flex-col flex-1">
              {/* Header */}
              <div
                className="flex items-center justify-between border-b-4 pb-10 mb-12"
                style={{ borderColor: schoolInfo.accentColor }}
              >
                <div className="flex items-center gap-8">
                  <div
                    className="w-24 h-24 rounded-[32px] flex items-center justify-center text-white font-black text-4xl overflow-hidden shadow-xl"
                    style={{ backgroundColor: schoolInfo.accentColor }}
                  >
                    {schoolInfo.logo ? (
                      <img
                        src={schoolInfo.logo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      schoolInfo.name[0]
                    )}
                  </div>
                  <div className="space-y-1">
                    <h2
                      className="text-3xl font-black uppercase tracking-tight"
                      style={{ color: schoolInfo.accentColor }}
                    >
                      {schoolInfo.name}
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-3">
                      "{schoolInfo.motto}"
                    </p>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      {schoolInfo.address} • {schoolInfo.email}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                    Official Report Card
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1">
                    {studentData.term}
                  </h3>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Academic Year {studentData.academic_year}
                  </p>
                </div>
              </div>

              {/* Profile Grid */}
              <div className="grid grid-cols-12 gap-10 mb-12 bg-slate-50 p-10 rounded-[40px] border border-slate-100 shadow-sm relative">
                <div className="col-span-3">
                  <div className="aspect-square bg-slate-200 rounded-[32px] overflow-hidden border-4 border-white shadow-lg">
                    {studentData.photo ? (
                      <img
                        src={studentData.photo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <Users className="w-16 h-16 text-slate-300" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-9 grid grid-cols-2 gap-y-8 gap-x-12">
                  <ProfileMetric
                    label="Student Name"
                    value={studentData.name}
                    large
                  />
                  <ProfileMetric
                    label="Admission Number"
                    value={studentData.admission}
                    large
                  />
                  <ProfileMetric
                    label="Class Stream"
                    value={studentData.class}
                  />
                  <ProfileMetric
                    label="Academic Year"
                    value={studentData.academic_year}
                  />
                  <ProfileMetric
                    label="Attendance Rate"
                    value={`${studentData.attendance.percentage}% (${studentData.attendance.present_days}/${studentData.attendance.total_days} Days)`}
                  />
                  <ProfileMetric
                    label="Class Teacher"
                    value={studentData.class_teacher}
                  />
                </div>
              </div>

              {/* Assessment Grid */}
              <div className="flex-1 mb-12">
                <table className="w-full border-collapse">
                  <thead>
                    <tr
                      className="text-white"
                      style={{ backgroundColor: schoolInfo.accentColor }}
                    >
                      <th className="p-6 text-left text-[10px] font-black uppercase tracking-[0.3em] rounded-tl-[24px]">
                        Subject
                      </th>
                      <th className="p-6 text-center text-[10px] font-black uppercase tracking-[0.3em]">
                        Marks (%)
                      </th>
                      <th className="p-6 text-center text-[10px] font-black uppercase tracking-[0.3em]">
                        Grade
                      </th>
                      <th className="p-6 text-left text-[10px] font-black uppercase tracking-[0.3em] rounded-tr-[24px]">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 border-x border-slate-100">
                    {studentData.marks.map((m, i) => (
                      <tr
                        key={i}
                        className={i % 2 === 1 ? "bg-slate-50/50" : "bg-white"}
                      >
                        <td className="p-6 font-black text-slate-800 uppercase text-sm tracking-tight">
                          {m.subject_name}
                        </td>
                        <td
                          className="p-6 text-center font-black text-xl tracking-tighter"
                          style={{ color: schoolInfo.accentColor }}
                        >
                          {m.score}
                        </td>
                        <td className="p-6 text-center">
                          <span className="w-12 h-12 inline-flex items-center justify-center bg-slate-900 text-white rounded-xl font-black text-lg shadow-md">
                            {m.grade}
                          </span>
                        </td>
                        <td className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 leading-relaxed italic">
                          {m.remarks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white border-t-4 border-white">
                      <td className="p-8 font-black text-lg uppercase tracking-tight rounded-bl-[24px]">
                        Academic Summary
                      </td>
                      <td className="p-8 text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Mean Marks
                        </p>
                        <p className="text-3xl font-black tracking-tighter">
                          {studentData.summary.mean_score}
                        </p>
                      </td>
                      <td className="p-8 text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Mean Grade
                        </p>
                        <p className="text-3xl font-black tracking-tighter text-blue-400">
                          {studentData.summary.mean_grade}
                        </p>
                      </td>
                      <td className="p-8 rounded-br-[24px]">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Class Teacher's Remarks
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] line-clamp-3">
                          {teacherComment ||
                            studentData.summary.overall_remarks ||
                            "No teacher comment provided."}
                        </p>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Performance Ranks */}
              <div className="grid grid-cols-3 gap-8 mb-12">
                <RankCard
                  icon={Star}
                  label="Class Position"
                  value={studentData.summary.class_position}
                  total={studentData.summary.total_in_class}
                  color="indigo"
                />
                <RankCard
                  icon={Award}
                  label="Stream Position"
                  value={studentData.summary.stream_position}
                  total={studentData.summary.total_in_stream}
                  color="emerald"
                />
                <RankCard
                  icon={TrendingUp}
                  label="Points"
                  value={studentData.summary.total_points}
                  total={null}
                  color="amber"
                />
              </div>

              {/* Appraisals */}
              <div className="grid grid-cols-2 gap-10 mb-16">
                <div className="space-y-4">
                  <AppraisalBox
                    label="Class Teacher's Remarks"
                    remark={teacherComment || studentData.remarks.teacher}
                  />
                  <AppraisalBox
                    label="Head Teacher's Remarks"
                    remark={principalComment || studentData.remarks.principal}
                  />
                </div>
                <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-100 flex flex-col items-center justify-center text-center">
                  <ShieldCheck className="w-16 h-16 text-slate-200 mb-4" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
                    School Certificate
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed max-w-xs">
                    This is an official report card issued by {schoolInfo.name}.
                    Any unauthorized modification is strictly prohibited.
                  </p>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-auto grid grid-cols-3 gap-16 pt-12 border-t-2 border-slate-100">
                <Signature
                  label="Class Teacher"
                  name={studentData.class_teacher}
                />
                <Signature
                  label="Head Teacher"
                  name={schoolInfo.principalName}
                />
                <Signature
                  label="Date of Issuance"
                  name={new Date().toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProfileMetric = ({ label, value, large }: any) => (
  <div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1.5">
      {label}
    </p>
    <p
      className={`${large ? "text-xl" : "text-base"} font-black text-slate-800 uppercase tracking-tight`}
    >
      {value || "—"}
    </p>
  </div>
);

const RankCard = ({ icon: Icon, label, value, total, color }: any) => (
  <div
    className={`p-8 bg-${color}-50 rounded-[32px] border border-${color}-100 flex flex-col items-center text-center`}
  >
    <div
      className={`w-12 h-12 rounded-2xl bg-${color}-500/10 flex items-center justify-center text-${color}-600 mb-4 border border-${color}-500/10`}
    >
      <Icon className="w-6 h-6" />
    </div>
    <p
      className={`text-[9px] font-black uppercase tracking-[0.3em] text-${color}-400 mb-1`}
    >
      {label}
    </p>
    <p className={`text-2xl font-black text-${color}-700 tracking-tighter`}>
      {value}
      {total ? ` / ${total}` : ""}
    </p>
  </div>
);

const AppraisalBox = ({ label, remark }: any) => (
  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">
      {label}
    </p>
    <p className="text-xs font-black text-slate-600 uppercase tracking-widest leading-relaxed italic">
      "{remark || "No appraisal recorded."}"
    </p>
  </div>
);

const Signature = ({ label, name }: any) => (
  <div className="text-center">
    <div className="h-16 flex items-end justify-center border-b-2 border-slate-200 pb-2 mb-4">
      <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
        {name}
      </span>
    </div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
      {label}
    </p>
  </div>
);

export default ReportCardPage;
