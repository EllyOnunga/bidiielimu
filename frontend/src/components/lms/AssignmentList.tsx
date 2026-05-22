import { useState, useEffect } from "react";
import {
  BookOpen,
  Clock,
  FileText,
  Upload,
  Send,
  ChevronRight,
  Plus,
  Users,
  Download,
  MessageSquare,
} from "lucide-react";
import { lmsService } from "../../api/services/lmsService";
import { teachersService } from "../../api/services/teachersService";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { useQuery } from "@tanstack/react-query";
import { classesService } from "../../api/services/classesService";
import { DiscussionPanel } from "./DiscussionPanel";

const getFileUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  // Get base URL from client or environment
  const apiBase = import.meta.env.VITE_API_URL || "";
  const baseUrl = apiBase.split("/api/v1")[0];

  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

interface Assignment {
  id: string;
  title: string;
  subject_name: string;
  stream_name?: string;
  due_date: string;
  max_score: number;
  description: string;
  file?: string;
  submission_count?: number;
  status?: string;
  student_grade?: number;
  student_feedback?: string;
  student_text_content?: string;
  student_file_url?: string;
  created_at?: string;
}

interface Submission {
  id: number;
  assignment_title: string;
  student_name: string;
  text_content?: string;
  file?: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  is_graded: boolean;
  max_score: number;
}

export const AssignmentList = () => {
  const user = useAuthStore((state) => state.user);
  const isTeacher =
    user?.role === "TEACHER" ||
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN";

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [gradingData, setGradingData] = useState({ score: "", feedback: "" });
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);

  const [formData, setFormData] = useState<{
    subject: string;
    stream: string;
    title: string;
    description: string;
    due_date: string;
    max_score: number;
    file: File | null;
    teacher: string;
  }>({
    subject: "",
    stream: "",
    title: "",
    description: "",
    due_date: "",
    max_score: 100,
    file: null,
    teacher: "",
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await teachersService.getAll();
      return Array.isArray(res) ? res : res.results || [];
    },
    enabled: isTeacher && user?.role !== "TEACHER", // Only for admins
  });

  const { data: grades = [] } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      const data = await classesService.getGrades();
      return data.results || data;
    },
    enabled: isTeacher,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const data = await classesService.getSubjects();
      return data.results || data;
    },
    enabled: isTeacher,
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignment) {
      if (isTeacher) {
        fetchSubmissions(selectedAssignment.id);
      } else {
        setSubmissionText(selectedAssignment.student_text_content || "");
        setSubmissionFile(null);
      }
    } else {
      setSubmissionText("");
      setSubmissionFile(null);
    }
  }, [selectedAssignment, isTeacher]);

  const fetchAssignments = async () => {
    try {
      const res = await lmsService.getAssignments();
      const data = res.results || res;
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Assignment load error:", err);
      toast.error("Failed to load assignments");
      setAssignments([]);
    }
  };

  const fetchSubmissions = async (assignmentId: string) => {
    try {
      const res = await lmsService.getSubmissions(assignmentId);
      const data = res.results || res;
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load submissions");
    }
  };

  const handleGrade = async () => {
    if (!selectedSubmission) return;
    setIsSubmitting(true);
    try {
      await lmsService.gradeSubmission({
        submission_id: selectedSubmission.id,
        grade: gradingData.score,
        feedback: gradingData.feedback,
      });
      toast.success("Grade submitted successfully");
      setIsGradingModalOpen(false);
      setSelectedSubmission(null);
      if (selectedAssignment) fetchSubmissions(selectedAssignment.id);
      fetchAssignments();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to submit grade");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        // Don't append if value is null or empty string (for IDs)
        if (value !== null && value !== "") {
          data.append(key, value instanceof File ? value : String(value));
        }
      });

      await lmsService.createAssignment(data);

      toast.success("Assignment created successfully!");
      setIsCreateModalOpen(false);
      setFormData({
        subject: "",
        stream: "",
        title: "",
        description: "",
        due_date: "",
        max_score: 100,
        file: null,
        teacher: "",
      });
      fetchAssignments();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.teacher ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to create assignment";
      toast.error(
        typeof errorMsg === "string" ? errorMsg : "Check required fields",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting assignment...");
    try {
      const data = new FormData();
      data.append("text_content", submissionText);
      if (submissionFile) {
        data.append("file", submissionFile);
      }

      await lmsService.submitAssignment(selectedAssignment.id, data);

      toast.success("Assignment submitted successfully!", { id: toastId });
      setSelectedAssignment(null);
      setSubmissionText("");
      setSubmissionFile(null);
      fetchAssignments();
    } catch (err) {
      toast.error("Submission failed", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-primary flex items-center gap-3">
            <BookOpen className="text-primary-400" />
            {isTeacher ? "My Active Assignments" : "Active Assignments"}
          </h2>
          {isTeacher && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-2 rounded-2xl px-6 w-full sm:w-auto shrink-0"
            >
              <Plus className="w-5 h-5" />
              Create Assignment
            </Button>
          )}
        </div>

        {assignments.length === 0 ? (
          <div className="glass p-12 rounded-[32px] border border-white/5 text-center">
            <p className="text-primary-200/40 font-bold">
              No active assignments found.
            </p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
              onClick={() => setSelectedAssignment(assignment)}
              className={`glass p-6 rounded-[24px] border transition-all cursor-pointer group ${
                selectedAssignment?.id === assignment.id
                  ? "border-primary-500/50 bg-primary-500/5"
                  : "border-white/5 hover:border-white/20"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary group-hover:text-primary-400 transition-colors">
                      {assignment.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted font-bold uppercase tracking-wider">
                        {assignment.subject_name}
                      </span>
                      {assignment.stream_name && (
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-muted font-bold">
                          Class: {assignment.stream_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-400/10 px-3 py-1 rounded-full w-fit ml-auto">
                    <Clock className="w-3 h-3" />
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </div>
                  {isTeacher ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary-400 bg-primary-400/10 px-3 py-1 rounded-full w-fit ml-auto">
                      <Users className="w-3 h-3" />
                      {assignment.submission_count || 0} Submissions
                    </div>
                  ) : assignment.status === "graded" &&
                    assignment.student_grade !== null ? (
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                        Score: {assignment.student_grade}/{assignment.max_score}
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full w-fit ml-auto ${
                        assignment.status === "submitted"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {assignment.status || "Pending"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail & Submission Form */}
      <div className="lg:col-span-1">
        <div className="glass p-8 rounded-[32px] border border-white/10 sticky top-8">
          {selectedAssignment ? (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">
                  Assignment Detail
                </span>
                <h3 className="text-xl font-black text-primary mt-1">
                  {selectedAssignment.title}
                </h3>
                <p className="text-sm text-muted mt-4 leading-relaxed">
                  {selectedAssignment.description}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedAssignment.file && (
                    <a
                      href={getFileUrl(selectedAssignment.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-bold text-primary-400 hover:text-primary-300 transition-all bg-primary-400/10 w-fit px-3 py-1.5 rounded-lg border border-primary-500/20"
                    >
                      <Download className="w-4 h-4" />
                      Instructions
                    </a>
                  )}
                  <button
                    onClick={() => setIsDiscussionOpen(true)}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all bg-indigo-400/10 w-fit px-3 py-1.5 rounded-lg border border-indigo-500/20"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Discuss Assignment
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-center flex-1">
                  <p className="text-[10px] text-dim uppercase font-black">
                    Max Points
                  </p>
                  <p className="text-lg font-black text-primary">
                    {selectedAssignment.max_score}
                  </p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center flex-1">
                  <p className="text-[10px] text-dim uppercase font-black">
                    {isTeacher ? "Submissions" : "Status"}
                  </p>
                  {isTeacher ? (
                    <div className="text-lg font-black text-primary">
                      {selectedAssignment.submission_count || 0}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div
                        className={`text-xs font-black uppercase px-3 py-1 rounded-full inline-block mt-1 ${
                          selectedAssignment.status === "graded"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : selectedAssignment.status === "submitted"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {selectedAssignment.status || "Pending"}
                      </div>
                      {selectedAssignment.status === "graded" &&
                        selectedAssignment.student_grade !== null && (
                          <p className="text-lg font-black text-primary mt-2">
                            {selectedAssignment.student_grade}{" "}
                            <span className="text-[10px] text-dim">
                              / {selectedAssignment.max_score}
                            </span>
                          </p>
                        )}
                    </div>
                  )}
                </div>
              </div>

              {/* Student Feedback Section */}
              {!isTeacher &&
                selectedAssignment.status === "graded" &&
                selectedAssignment.student_feedback && (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">
                      Teacher Feedback
                    </h4>
                    <p className="text-sm text-primary italic leading-relaxed">
                      "{selectedAssignment.student_feedback}"
                    </p>
                  </div>
                )}

              {isTeacher && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h4 className="text-sm font-black text-primary uppercase">
                      Submissions
                    </h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => fetchSubmissions(selectedAssignment.id)}
                      className="text-[10px] h-7"
                    >
                      Refresh List
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {submissions.length === 0 ? (
                      <p className="text-xs text-primary-200/40 py-4 text-center">
                        No submissions yet.
                      </p>
                    ) : (
                      submissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-primary-500/30 transition-all"
                        >
                          <div>
                            <p className="text-xs font-bold text-primary">
                              {sub.student_name}
                            </p>
                            <p className="text-[10px] text-dim">
                              {new Date(sub.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {sub.is_graded ? (
                              <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-400/10 px-2 py-0.5 rounded">
                                {sub.grade}/{sub.max_score}
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedSubmission(sub);
                                  setGradingData({
                                    score: String(sub.grade || ""),
                                    feedback: sub.feedback || "",
                                  });
                                  setIsGradingModalOpen(true);
                                }}
                                className="text-[10px] h-7 px-3 bg-primary-500 hover:bg-primary-600"
                              >
                                Grade
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {!isTeacher && (
                <div className="space-y-6">
                  {selectedAssignment?.status === "graded" ? (
                    <div className="space-y-6">
                      <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-rose-400 text-sm font-bold flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                          <span>Submission Locked</span>
                        </div>
                        <span className="text-xs text-muted font-normal">
                          This assignment has been graded. Further submissions
                          or modifications are disabled.
                        </span>
                      </div>

                      <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-muted tracking-wider">
                          Your Final Response
                        </h4>
                        <p className="text-xs text-primary bg-white/5 p-4 rounded-2xl whitespace-pre-wrap leading-relaxed">
                          {selectedAssignment.student_text_content ||
                            "No response text submitted."}
                        </p>
                        {selectedAssignment.student_file_url && (
                          <div className="flex items-center justify-between border-t border-white/5 pt-4">
                            <span className="text-[10px] uppercase font-black text-muted tracking-wider">
                              Final Attachment
                            </span>
                            <a
                              href={getFileUrl(
                                selectedAssignment.student_file_url,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-400 hover:text-primary-300 font-bold flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" /> Download File
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {selectedAssignment?.status === "submitted" && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>
                            Submitted! You can update your response until it is
                            graded.
                          </span>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-bold text-dim mb-2 block ml-1">
                          Your Submission
                        </label>
                        <textarea
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                          placeholder="Type your response here..."
                          className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-primary placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all resize-none"
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-bold text-dim mb-2 block ml-1">
                          Attachment (Optional)
                        </label>
                        <div
                          onClick={() =>
                            document.getElementById("submission-file")?.click()
                          }
                          className="flex items-center gap-3 p-4 border-2 border-dashed border-white/10 rounded-2xl hover:border-primary-500/30 cursor-pointer transition-all group"
                        >
                          <Upload className="w-5 h-5 text-dim group-hover:text-primary-400" />
                          <span className="text-xs font-bold text-muted group-hover:text-primary">
                            {submissionFile
                              ? submissionFile.name
                              : "Attach new file (PDF/Image)"}
                          </span>
                          <input
                            id="submission-file"
                            type="file"
                            className="hidden"
                            onChange={(e) =>
                              setSubmissionFile(e.target.files?.[0] || null)
                            }
                          />
                        </div>

                        {selectedAssignment?.student_file_url && (
                          <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] text-muted font-bold uppercase tracking-wider">
                              Current File Attachment:
                            </span>
                            <a
                              href={getFileUrl(
                                selectedAssignment.student_file_url,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-400 hover:underline flex items-center gap-1 font-bold"
                            >
                              <Download className="w-3.5 h-3.5" /> View Current
                              Attachment
                            </a>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black shadow-premium transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        <Send className="w-5 h-5" />
                        {selectedAssignment?.status === "submitted"
                          ? "Update Submission"
                          : "Submit Assignment"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChevronRight className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-primary font-bold">Select an assignment</p>
              <p className="text-sm text-muted mt-2">
                Choose from the list to view details and{" "}
                {isTeacher ? "review submissions." : "submit your work."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Prepare New Assignment"
        className="max-w-2xl"
      >
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Subject"
              required
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
            >
              <option value="" className="bg-bg-color">
                Select Subject
              </option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id} className="bg-bg-color">
                  {s.name}
                </option>
              ))}
            </Select>

            {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
              <Select
                label="Assigned Teacher"
                required
                value={formData.teacher}
                onChange={(e) =>
                  setFormData({ ...formData, teacher: e.target.value })
                }
              >
                <option value="" className="bg-bg-color">
                  Select Teacher
                </option>
                {teachers.map((t: any) => (
                  <option key={t.id} value={t.id} className="bg-bg-color">
                    {t.full_name || `${t.first_name} ${t.last_name}`}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <Select
            label="Target Class"
            value={formData.stream}
            onChange={(e) =>
              setFormData({ ...formData, stream: e.target.value })
            }
          >
            <option value="" className="bg-bg-color">
              Select Class
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
          </Select>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-muted ml-1">
              Assignment Title
            </label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Introduction to Quadratic Equations"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-muted ml-1">
              Description & Instructions
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Provide detailed instructions for the students..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-muted ml-1">
              Attachment (PDF/Image)
            </label>
            <input
              type="file"
              onChange={(e) =>
                setFormData({ ...formData, file: e.target.files?.[0] || null })
              }
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-muted ml-1">
                Due Date
              </label>
              <input
                required
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-muted ml-1">
                Max Score
              </label>
              <input
                required
                type="number"
                value={formData.max_score}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_score: parseInt(e.target.value),
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest"
          >
            {isSubmitting ? "Creating..." : "Create Assignment"}
          </Button>
        </form>
      </Modal>
      {/* Grading Modal */}
      <Modal
        isOpen={isGradingModalOpen}
        onClose={() => setIsGradingModalOpen(false)}
        title={`Grade Submission: ${selectedSubmission?.student_name}`}
      >
        <div className="space-y-6">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-2">
              Student Response
            </h4>
            <p className="text-sm text-primary whitespace-pre-wrap leading-relaxed">
              {selectedSubmission?.text_content || "No text provided."}
            </p>
            {selectedSubmission?.file && (
              <a
                href={getFileUrl(selectedSubmission.file)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 text-xs font-bold text-primary-400 hover:text-primary-300 transition-all bg-primary-400/10 w-fit px-3 py-1.5 rounded-lg"
              >
                <Download className="w-4 h-4" />
                Download Attachment
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-muted ml-1">
                Score (Max: {selectedSubmission?.max_score})
              </label>
              <input
                type="number"
                value={gradingData.score}
                onChange={(e) =>
                  setGradingData({ ...gradingData, score: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-end">
              <p className="text-[10px] text-dim mb-4 ml-2 italic">
                Student will see this score instantly.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-muted ml-1">
              Feedback
            </label>
            <textarea
              value={gradingData.feedback}
              onChange={(e) =>
                setGradingData({ ...gradingData, feedback: e.target.value })
              }
              placeholder="Good work! Pay attention to..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-primary outline-none focus:ring-2 focus:ring-primary-500 h-32 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsGradingModalOpen(false)}
              className="flex-1 rounded-2xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGrade}
              isLoading={isSubmitting}
              className="flex-1 bg-primary-500 hover:bg-primary-600 rounded-2xl font-black uppercase tracking-widest text-xs"
            >
              Submit Grade
            </Button>
          </div>
        </div>
      </Modal>

      <DiscussionPanel
        isOpen={isDiscussionOpen}
        onClose={() => setIsDiscussionOpen(false)}
        assignmentId={selectedAssignment?.id}
        title={selectedAssignment?.title || ""}
      />
    </div>
  );
};
