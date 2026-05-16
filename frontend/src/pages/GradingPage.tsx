import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Layers, ChevronRight, Zap, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { examsService } from "../api/services/examsService";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";

export const GradingPage = () => {
  const queryClient = useQueryClient();
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [systemName, setSystemName] = useState("");
  const [activeSystem, setActiveSystem] = useState<any>(null);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [thresholdData, setThresholdData] = useState({
    grade: "",
    min_score: 0,
    max_score: 100,
    points: 0,
    remarks: "",
  });

  const { data: systems = [], isLoading } = useQuery({
    queryKey: ["grading-systems"],
    queryFn: () => examsService.getGradingSystems(),
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });

  const createSystemMutation = useMutation({
    mutationFn: (data: any) => examsService.createGradingSystem(data),
    onSuccess: () => {
      toast.success("Grading matrix initialized");
      setIsSystemModalOpen(false);
      setSystemName("");
      queryClient.invalidateQueries({ queryKey: ["grading-systems"] });
    },
  });

  const createThresholdMutation = useMutation({
    mutationFn: (data: any) => examsService.createThreshold(data),
    onSuccess: () => {
      toast.success("Grade threshold synchronized");
      setIsThresholdModalOpen(false);
      setThresholdData({
        grade: "",
        min_score: 0,
        max_score: 100,
        points: 0,
        remarks: "",
      });
      queryClient.invalidateQueries({ queryKey: ["grading-systems"] });
    },
  });

  const deleteThresholdMutation = useMutation({
    mutationFn: (id: number) => examsService.deleteThreshold(id),
    onSuccess: () => {
      toast.success("Threshold purged");
      queryClient.invalidateQueries({ queryKey: ["grading-systems"] });
    },
  });

  const handleAddThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSystem) return;
    createThresholdMutation.mutate({
      ...thresholdData,
      grading_system: activeSystem.id,
    });
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
            Grading <span className="text-gradient">Architect</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm md:text-base font-medium max-w-xl">
            Design sophisticated academic assessment frameworks and performance
            conversion matrices.
          </p>
        </div>
        <Button
          onClick={() => setIsSystemModalOpen(true)}
          className="gap-2 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium w-full lg:w-auto"
        >
          <Layers className="w-5 h-5" />
          Initialize System
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-glow-sm" />
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
              Operational Frameworks
            </h2>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((i: any) => (
                <div
                  key={i}
                  className="h-24 bg-white/5 rounded-[32px] animate-pulse"
                />
              ))
            ) : systems.length === 0 ? (
              <div className="premium-card p-12 text-center opacity-20 border-dashed border-white/10">
                <Layers className="w-12 h-12 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  No Frameworks Detected
                </p>
              </div>
            ) : (
              systems.map((system: any) => (
                <motion.div
                  key={system.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setActiveSystem(system)}
                  className={`p-8 rounded-[32px] border transition-all cursor-pointer group relative overflow-hidden ${
                    activeSystem?.id === system.id
                      ? "bg-primary-600/10 border-primary-500 shadow-glow-sm"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <h3 className="text-lg font-black text-primary uppercase tracking-tight leading-none mb-2">
                        {system.name}
                      </h3>
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest">
                        {system.thresholds?.length || 0} Intelligence Nodes
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 transition-all ${activeSystem?.id === system.id ? "text-primary-400 translate-x-0" : "text-primary-200/20 -translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"}`}
                    />
                  </div>
                  {activeSystem?.id === system.id && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 blur-3xl -mr-8 -mt-8" />
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {activeSystem ? (
              <motion.div
                key={activeSystem.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="premium-card !p-0 overflow-hidden border-white/5"
              >
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
                  <div>
                    <h2 className="text-xl font-black text-primary uppercase tracking-[0.2em]">
                      {activeSystem.name} Matrix
                    </h2>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">
                      Threshold-to-Grade conversion parameters
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setIsThresholdModalOpen(true)}
                    className="gap-2 h-12 px-6 rounded-xl text-[10px] bg-white/5 border-white/5"
                  >
                    <Plus className="w-4 h-4" /> Add Threshold
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <Table className="min-w-[800px]">
                    <TableHeader className="bg-white/[0.02]">
                      <TableRow className="border-0 hover:bg-transparent h-20">
                        <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest pl-10">
                          Grade Identity
                        </TableHead>
                        <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest text-center">
                          Spectral Range (Min — Max)
                        </TableHead>
                        <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest text-center">
                          Intelligence Points
                        </TableHead>
                        <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest">
                          Descriptor (Remarks)
                        </TableHead>
                        <TableHead className="text-right text-muted text-[10px] font-black uppercase tracking-widest pr-10">
                          Operations
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeSystem.thresholds?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-40">
                            <div className="flex flex-col items-center opacity-20">
                              <Target className="w-20 h-20 mb-6" />
                              <p className="text-lg font-black uppercase tracking-[0.3em]">
                                Threshold Matrix Depleted
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        [...activeSystem.thresholds]
                          .sort((a, b) => b.min_score - a.min_score)
                          .map((t: any, idx: number) => (
                            <motion.tr
                              key={t.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="group transition-all h-24 border-white/5 hover:bg-white/[0.03]"
                            >
                              <TableCell className="pl-10">
                                <div className="w-14 h-14 rounded-2xl bg-primary-600/10 flex items-center justify-center text-2xl font-black text-primary-400 border border-primary-500/10 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-glow-sm">
                                  {t.grade}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-4">
                                  <span className="text-xl font-black text-primary tracking-tight leading-none">
                                    {t.min_score}
                                  </span>
                                  <div className="w-8 h-[1px] bg-white/10" />
                                  <span className="text-xl font-black text-primary tracking-tight leading-none">
                                    {t.max_score}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-black text-xl text-primary-400 tracking-tight leading-none">
                                {t.points}
                              </TableCell>
                              <TableCell className="text-muted italic text-[11px] font-black uppercase tracking-widest">
                                {t.remarks}
                              </TableCell>
                              <TableCell className="text-right pr-10">
                                <button
                                  onClick={() =>
                                    deleteThresholdMutation.mutate(t.id)
                                  }
                                  className="p-3 hover:bg-rose-500/10 text-primary-200/20 hover:text-rose-400 rounded-2xl transition-all group-hover:scale-110"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </TableCell>
                            </motion.tr>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[500px] premium-card border-dashed border-white/10 flex flex-col items-center justify-center text-center p-12 group">
                <div className="w-24 h-24 rounded-[40px] bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-700">
                  <Zap className="w-10 h-10 text-primary-400 opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-2xl font-black text-primary uppercase tracking-tight leading-none mb-3">
                  Initialize Operational View
                </h3>
                <p className="text-muted text-[11px] font-black uppercase tracking-[0.2em] max-w-sm leading-relaxed">
                  Select a target grading framework from the operational grid to
                  access and modify its spectral thresholds.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Modal
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
        title="Initialize Assessment Framework"
        className="max-w-xl glass-morphic border-white/10 !rounded-[40px]"
      >
        <div className="space-y-10 mt-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] pl-1">
              Framework Identity (System Name)
            </label>
            <Input
              placeholder="e.g. Standard 8-4-4, CBC Grid, Cambridge Advanced"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              className="h-16 font-black text-lg"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <Button
              variant="ghost"
              className="flex-1 h-14 text-[10px]"
              onClick={() => setIsSystemModalOpen(false)}
            >
              Abort
            </Button>
            <Button
              className="flex-[2] h-14 text-[10px]"
              onClick={() => createSystemMutation.mutate({ name: systemName })}
              disabled={!systemName || createSystemMutation.isPending}
            >
              {createSystemMutation.isPending
                ? "Initializing..."
                : "Commit Framework Identity"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        title="Synchronize Grade Threshold"
        className="max-w-2xl glass-morphic border-white/10 !rounded-[40px]"
      >
        <form onSubmit={handleAddThreshold} className="space-y-10 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] pl-1">
                Grade Identity (e.g. A)
              </label>
              <Input
                required
                value={thresholdData.grade}
                onChange={(e) =>
                  setThresholdData({
                    ...thresholdData,
                    grade: e.target.value.toUpperCase(),
                  })
                }
                className="h-16 font-black text-2xl text-center text-primary-400"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] pl-1">
                Intelligence Points
              </label>
              <Input
                required
                type="number"
                value={thresholdData.points}
                onChange={(e) =>
                  setThresholdData({
                    ...thresholdData,
                    points: parseInt(e.target.value),
                  })
                }
                className="h-16 font-black text-xl"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] pl-1">
                Spectral Minimum
              </label>
              <Input
                required
                type="number"
                value={thresholdData.min_score}
                onChange={(e) =>
                  setThresholdData({
                    ...thresholdData,
                    min_score: parseInt(e.target.value),
                  })
                }
                className="h-16 font-black text-xl"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] pl-1">
                Spectral Maximum
              </label>
              <Input
                required
                type="number"
                value={thresholdData.max_score}
                onChange={(e) =>
                  setThresholdData({
                    ...thresholdData,
                    max_score: parseInt(e.target.value),
                  })
                }
                className="h-16 font-black text-xl"
              />
            </div>
            <div className="col-span-full space-y-3">
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] pl-1">
                Node Descriptor (Remarks)
              </label>
              <Input
                required
                placeholder="e.g. EXCELLENT PROTOCOL"
                value={thresholdData.remarks}
                onChange={(e) =>
                  setThresholdData({
                    ...thresholdData,
                    remarks: e.target.value.toUpperCase(),
                  })
                }
                className="h-16 font-black text-xs tracking-widest"
              />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-14 text-[10px]"
              onClick={() => setIsThresholdModalOpen(false)}
            >
              Abort Process
            </Button>
            <Button
              type="submit"
              disabled={createThresholdMutation.isPending}
              className="flex-[2] h-14 text-[10px]"
            >
              {createThresholdMutation.isPending
                ? "Syncing..."
                : "Execute Matrix Update"}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default GradingPage;
