import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Mail,
  Phone,
  Trash2,
  Plus,
  BookOpen,
  Settings,
  UserPlus,
  Filter,
  UploadCloud,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { teachersService, type Teacher } from "../api/services/teachersService";
import { classesService } from "../api/services/classesService";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { TableSkeleton } from "../components/ui/Skeleton";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";

export const TeachersPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    specialization: "",
    joining_date: new Date().toISOString().split("T")[0],
    email: "",
    password: "",
  });
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<number | null>(null);
  const [assignmentTeacher, setAssignmentTeacher] = useState<Teacher | null>(
    null,
  );
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: teachersData = [], isLoading: loading } = useQuery({
    queryKey: ["teachers", debouncedSearch],
    queryFn: () => teachersService.getAll(debouncedSearch),
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });

  const createTeacherMutation = useMutation({
    mutationFn: (data: any) => teachersService.create(data),
    onSuccess: () => {
      toast.success("Faculty induction successful");
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Induction failed");
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      teachersService.update(id, data),
    onSuccess: () => {
      toast.success("Identity records synchronized");
      setIsModalOpen(false);
      setEditingTeacher(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Synchronization failed");
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: (id: number) => teachersService.delete(id),
    onSuccess: () => {
      toast.success("Faculty record purged");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Purge protocol failed");
    },
  });

  const resetForm = () => {
    setFormData({
      employee_id: "",
      first_name: "",
      last_name: "",
      phone_number: "",
      specialization: "",
      joining_date: new Date().toISOString().split("T")[0],
      email: "",
      password: "",
    });
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      employee_id: teacher.employee_id,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      phone_number: teacher.phone_number,
      specialization: teacher.specialization,
      joining_date:
        teacher.joining_date || new Date().toISOString().split("T")[0],
      email: teacher.email || "",
      password: "",
    });
    setIsModalOpen(true);
  };

  const handleAddTeacher = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isModalOpen) {
      setEditingTeacher(null);
      resetForm();
      setIsModalOpen(true);
      return;
    }

    if (editingTeacher) {
      const { email, password, ...updateData } = formData;
      const finalData: any = { ...updateData };
      if (email && email.trim() !== "" && email !== editingTeacher.email)
        finalData.email = email;
      if (password && password.trim() !== "") finalData.password = password;
      updateTeacherMutation.mutate({ id: editingTeacher.id, data: finalData });
    } else {
      createTeacherMutation.mutate(formData);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return toast.error("Select protocol file first.");

    const formDataObj = new FormData();
    formDataObj.append("file", csvFile);

    setIsUploading(true);
    try {
      const res = await teachersService.bulkUpload(formDataObj);
      toast.success(res.detail);
      setIsBulkModalOpen(false);
      setCsvFile(null);
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Mass induction failure");
    } finally {
      setIsUploading(false);
    }
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
            Faculty <span className="text-gradient">Network</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm md:text-base font-medium max-w-xl">
            Coordinate elite educators and manage multi-functional academic
            assignments.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Button
            variant="ghost"
            onClick={() => setIsBulkModalOpen(true)}
            className="gap-2 h-14 px-8 rounded-2xl"
          >
            <UploadCloud className="w-5 h-5" /> Import Matrix
          </Button>
          <Button
            onClick={handleAddTeacher}
            className="gap-2 h-14 px-8 rounded-2xl"
          >
            <UserPlus className="w-5 h-5" />
            Induct Faculty
          </Button>
        </div>
      </div>

      <div className="premium-card !p-0 overflow-hidden border-white/5">
        <div className="p-6 sm:p-8 border-b border-white/5 flex flex-col md:flex-row gap-6 items-center justify-between bg-white/[0.01]">
          <div className="relative w-full md:w-[450px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/20" />
            <Input
              type="text"
              placeholder="Query name, ID, or specialization..."
              className="pl-12 h-14 bg-white/5 border-white/5"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Button
              variant="outline"
              className="gap-2 h-12 flex-1 md:flex-none px-6 text-[10px]"
            >
              <Filter className="w-4 h-4" /> Filter Protocols
            </Button>
            <div className="hidden sm:flex h-12 items-center px-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black text-primary uppercase tracking-widest">
              Active Nodes: {teachersData.length}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-0 hover:bg-transparent h-20">
                <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest pl-10 w-[350px]">
                  Faculty Identity
                </TableHead>
                <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest w-[300px]">
                  Communication Channel
                </TableHead>
                <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest">
                  Intelligence Domain
                </TableHead>
                <TableHead className="text-muted text-[10px] font-black uppercase tracking-widest">
                  Status
                </TableHead>
                <TableHead className="text-right text-muted text-[10px] font-black uppercase tracking-widest pr-10">
                  Operations
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <TableSkeleton rows={8} cols={5} />
                ) : teachersData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-40">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center"
                      >
                        <UserPlus className="w-20 h-20 text-primary-200/5 mb-6" />
                        <p className="text-lg font-black uppercase tracking-[0.3em] text-primary-200/20">
                          No Faculty Records Detected
                        </p>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                ) : (
                  teachersData.map((teacher: Teacher, idx: number) => (
                    <motion.tr
                      key={teacher.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="group transition-all h-24 border-white/5 hover:bg-white/[0.03]"
                    >
                      <TableCell className="pl-10">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-primary-600/10 flex items-center justify-center text-primary-400 font-black text-sm border border-primary-500/10 group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shrink-0">
                            {teacher.first_name[0]}
                            {teacher.last_name[0]}
                          </div>
                          <div>
                            <div className="text-base font-black text-primary uppercase tracking-tight leading-none mb-1.5">
                              {teacher.first_name} {teacher.last_name}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-dim uppercase tracking-[0.2em] bg-white/5 px-2 py-0.5 rounded-md">
                                {teacher.employee_id}
                              </span>
                              <span className="text-[9px] font-black text-primary-400/40 uppercase tracking-[0.1em]">
                                Joined{" "}
                                {new Date(
                                  teacher.joining_date || new Date(),
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-tight group/mail cursor-pointer">
                            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover/mail:bg-primary-600 transition-colors">
                              <Mail className="w-3 h-3 text-primary-400 group-hover/mail:text-white" />
                            </div>
                            {teacher.email || "MISSING_IDENTITY"}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-black text-dim uppercase tracking-tight">
                            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                              <Phone className="w-3 h-3 text-dim" />
                            </div>
                            {teacher.phone_number}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-glow-sm" />
                            {teacher.specialization || "Cross-Functional"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                            teacher.is_active
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {teacher.is_active ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : (
                            <ShieldAlert className="w-3 h-3" />
                          )}
                          {teacher.is_active ? "Operational" : "Offline"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setAssignmentTeacher(teacher);
                              setIsAssignmentModalOpen(true);
                            }}
                            className="p-3 hover:bg-white/10 text-primary-200/20 hover:text-primary-400 rounded-2xl transition-all group-hover:scale-110"
                          >
                            <BookOpen className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEditTeacher(teacher)}
                            className="p-3 hover:bg-white/10 text-primary-200/20 hover:text-white rounded-2xl transition-all group-hover:scale-110"
                          >
                            <Settings className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setTeacherToDelete(teacher.id)}
                            className="p-3 hover:bg-rose-500/10 text-primary-200/20 hover:text-rose-400 rounded-2xl transition-all group-hover:scale-110"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTeacher(null);
        }}
        title={
          editingTeacher
            ? "Identity Synchronization"
            : "Faculty Protocol Induction"
        }
        className="max-w-4xl glass-morphic border-white/10 !rounded-[40px]"
      >
        <form
          onSubmit={handleAddTeacher}
          className="space-y-8 sm:space-y-12 mt-6 sm:mt-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 sm:gap-y-10">
            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <UserPlus className="w-5 h-5 text-primary-400" />
                <h3 className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-[0.3em]">
                  Induction Parameters
                </h3>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                  Faculty Identifier (ID)
                </label>
                <Input
                  required
                  value={formData.employee_id}
                  onChange={(e) =>
                    setFormData({ ...formData, employee_id: e.target.value })
                  }
                  placeholder="EMP-XXX"
                  className="h-14"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                    First Name
                  </label>
                  <Input
                    required
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    className="h-14"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                    Last Name
                  </label>
                  <Input
                    required
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    className="h-14"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-[0.3em]">
                  Operational Matrix
                </h3>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                  Domain Specialization
                </label>
                <Input
                  required
                  value={formData.specialization}
                  onChange={(e) =>
                    setFormData({ ...formData, specialization: e.target.value })
                  }
                  placeholder="e.g. Theoretical Physics"
                  className="h-14"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                  Protocol Activation Date
                </label>
                <Input
                  required
                  type="date"
                  value={formData.joining_date}
                  onChange={(e) =>
                    setFormData({ ...formData, joining_date: e.target.value })
                  }
                  className="h-14"
                />
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <Phone className="w-5 h-5 text-emerald-400" />
                <h3 className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-[0.3em]">
                  Transmission Line
                </h3>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                  Secure Line (Phone)
                </label>
                <Input
                  required
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  className="h-14"
                />
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <Mail className="w-5 h-5 text-amber-400" />
                <h3 className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-[0.3em]">
                  Access Encryption
                </h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                    System Node (Email)
                  </label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="h-14"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest pl-1">
                    Encryption Key (Password)
                  </label>
                  <Input
                    required={!editingTeacher}
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={editingTeacher ? "LOCKED" : "••••••••"}
                    className="h-14"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-14 text-[10px]"
              onClick={() => setIsModalOpen(false)}
            >
              Discard
            </Button>
            <Button
              type="submit"
              className="flex-[2] h-14 text-[10px]"
              disabled={
                createTeacherMutation.isPending ||
                updateTeacherMutation.isPending
              }
            >
              {createTeacherMutation.isPending ||
              updateTeacherMutation.isPending
                ? "Syncing Matrix..."
                : editingTeacher
                  ? "Execute Update"
                  : "Confirm Induction"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Mass Data Ingestion"
        className="max-w-xl glass-morphic border-white/10 !rounded-[40px]"
      >
        <div className="mt-8 space-y-8">
          <div
            className={`border-4 border-dashed rounded-[40px] p-12 text-center transition-all cursor-pointer ${
              csvFile
                ? "border-primary-500 bg-primary-500/5 shadow-glow-sm"
                : "border-white/5 bg-white/[0.02] hover:border-white/10"
            }`}
            onClick={() =>
              document.getElementById("teacher-csv-input")?.click()
            }
          >
            <input
              id="teacher-csv-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            />
            <UploadCloud
              className={`w-16 h-16 mx-auto mb-6 ${csvFile ? "text-primary-400" : "text-primary-200/10"}`}
            />
            {csvFile ? (
              <div className="animate-in fade-in zoom-in duration-500">
                <p className="text-primary font-black uppercase tracking-[0.2em] text-sm mb-2">
                  {csvFile.name}
                </p>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">
                  {(csvFile.size / 1024).toFixed(1)} KB DATA STREAM
                </p>
              </div>
            ) : (
              <div>
                <p className="text-primary font-black uppercase tracking-[0.2em] text-sm mb-2">
                  Drop Induction Protocol
                </p>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">
                  CSV RECORDS ONLY
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pb-4">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-14 text-[10px]"
              onClick={() => setIsBulkModalOpen(false)}
            >
              Abort
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={!csvFile || isUploading}
              className="flex-1 h-14 text-[10px]"
            >
              {isUploading ? "Ingesting..." : "Execute Mass Induction"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={teacherToDelete !== null}
        onClose={() => setTeacherToDelete(null)}
        onConfirm={() => {
          if (teacherToDelete) deleteTeacherMutation.mutate(teacherToDelete);
          setTeacherToDelete(null);
        }}
        title="Faculty Termination"
        description="Permanently revoke all access and purge educator's operational records from the grid?"
      />

      <TeacherAssignmentsModal
        isOpen={isAssignmentModalOpen}
        onClose={() => {
          setIsAssignmentModalOpen(false);
          setAssignmentTeacher(null);
        }}
        teacher={assignmentTeacher}
      />
    </motion.div>
  );
};

const TeacherAssignmentsModal = ({
  isOpen,
  onClose,
  teacher,
}: {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
}) => {
  const queryClient = useQueryClient();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedStream, setSelectedStream] = useState("");

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ["assignments", teacher?.id],
    queryFn: () => classesService.getAssignments(teacher?.id),
    enabled: !!teacher,
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => classesService.getSubjects(),
    enabled: isOpen,
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });
  const { data: grades = [] } = useQuery({
    queryKey: ["grades"],
    queryFn: () => classesService.getGrades(),
    enabled: isOpen,
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (data: any) => classesService.createAssignment(data),
    onSuccess: () => {
      toast.success("Assignment protocol synchronized");
      setSelectedSubject("");
      setSelectedStream("");
      queryClient.invalidateQueries({ queryKey: ["assignments", teacher?.id] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail || "Sync failure"),
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: number) => classesService.deleteAssignment(id),
    onSuccess: () => {
      toast.success("Assignment protocol revoked");
      queryClient.invalidateQueries({ queryKey: ["assignments", teacher?.id] });
    },
  });

  const handleAdd = () => {
    if (!teacher || !selectedSubject || !selectedStream) return;
    createAssignmentMutation.mutate({
      teacher: teacher.id,
      subject: parseInt(selectedSubject),
      stream: parseInt(selectedStream),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Intelligence Scope Assignment"
      className="max-w-4xl glass-morphic border-white/10 !rounded-[40px]"
    >
      <div className="space-y-10 mt-8">
        <div className="flex items-center gap-5 p-6 rounded-[32px] bg-primary-600/5 border border-primary-600/10">
          <div className="w-16 h-16 rounded-2xl bg-primary-600/10 flex items-center justify-center text-primary-400 font-black border border-primary-500/10 shrink-0">
            {teacher?.first_name[0]}
            {teacher?.last_name[0]}
          </div>
          <div>
            <h3 className="text-xl font-black text-primary uppercase tracking-tight leading-none mb-1">
              {teacher?.first_name} {teacher?.last_name}
            </h3>
            <p className="text-[10px] font-black text-dim uppercase tracking-[0.2em]">
              {teacher?.employee_id} • {teacher?.specialization || "GENERALIST"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-white/[0.01] rounded-[32px] border border-white/5">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] pl-1">
              Target Intelligence Node
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full h-14 bg-white/5 border border-white/5 rounded-xl px-4 text-primary text-sm outline-none focus:border-primary-500/50 transition-all"
            >
              <option value="" className="bg-bg-color">
                Select Domain...
              </option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id} className="bg-bg-color">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] pl-1">
              Operational Deployment Unit
            </label>
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className="w-full h-14 bg-white/5 border border-white/5 rounded-xl px-4 text-primary text-sm outline-none focus:border-primary-500/50 transition-all"
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
          <Button
            className="md:col-span-2 h-14 text-[10px]"
            onClick={handleAdd}
            disabled={
              !selectedSubject ||
              !selectedStream ||
              createAssignmentMutation.isPending
            }
          >
            <Plus className="w-4 h-4" /> Initialize Assignment Protocol
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-glow-sm" />
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
              Active Assignment Matrix
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {loadingAssignments ? (
                [1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-white/5 rounded-2xl animate-pulse"
                  />
                ))
              ) : assignments.length === 0 ? (
                <div className="col-span-full py-12 text-center rounded-[32px] border border-dashed border-white/5 opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    No Active Protocols
                  </p>
                </div>
              ) : (
                assignments.map((assignment: any) => (
                  <motion.div
                    key={assignment.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between p-5 rounded-[24px] bg-white/[0.03] border border-white/5 group"
                  >
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-tight mb-1">
                        {assignment.subject_name}
                      </p>
                      <p className="text-[9px] font-black text-dim uppercase tracking-widest">
                        {assignment.grade_name} {assignment.stream_name}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        deleteAssignmentMutation.mutate(assignment.id)
                      }
                      className="p-2.5 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-primary-200/20 hover:text-rose-400 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex justify-end">
          <Button
            variant="ghost"
            className="h-12 px-10 text-[10px]"
            onClick={onClose}
          >
            Close Matrix
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TeachersPage;
