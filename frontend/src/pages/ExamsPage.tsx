import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  Calendar,
  Award,
  ChevronRight,
  Edit3,
  Trash2,
  Search,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import { examsService, type Exam } from "../api/services/examsService";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { Skeleton } from "../components/ui/Skeleton";
import { Select } from "../components/ui/Select";
import { motion, AnimatePresence } from "framer-motion";

const ExamCard = ({
  id,
  name,
  start_date,
  end_date,
  is_published,
  term,
  onDelete,
  onRank,
}: {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_published: boolean;
  term: string;
  onDelete?: () => void;
  onRank?: () => void;
}) => (
  <motion.div
    layout
    whileHover={{ y: -4 }}
    className="premium-card group hover:bg-white/[0.04] transition-all relative overflow-hidden"
  >
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 relative z-10">
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary-600/10 flex items-center justify-center text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-premium shrink-0">
        <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="text-base sm:text-xl font-black text-primary uppercase tracking-tight truncate leading-tight">
              {name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                  is_published
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
              >
                {is_published ? "Active" : "Draft"}
              </span>
              <span className="text-[9px] font-black text-primary-200/20 uppercase tracking-widest">
                • {term.replace("_", " ")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                onRank?.();
              }}
              className="p-2.5 bg-primary-500/10 hover:bg-primary-600 hover:text-white text-primary-400 rounded-xl transition-all shadow-sm"
              title="Calculate Class Rankings"
            >
              <Award className="w-4 h-4" />
            </button>
            <Link
              to={`/exams/entry?exam=${id}`}
              className="p-2.5 bg-white/5 hover:bg-white/20 text-white rounded-xl transition-all shadow-sm"
            >
              <Edit3 className="w-4 h-4" />
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete?.();
              }}
              className="p-2.5 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 rounded-xl transition-all shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-dim uppercase tracking-widest mt-4">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            <Calendar className="w-3.5 h-3.5 text-primary-500" />
            {start_date} <ArrowRight className="w-3 h-3 mx-1" /> {end_date}
          </div>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-primary-200/10 group-hover:text-primary-400 group-hover:translate-x-2 transition-all hidden sm:block shrink-0" />
    </div>

    {/* Background accent */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary-600/10 transition-all" />
  </motion.div>
);

export const ExamsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    term: "TERM_1",
    exam_type: "END_TERM",
    start_date: "",
    end_date: "",
    grading_system: "",
  });
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["exams", debouncedSearch],
    queryFn: () => examsService.getExams(debouncedSearch),
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });

  const { data: gradingSystems = [] } = useQuery({
    queryKey: ["grading-systems"],
    queryFn: () => examsService.getGradingSystems(),
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });

  const { data: chartData = [] } = useQuery({
    queryKey: ["exams_analytics"],
    queryFn: examsService.getAnalytics,
  });

  const createExamMutation = useMutation({
    mutationFn: examsService.createExam,
    onSuccess: () => {
      toast.success("Exam successfully created");
      setIsModalOpen(false);
      setFormData({
        name: "",
        term: "TERM_1",
        exam_type: "END_TERM",
        start_date: "",
        end_date: "",
        grading_system: "",
      });
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["exams_analytics"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to create exam");
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: examsService.deleteExam,
    onSuccess: () => {
      toast.success("Exam deleted");
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete exam");
    },
  });

  const computeRanksMutation = useMutation({
    mutationFn: (id: number) => examsService.computeRanks(id),
    onSuccess: (data) => {
      toast.success(data.detail || "Class rankings successfully updated");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || "Failed to calculate rankings",
      );
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 md:space-y-12 pb-20"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-none">
            Exams & <span className="text-gradient">Assessments</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm md:text-base font-medium max-w-xl">
            Create, organize, and view academic exams and class rankings.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Link to="/grading" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full gap-2 h-12 text-[10px]">
              <Layers className="w-4 h-4" /> Grading Systems
            </Button>
          </Link>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none gap-2 h-12 text-[10px]"
          >
            <Calendar className="w-4 h-4" /> Create New Exam
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">
              Exam List
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/20" />
              <Input
                placeholder="Search exams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 text-xs bg-white/5 border-white/5 focus:bg-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {examsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="premium-card flex items-center gap-6">
                    <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="w-48 h-4" />
                      <Skeleton className="w-32 h-2" />
                    </div>
                  </div>
                ))
              ) : exams.length > 0 ? (
                exams.map((exam: Exam) => (
                  <ExamCard
                    key={exam.id}
                    {...exam}
                    onDelete={() => setExamToDelete(exam)}
                    onRank={() => computeRanksMutation.mutate(exam.id)}
                  />
                ))
              ) : (
                <div className="premium-card text-center py-24 flex flex-col items-center gap-4">
                  <ClipboardList className="w-12 h-12 text-primary-200/10" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-dim">
                    No exams found.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em]">
            Performance Analytics
          </h2>
          <div className="premium-card !p-6 space-y-8">
            <div className="h-64 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorScore"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#14b8a6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#14b8a6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255, 255, 255, 0.03)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(255, 255, 255, 0.1)"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      fontWeight="800"
                    />
                    <YAxis
                      stroke="rgba(255, 255, 255, 0.1)"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      fontWeight="800"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "16px",
                        backdropFilter: "blur(12px)",
                      }}
                      itemStyle={{
                        color: "#14b8a6",
                        fontWeight: "900",
                        fontSize: "11px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#14b8a6"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorScore)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-primary-200/10 border-2 border-dashed border-white/5 rounded-[32px]">
                  <Layers className="w-10 h-10 mb-4 opacity-10" />
                  <p className="text-[9px] font-black uppercase tracking-widest">
                    No Data Available
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6 pt-4 border-t border-white/5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-dim uppercase tracking-widest">
                    Class Average Score
                  </span>
                  <span className="text-2xl font-black text-primary">
                    {chartData.length > 0
                      ? (
                          chartData.reduce(
                            (acc: number, curr: any) => acc + curr.score,
                            0,
                          ) / chartData.length
                        ).toFixed(1) + "%"
                      : "0.0%"}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        chartData.length > 0
                          ? `${(chartData.reduce((acc: number, curr: any) => acc + curr.score, 0) / chartData.length).toFixed(1)}%`
                          : "0%",
                    }}
                    className="h-full bg-gradient-to-r from-primary-600 to-indigo-600 shadow-glow"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-dim uppercase tracking-widest mb-1">
                    Rankings
                  </p>
                  <p className="text-lg font-black text-primary">Calculated</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-dim uppercase tracking-widest mb-1">
                    Status
                  </p>
                  <p className="text-lg font-black text-emerald-400">Ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Exam"
        className="max-w-xl glass-morphic border-white/10 !rounded-[32px]"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createExamMutation.mutate(formData);
          }}
          className="space-y-8 mt-6"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                Exam Name
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Term 1 End Exam"
                className="h-12 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Select
                label="Term"
                value={formData.term}
                onChange={(e) =>
                  setFormData({ ...formData, term: e.target.value })
                }
              >
                <option value="TERM_1" className="bg-bg-color">
                  Term 1
                </option>
                <option value="TERM_2" className="bg-bg-color">
                  Term 2
                </option>
                <option value="TERM_3" className="bg-bg-color">
                  Term 3
                </option>
              </Select>
              <Select
                label="Exam Type"
                value={formData.exam_type}
                onChange={(e) =>
                  setFormData({ ...formData, exam_type: e.target.value })
                }
              >
                <option value="CAT" className="bg-bg-color">
                  CAT
                </option>
                <option value="MID_TERM" className="bg-bg-color">
                  Mid-Term
                </option>
                <option value="END_TERM" className="bg-bg-color">
                  End-Term
                </option>
                <option value="MOCK" className="bg-bg-color">
                  Mock
                </option>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                  Start Date
                </label>
                <Input
                  required
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  className="h-12 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                  End Date
                </label>
                <Input
                  required
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  className="h-12 text-sm"
                />
              </div>
            </div>

            <Select
              label="Grading System"
              required
              value={formData.grading_system}
              onChange={(e) =>
                setFormData({ ...formData, grading_system: e.target.value })
              }
            >
              <option value="" className="bg-bg-color">
                Select Grading System...
              </option>
              {gradingSystems.map((gs: any) => (
                <option key={gs.id} value={gs.id} className="bg-bg-color">
                  {gs.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 pb-2 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-12 text-[10px]"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-[2] h-12 text-[10px]"
              disabled={createExamMutation.isPending}
            >
              {createExamMutation.isPending ? "Creating..." : "Create Exam"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={examToDelete !== null}
        onClose={() => setExamToDelete(null)}
        onConfirm={() => {
          if (examToDelete) deleteExamMutation.mutate(examToDelete.id);
          setExamToDelete(null);
        }}
        title="Delete Exam"
        description={`Are you sure you want to permanently delete the exam "${examToDelete?.name}"? All associated grading data and student marks will be lost.`}
      />
    </motion.div>
  );
};

export default ExamsPage;
