import { useState, useEffect, useMemo, type ChangeEvent } from "react";
import { Save, ChevronLeft, Download, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examsService } from "../api/services/examsService";
import { classesService } from "../api/services/classesService";
import { studentsService } from "../api/services/studentsService";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Select } from "../components/ui/Select";

interface StudentData {
  id: number;
  name: string;
  admission: string;
  score: number;
  grade?: string;
}

export const ExamMarksEntryPage = () => {
  const queryClient = useQueryClient();
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [selectedAssignmentName, setSelectedAssignmentName] =
    useState<string>("");
  const [localMarks, setLocalMarks] = useState<Record<number, number>>({});

  const { data: examsData, isLoading: loadingExams } = useQuery({
    queryKey: ["exams"],
    queryFn: () => examsService.getExams(),
  });

  const { data: assignmentsData, isLoading: loadingAssignments } = useQuery({
    queryKey: ["subject-assignments"],
    queryFn: () => classesService.getAssignments(),
  });

  const exams = useMemo(
    () => (Array.isArray(examsData) ? examsData : examsData?.results || []),
    [examsData],
  );

  const assignments = useMemo(
    () =>
      Array.isArray(assignmentsData)
        ? assignmentsData
        : assignmentsData?.results || [],
    [assignmentsData],
  );

  useEffect(() => {
    if (exams.length > 0 && !selectedExam)
      setSelectedExam(exams[0].id.toString());
  }, [exams, selectedExam]);

  useEffect(() => {
    if (assignments.length > 0 && !selectedSubject) {
      setSelectedSubject(assignments[0].subject.toString());
      setSelectedStream(assignments[0].stream.toString());
      setSelectedAssignmentName(
        `${assignments[0].subject_name} - ${assignments[0].grade_name} ${assignments[0].stream_name}`,
      );
    }
  }, [assignments, selectedSubject]);

  const { data: studentsRaw, isLoading: loadingStudents } = useQuery({
    queryKey: ["students", selectedStream],
    queryFn: () => studentsService.getAll({ stream: selectedStream }),
    enabled: !!selectedStream,
  });

  const { data: marksRaw, isLoading: loadingMarks } = useQuery({
    queryKey: ["marks", selectedExam, selectedSubject],
    queryFn: () => examsService.getMarks(selectedExam, selectedSubject),
    enabled: !!selectedExam && !!selectedSubject,
  });

  const students: StudentData[] = useMemo(() => {
    const sData = Array.isArray(studentsRaw)
      ? studentsRaw
      : studentsRaw?.results || [];
    const mData = Array.isArray(marksRaw) ? marksRaw : marksRaw?.results || [];

    return sData.map((s: any) => {
      const mark = mData.find((m: any) => m.student === s.id);
      const score =
        localMarks[s.id] !== undefined
          ? localMarks[s.id]
          : mark
            ? parseFloat(mark.score)
            : 0;

      return {
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        admission: s.admission_number,
        score,
        grade: mark ? mark.grade : "-",
      };
    });
  }, [studentsRaw, marksRaw, localMarks]);

  const updateScore = (id: number, score: string) => {
    const val = parseFloat(score) || 0;
    setLocalMarks((prev) => ({ ...prev, [id]: val }));
  };

  const saveMarksMutation = useMutation({
    mutationFn: (data: any) => examsService.saveMarks(data),
    onSuccess: () => {
      toast.success("Marks saved successfully!");
      queryClient.invalidateQueries({
        queryKey: ["marks", selectedExam, selectedSubject],
      });
      setLocalMarks({});
    },
    onError: () => {
      toast.error("Failed to save marks");
    },
  });

  const handleSave = () => {
    saveMarksMutation.mutate({
      exam: selectedExam,
      subject: selectedSubject,
      marks: students.map((s) => ({
        student_id: s.id,
        score: s.score,
      })),
    });
  };

  const loading = loadingExams || loadingAssignments;
  const fetchingStudents = loadingStudents || loadingMarks;
  const saving = saveMarksMutation.isPending;

  const exportToCSV = () => {
    if (students.length === 0) return;
    const csvContent = [
      ["Admission", "Name", "Score"].join(","),
      ...students.map((s) => [s.admission, `"${s.name}"`, s.score].join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marks_${selectedExam}.csv`;
    a.click();
  };

  const importFromCSV = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split("\n").slice(1); // skip header
      const newMarks = { ...localMarks };
      lines.forEach((line) => {
        const [admission, , scoreStr] = line.split(",");
        const score = parseFloat(scoreStr);
        const student = students.find((s) => s.admission === admission.trim());
        if (student && !isNaN(score)) {
          newMarks[student.id] = score;
        }
      });
      setLocalMarks(newMarks);
      toast.success("CSV imported successfully");
    };
    reader.readAsText(file);
    event.target.value = ""; // reset input
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link
          to="/exams"
          className="p-2 hover:bg-white/10 rounded-xl transition-all"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-muted" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary tracking-tight">
            Record Marks
          </h1>
          <p className="text-muted text-sm md:text-base">
            {selectedAssignmentName || "Select a class and subject below"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Select
          label="Examination"
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
        >
          {loading ? (
            <option value="" className="bg-bg-color">
              Loading examinations...
            </option>
          ) : exams.length === 0 ? (
            <option value="" className="bg-bg-color">
              No exams found
            </option>
          ) : (
            <>
              <option value="" className="bg-bg-color">
                Select an examination
              </option>
              {exams.map((e: any) => (
                <option key={e.id} value={e.id} className="bg-bg-color">
                  {e.name} ({e.academic_year})
                </option>
              ))}
            </>
          )}
        </Select>

        <Select
          label="Subject & Class"
          value={`${selectedSubject}-${selectedStream}`}
          onChange={(e) => {
            const [subjectId, streamId] = e.target.value.split("-");
            setSelectedSubject(subjectId);
            setSelectedStream(streamId);
            const selected = assignments.find(
              (a: any) =>
                a.subject.toString() === subjectId &&
                a.stream.toString() === streamId,
            );
            if (selected) {
              setSelectedAssignmentName(
                `${selected.subject_name} - ${selected.grade_name} ${selected.stream_name}`,
              );
            }
          }}
        >
          {loading ? (
            <option value="" className="bg-bg-color">
              Loading subjects...
            </option>
          ) : assignments.length === 0 ? (
            <option value="" className="bg-bg-color">
              No subjects assigned
            </option>
          ) : (
            <>
              <option value="" className="bg-bg-color">
                Select subject &amp; class
              </option>
              {assignments.map((as: any) => (
                <option
                  key={as.id}
                  value={`${as.subject}-${as.stream}`}
                  className="bg-bg-color"
                >
                  {as.subject_name} - {as.grade_name} {as.stream_name}
                </option>
              ))}
            </>
          )}
        </Select>

        <div className="glass p-5 md:p-6 rounded-3xl border border-white/5 flex items-end sm:col-span-2 lg:col-span-2">
          <div className="flex gap-2 w-full">
            <button
              onClick={handleSave}
              disabled={saving || fetchingStudents}
              className="flex-1 py-2.5 md:py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? "Saving..." : "Save All Marks"}
            </button>
            <button
              onClick={exportToCSV}
              disabled={students.length === 0}
              className="px-4 py-2.5 md:py-3 bg-white/5 hover:bg-white/10 text-primary rounded-xl border border-white/10 flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <label className="px-4 py-2.5 md:py-3 bg-white/5 hover:bg-white/10 text-primary rounded-xl border border-white/10 flex items-center gap-2 text-sm cursor-pointer">
              <Upload className="w-4 h-4" /> Import
              <input
                type="file"
                accept=".csv"
                onChange={importFromCSV}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Grade Distribution Chart */}
      {students.length > 0 && (
        <div className="glass p-6 rounded-3xl border border-white/5">
          <h3 className="text-sm font-bold text-muted mb-4">
            Grade Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(
                  students.reduce((acc: any, s) => {
                    const g = s.grade || "N/A";
                    acc[g] = (acc[g] || 0) + 1;
                    return acc;
                  }, {}),
                ).map(([grade, count]) => ({ grade, count }))}
              >
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 md:px-8 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
                  Student Details
                </th>
                <th className="px-6 md:px-8 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-center">
                  Score (out of 100)
                </th>
                <th className="px-6 md:px-8 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading || fetchingStudents ? (
                <TableSkeleton rows={10} cols={3} />
              ) : students.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-20 text-muted italic"
                  >
                    Select a subject and class to start recording marks.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={student.id}
                    className="hover:bg-white/[0.02] transition-all"
                  >
                    <td className="px-6 md:px-8 py-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary-500/10 flex items-center justify-center text-[10px] md:text-xs font-bold text-primary-400 shrink-0">
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">
                            {student.name}
                          </p>
                          <p className="text-xs text-dim truncate">
                            {student.admission}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 md:px-8 py-4">
                      <div className="flex justify-center">
                        <input
                          type="number"
                          value={student.score}
                          onChange={(e) =>
                            updateScore(student.id, e.target.value)
                          }
                          className="w-20 md:w-24 text-center bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-1.5 md:py-2 text-primary font-bold outline-none focus:ring-2 focus:ring-primary-500 text-sm md:text-base"
                          min="0"
                          max="100"
                        />
                      </div>
                    </td>
                    <td className="px-6 md:px-8 py-4">
                      <span
                        className={`px-2 md:px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold border ${
                          student.grade === "A" || student.grade === "A-"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : student.grade?.startsWith("B")
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : student.grade?.startsWith("C")
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {student.grade || "-"}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
