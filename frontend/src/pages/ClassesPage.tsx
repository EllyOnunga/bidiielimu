import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  Users,
  GraduationCap,
  Trash2,
  Search,
  LayoutGrid,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  classesService,
  type GradeLevel,
  type Stream,
} from "../api/services/classesService";
import { teachersService } from "../api/services/teachersService";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { Skeleton } from "../components/ui/Skeleton";

export const ClassesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeName, setGradeName] = useState("");

  const [showStreamModal, setShowStreamModal] = useState(false);
  const [streamName, setStreamName] = useState("");
  const [targetGradeId, setTargetGradeId] = useState<number | null>(null);
  const [targetGradeName, setTargetGradeName] = useState("");

  const [gradeToDelete, setGradeToDelete] = useState<GradeLevel | null>(null);
  const [streamToDelete, setStreamToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [editingStream, setEditingStream] = useState<Stream | null>(null);
  const [editStreamData, setEditStreamData] = useState({
    name: "",
    teacher: "",
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["grades", debouncedSearch],
    queryFn: () => classesService.getGrades(debouncedSearch),
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });

  const createGradeMutation = useMutation({
    mutationFn: classesService.createGrade,
    onSuccess: () => {
      toast.success("Grade level initialized");
      setShowGradeModal(false);
      setGradeName("");
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Initialization failed");
    },
  });

  const createStreamMutation = useMutation({
    mutationFn: classesService.createStream,
    onSuccess: () => {
      toast.success(`Stream deployed to ${targetGradeName}`);
      setShowStreamModal(false);
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Deployment failed");
    },
  });

  const deleteGradeMutation = useMutation({
    mutationFn: classesService.deleteGrade,
    onSuccess: () => {
      toast.success("Grade system decommissioned");
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Decommissioning failed");
    },
  });

  const deleteStreamMutation = useMutation({
    mutationFn: classesService.deleteStream,
    onSuccess: () => {
      toast.success("Operational stream terminated");
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Termination failed");
    },
  });

  const updateStreamMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      classesService.updateStream(id, data),
    onSuccess: () => {
      toast.success("Operational metrics synchronized");
      setEditingStream(null);
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Synchronization failed");
    },
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => teachersService.getAll(),
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    createGradeMutation.mutate({ name: gradeName });
  };

  const openAddStream = (grade: GradeLevel) => {
    setTargetGradeId(grade.id);
    setTargetGradeName(grade.name);
    setStreamName("");
    setShowStreamModal(true);
  };

  const handleAddStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetGradeId) {
      createStreamMutation.mutate({
        grade_level: targetGradeId,
        name: streamName,
      });
    }
  };


  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectData, setSubjectData] = useState({ name: "", code: "" });
  const [subjectToDelete, setSubjectToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => classesService.getSubjects(),
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });

  const createSubjectMutation = useMutation({
    mutationFn: classesService.createSubject,
    onSuccess: () => {
      toast.success("Intelligence domain established");
      setShowSubjectModal(false);
      setSubjectData({ name: "", code: "" });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: classesService.deleteSubject,
    onSuccess: () => {
      toast.success("Domain record purged");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    createSubjectMutation.mutate(subjectData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-20"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-none">
            Academic <span className="text-gradient">Architecture</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm md:text-base font-medium max-w-xl">
            Engineer your school's structural hierarchy from core grades to
            specialized learning streams.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/20" />
            <Input
              placeholder="Query systems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 bg-white/5 border-white/5 h-14"
            />
          </div>
          <Button
            onClick={() => setShowGradeModal(true)}
            className="gap-2 w-full lg:w-auto h-14 px-8 rounded-2xl"
          >
            <Plus className="w-5 h-5" /> Initialize Level
          </Button>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="premium-card !p-8 space-y-8">
                <div className="flex items-center gap-6">
                  <Skeleton className="w-20 h-20 rounded-3xl" />
                  <div className="space-y-3">
                    <Skeleton className="w-48 h-8" />
                    <Skeleton className="w-64 h-4" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <Skeleton className="h-40 rounded-[32px]" />
                  <Skeleton className="h-40 rounded-[32px]" />
                  <Skeleton className="h-40 rounded-[32px]" />
                  <Skeleton className="h-40 rounded-[32px]" />
                </div>
              </div>
            ))}
          </div>
        ) : grades.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="premium-card py-24 text-center"
          >
            <GraduationCap className="w-20 h-20 text-primary-200/10 mx-auto mb-8" />
            <h3 className="text-xl md:text-2xl font-black text-primary uppercase tracking-widest mb-4">
              Academic Blueprint Required
            </h3>
            <p className="text-muted text-xs sm:text-sm font-medium mb-10 max-w-md mx-auto leading-relaxed">
              Establish your institution's foundation by defining the primary
              grade levels and their operational streams.
            </p>
            <Button
              onClick={() => setShowGradeModal(true)}
              className="h-14 px-10 rounded-2xl"
            >
              Launch Grade Protocol
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {grades.map((grade: GradeLevel, gi: number) => (
              <motion.div
                key={grade.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.05 }}
                className="premium-card !p-0 overflow-hidden group border-white/5"
              >
                <div 
                  onClick={() => navigate(`/classes/grade/${grade.id}`)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 gap-6 bg-white/[0.02] border-b border-white/5 cursor-pointer hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-primary-600/10 rounded-[28px] flex items-center justify-center text-primary-400 border border-primary-500/10 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shrink-0">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-primary uppercase tracking-tight leading-tight">
                        {grade.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-primary-200/40 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                          <Users className="w-3.5 h-3.5 text-primary-400" />
                          {grade.student_count} Assets
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-primary-200/40 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                          <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                          {grade.streams.length} Units
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => openAddStream(grade)}
                      className="gap-2 h-12 px-6 text-[10px]"
                    >
                      <Plus className="w-4 h-4" /> Add Stream
                    </Button>
                    <button
                      onClick={() => setGradeToDelete(grade)}
                      className="p-3.5 hover:bg-rose-500/10 text-primary-200/20 hover:text-rose-400 rounded-2xl transition-all border border-transparent hover:border-rose-500/10"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 sm:p-8 text-center text-muted text-xs">
                  Click card to manage streams and units inside {grade.name}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="pt-20 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10 shadow-glow-sm">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-primary uppercase tracking-tight">
                Intelligence <span className="text-gradient">Domains</span>
              </h2>
              <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                Manage core curriculum infrastructure.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowSubjectModal(true)}
            variant="outline"
            className="gap-2 h-12 px-6 rounded-2xl text-[10px]"
          >
            <Plus className="w-4 h-4" /> Add Knowledge Node
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <AnimatePresence mode="popLayout">
            {subjects.length === 0 ? (
              <div className="col-span-full py-16 text-center premium-card border-dashed border-white/5 opacity-40">
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">
                  No Knowledge Nodes Established
                </p>
              </div>
            ) : (
              subjects.map((sub: any, idx: number) => (
                <motion.div
                  key={sub.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="premium-card !p-6 flex flex-col items-center justify-center text-center group hover:border-indigo-500/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 mb-4 font-black text-[10px] border border-indigo-500/10 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                    {sub.code || sub.name.substring(0, 3).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest truncate w-full">
                    {sub.name}
                  </span>

                  <button
                    onClick={() =>
                      setSubjectToDelete({ id: sub.id, name: sub.name })
                    }
                    className="absolute top-3 right-3 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-primary-200/20 hover:text-rose-400 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals with premium styling */}
      <Modal
        isOpen={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        title="Establish Knowledge Node"
        className="max-w-md glass-morphic border-white/10 !rounded-[32px]"
      >
        <form onSubmit={handleAddSubject} className="space-y-8 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                Domain Identity
              </label>
              <Input
                required
                autoFocus
                value={subjectData.name}
                onChange={(e) =>
                  setSubjectData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Quantum Computing"
                className="h-14"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                Registry Code
              </label>
              <Input
                value={subjectData.code}
                onChange={(e) =>
                  setSubjectData((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="e.g. QNT"
                className="h-14 uppercase"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-12 text-[10px]"
              onClick={() => setShowSubjectModal(false)}
            >
              Discard
            </Button>
            <Button
              type="submit"
              className="flex-[2] h-12 text-[10px]"
              disabled={createSubjectMutation.isPending}
            >
              {createSubjectMutation.isPending ? "Syncing..." : "Commit Domain"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showStreamModal}
        onClose={() => setShowStreamModal(false)}
        title="Deploy Learning Unit"
        className="max-w-md glass-morphic border-white/10 !rounded-[32px]"
      >
        <form onSubmit={handleAddStream} className="space-y-8 mt-6">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-primary-600/5 border border-primary-600/10 flex items-center gap-4">
              <LayoutGrid className="w-5 h-5 text-primary-400" />
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                Target: {targetGradeName}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                Unit Identifier
              </label>
              <Input
                required
                autoFocus
                value={streamName}
                onChange={(e) => setStreamName(e.target.value)}
                placeholder="e.g. Alpha-X, Omega"
                className="h-14"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-12 text-[10px]"
              onClick={() => setShowStreamModal(false)}
            >
              Discard
            </Button>
            <Button
              type="submit"
              className="flex-[2] h-12 text-[10px]"
              disabled={createStreamMutation.isPending}
            >
              {createStreamMutation.isPending
                ? "Deploying..."
                : "Execute Deployment"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={editingStream !== null}
        onClose={() => setEditingStream(null)}
        title="Unit Modification"
        className="max-w-md glass-morphic border-white/10 !rounded-[32px]"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingStream) {
              updateStreamMutation.mutate({
                id: editingStream.id,
                data: {
                  name: editStreamData.name,
                  teacher: editStreamData.teacher
                    ? parseInt(editStreamData.teacher)
                    : null,
                },
              });
            }
          }}
          className="space-y-8 mt-6"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                Unit Title
              </label>
              <Input
                required
                value={editStreamData.name}
                onChange={(e) =>
                  setEditStreamData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="h-14"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                Commanding Officer
              </label>
              <select
                value={editStreamData.teacher}
                onChange={(e) =>
                  setEditStreamData((prev) => ({
                    ...prev,
                    teacher: e.target.value,
                  }))
                }
                className="w-full h-14 bg-white/5 border border-white/5 rounded-xl px-4 text-primary text-sm outline-none focus:border-primary-500/50 transition-all"
              >
                <option value="" className="bg-bg-color">
                  Unassigned
                </option>
                {teachers.map((t: any) => (
                  <option key={t.id} value={t.id} className="bg-bg-color">
                    {t.first_name} {t.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-12 text-[10px]"
              onClick={() => setEditingStream(null)}
            >
              Abort
            </Button>
            <Button
              type="submit"
              className="flex-[2] h-12 text-[10px]"
              disabled={updateStreamMutation.isPending}
            >
              {updateStreamMutation.isPending ? "Syncing..." : "Commit Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showGradeModal}
        onClose={() => setShowGradeModal(false)}
        title="Initialize System Level"
        className="max-w-md glass-morphic border-white/10 !rounded-[32px]"
      >
        <form onSubmit={handleAddGrade} className="space-y-8 mt-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
              Level Identifier
            </label>
            <Input
              required
              autoFocus
              value={gradeName}
              onChange={(e) => setGradeName(e.target.value)}
              placeholder="e.g. Senior Phase, Level 9"
              className="h-14"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-12 text-[10px]"
              onClick={() => setShowGradeModal(false)}
            >
              Discard
            </Button>
            <Button
              type="submit"
              className="flex-[2] h-12 text-[10px]"
              disabled={createGradeMutation.isPending}
            >
              {createGradeMutation.isPending
                ? "Initializing..."
                : "Confirm Protocol"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={gradeToDelete !== null}
        onClose={() => setGradeToDelete(null)}
        onConfirm={() => {
          if (gradeToDelete) deleteGradeMutation.mutate(gradeToDelete.id);
          setGradeToDelete(null);
        }}
        title="System Decommission"
        description={`Permanently purge ${gradeToDelete?.name} and all operational units from the grid?`}
      />

      <ConfirmModal
        isOpen={streamToDelete !== null}
        onClose={() => setStreamToDelete(null)}
        onConfirm={() => {
          if (streamToDelete) deleteStreamMutation.mutate(streamToDelete.id);
          setStreamToDelete(null);
        }}
        title="Unit Termination"
        description={`Execute termination protocol for operational unit ${streamToDelete?.name}?`}
      />

      <ConfirmModal
        isOpen={subjectToDelete !== null}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={() => {
          if (subjectToDelete) deleteSubjectMutation.mutate(subjectToDelete.id);
          setSubjectToDelete(null);
        }}
        title="Domain Purge"
        description={`Permanently terminate Knowledge Domain "${subjectToDelete?.name}"?`}
      />
    </motion.div>
  );
};

export default ClassesPage;
