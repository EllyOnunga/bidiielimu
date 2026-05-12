import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Search,
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
  ChevronLeft,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import client from "../../api/client";

interface StudentMark {
  id: string;
  student_name: string;
  admission_number: string;
  score: string;
  grade?: string;
  out_of: number;
}

interface Exam {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  subject: string;
  subject_name: string;
  stream: string;
  stream_name: string;
  grade_name: string;
}

export const MarkEntryPage = () => {
  const queryClient = useQueryClient();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [marks, setMarks] = useState<StudentMark[]>([]);

  // 1. Fetch initial exams and assignments
  const { data: { exams = [], assignments = [] } = {} } = useQuery({
    queryKey: ["mark-entry-init"],
    queryFn: async () => {
      const [examsRes, assignmentsRes] = await Promise.all([
        client.get("exams/exams/"),
        client.get("classes/subject-assignments/"),
      ]);
      return {
        exams: Array.isArray(examsRes.data)
          ? examsRes.data
          : examsRes.data.results || [],
        assignments: Array.isArray(assignmentsRes.data)
          ? assignmentsRes.data
          : assignmentsRes.data.results || [],
      };
    },
  });

  // 2. Fetch marks when exam/subject/stream are selected
  const { data: initialMarks = [], isLoading: loading } = useQuery({
    queryKey: ["marks", selectedExam, selectedSubject, selectedStream],
    queryFn: async () => {
      if (!selectedExam || !selectedSubject || !selectedStream) return [];

      const [studentsRes, marksRes] = await Promise.all([
        client.get(`/students/?stream=${selectedStream}`),
        client.get(
          `exams/marks/?exam=${selectedExam}&subject=${selectedSubject}`,
        ),
      ]);

      const studentsData = Array.isArray(studentsRes.data)
        ? studentsRes.data
        : studentsRes.data.results || [];
      const existingMarks = Array.isArray(marksRes.data)
        ? marksRes.data
        : marksRes.data.results || [];

      return studentsData.map((s: any) => {
        const mark = existingMarks.find((m: any) => m.student === s.id);
        return {
          id: s.id,
          student_name: `${s.first_name} ${s.last_name}`,
          admission_number: s.admission_number,
          score: mark ? mark.score.toString() : "",
          grade: mark ? mark.grade : "-",
          out_of: 100,
        };
      });
    },
    enabled: !!(selectedExam && selectedSubject && selectedStream),
  });

  // Sync query data to local state for fast editing
  useEffect(() => {
    setMarks(initialMarks);
  }, [initialMarks]);

  // 3. Save Mutation (Optimistic UI)
  const saveMutation = useMutation({
    mutationFn: async (marksToSave: StudentMark[]) => {
      await client.post("exams/marks/bulk_save/", {
        exam: selectedExam,
        subject: selectedSubject,
        marks: marksToSave.map((m: StudentMark) => ({
          student_id: m.id,
          score: m.score || 0,
        })),
      });
    },
    onMutate: async (newMarks) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["marks", selectedExam, selectedSubject, selectedStream],
      });
      // Snapshot previous value
      const previousMarks = queryClient.getQueryData([
        "marks",
        selectedExam,
        selectedSubject,
        selectedStream,
      ]);
      // Optimistically update
      queryClient.setQueryData(
        ["marks", selectedExam, selectedSubject, selectedStream],
        newMarks,
      );
      const toastId = toast.loading("Saving marks...", { id: "save-marks" });
      return { previousMarks, toastId };
    },
    onError: (_err, _newMarks, context) => {
      // Rollback
      if (context?.previousMarks) {
        queryClient.setQueryData(
          ["marks", selectedExam, selectedSubject, selectedStream],
          context.previousMarks,
        );
        setMarks(context.previousMarks as StudentMark[]);
      }
      toast.error("Failed to save marks", { id: context?.toastId });
    },
    onSuccess: (_data, _variables, context) => {
      toast.success("Marks saved successfully!", { id: context?.toastId });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["marks", selectedExam, selectedSubject, selectedStream],
      });
    },
  });

  const handleScoreChange = (id: string, newScore: string) => {
    setMarks((prev) =>
      prev.map((m: StudentMark) =>
        m.id === id ? { ...m, score: newScore } : m,
      ),
    );
  };

  const handleSave = () => {
    if (!selectedExam || !selectedSubject) {
      toast.error("Please select an exam and subject first");
      return;
    }
    saveMutation.mutate(marks);
  };

  // Keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentIndex: number,
  ) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextInput = inputRefs.current[currentIndex + 1];
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevInput = inputRefs.current[currentIndex - 1];
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  const filteredMarks = marks.filter(
    (m) =>
      m.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.admission_number.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button className="p-2 sm:p-3 bg-white/5 rounded-2xl border border-white/5 text-muted hover:text-primary shrink-0">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary tracking-tighter">
              Bulk Mark Entry
            </h1>
            <p className="text-muted font-bold uppercase tracking-widest mt-1 text-[10px] sm:text-xs">
              Mathematics • Form 4 North • Term 2
            </p>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-white/5 border border-white/10 text-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all text-sm">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Import CSV</span>
            <span className="sm:hidden">Import</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex-1 md:flex-none px-4 sm:px-8 py-2.5 sm:py-3 bg-primary-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary-400 shadow-premium transition-all disabled:opacity-50 text-sm"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass p-4 sm:p-6 rounded-[28px] border border-white/5 flex flex-wrap gap-4 sm:gap-6 items-end">
        <div className="flex-1 min-w-[140px] space-y-2">
          <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">
            Examination
          </label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-2.5 sm:py-3 px-3 sm:px-4 text-primary text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
          >
            <option value="" className="bg-bg-color">
              Select Exam
            </option>
            {exams.map((e: Exam) => (
              <option key={e.id} value={e.id} className="bg-bg-color">
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[140px] space-y-2">
          <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">
            Subject & Stream
          </label>
          <select
            value={`${selectedSubject}-${selectedStream}`}
            onChange={(e) => {
              const [subjectId, streamId] = e.target.value.split("-");
              setSelectedSubject(subjectId);
              setSelectedStream(streamId);
            }}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-2.5 sm:py-3 px-3 sm:px-4 text-primary text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
          >
            <option value="" className="bg-bg-color">
              Select Class
            </option>
            {assignments.map((as: Assignment) => (
              <option
                key={as.id}
                value={`${as.subject}-${as.stream}`}
                className="bg-bg-color"
              >
                {as.subject_name} - {as.grade_name} {as.stream_name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:flex-[2] sm:min-w-[240px] space-y-2">
          <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">
            Filter Students
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-dim" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-2.5 sm:py-3 pl-10 sm:pl-12 pr-4 text-primary text-sm focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* Mark Grid */}
      <div className="glass rounded-[28px] sm:rounded-[40px] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-8 py-6 text-left text-[10px] font-black text-muted uppercase tracking-widest">
                  Student Details
                </th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-muted uppercase tracking-widest">
                  Admission No
                </th>
                <th className="px-8 py-6 text-center text-[10px] font-black text-muted uppercase tracking-widest">
                  Current Grade
                </th>
                <th className="px-8 py-6 text-center text-[10px] font-black text-muted uppercase tracking-widest">
                  Marks Entry (/{marks[0]?.out_of})
                </th>
                <th className="px-8 py-6 text-center text-[10px] font-black text-muted uppercase tracking-widest">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
                    <p className="text-primary-200/40 font-bold uppercase tracking-widest text-xs">
                      Fetching students...
                    </p>
                  </td>
                </tr>
              ) : filteredMarks.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-20 text-center text-primary-200/20 italic font-medium"
                  >
                    {!selectedExam || !selectedSubject
                      ? "Please select an exam and subject to begin."
                      : "No students found in this stream."}
                  </td>
                </tr>
              ) : (
                filteredMarks.map((m, index) => (
                  <tr
                    key={m.id}
                    className="border-b border-white/5 hover:bg-white/[0.01] transition-all group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary-400 font-black">
                          {m.student_name.charAt(0)}
                        </div>
                        <span className="text-white font-bold">
                          {m.student_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-primary-200/30 font-black text-xs">
                        {m.admission_number}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-3 py-1 bg-primary-500/10 text-primary-400 rounded-lg text-[10px] font-black uppercase">
                        {m.grade || "-"}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        <input
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          type="number"
                          value={m.score}
                          onChange={(e) =>
                            handleScoreChange(m.id, e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          className="w-24 bg-white/5 border border-white/10 rounded-xl py-3 text-center text-primary font-black text-lg focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all outline-none"
                        />
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {parseInt(m.score) > 0 ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle className="w-4 h-4" />
                          Recorded
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-rose-400 text-[10px] font-black uppercase tracking-widest">
                          <AlertCircle className="w-4 h-4" />
                          Pending
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 sm:px-8 py-5 sm:py-6 bg-primary-500/5 border border-primary-500/10 rounded-[24px] sm:rounded-[32px]">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary-500/20 flex items-center justify-center text-primary-400 shrink-0">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-primary font-bold text-sm">Batch Summary</p>
            <p className="text-muted text-xs">
              {filteredMarks.length} students loaded. Average: 85.7%
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 text-muted hover:text-primary transition-all text-xs font-black uppercase tracking-widest whitespace-nowrap">
          <Download className="w-4 h-4" />
          Export Sheet
        </button>
      </div>
    </div>
  );
};
