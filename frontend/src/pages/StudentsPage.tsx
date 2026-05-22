import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  UserPlus,
  UploadCloud,
  Settings,
  Trash2,
  Users,
  BookOpen,
  UserSquare2,
  Shield,
  ChevronRight,
} from "lucide-react";
import { studentsService, type Student } from "../api/services/studentsService";
import { classesService } from "../api/services/classesService";
import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { Select } from "../components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Tabs } from "../components/ui/Tabs";

const StudentCard = ({
  student,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
}: {
  student: Student;
  onEdit: () => void;
  onDelete: () => void;
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`premium-card p-4 space-y-4 group transition-all relative ${isSelected ? "border-primary-500/50 bg-primary-500/5" : ""}`}
    onClick={(e) => {
      if ((e.target as HTMLElement).closest("button")) return;
      onSelect();
    }}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center text-primary-400 font-black text-xs">
          {student.first_name[0]}
          {student.last_name[0]}
        </div>
        <div>
          <h3 className="text-xs font-black text-primary uppercase tracking-tight">
            {student.first_name} {student.last_name}
          </h3>
          <p className="text-[10px] font-mono text-dim">
            {student.admission_number}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-2 hover:bg-white/10 rounded-lg text-primary-200/30 hover:text-white transition-all"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-rose-500/10 text-primary-200/30 hover:text-rose-400 rounded-lg transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div className="bg-white/5 p-2 rounded-lg">
        <p className="text-[8px] font-black text-dim uppercase tracking-widest mb-1">
          Class Stream
        </p>
        <p className="text-[10px] font-bold text-primary truncate">
          {student.grade_name || "Unassigned"}
        </p>
      </div>
      <div className="bg-white/5 p-2 rounded-lg">
        <p className="text-[8px] font-black text-dim uppercase tracking-widest mb-1">
          Guardian
        </p>
        <p className="text-[10px] font-bold text-primary truncate">
          {student.guardians?.[0]?.first_name || "—"}
        </p>
      </div>
    </div>

    <div className="flex items-center justify-between pt-2 border-t border-white/5">
      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest">
        Active
      </span>
      <ChevronRight className="w-3.5 h-3.5 text-primary-200/10 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
    </div>
  </motion.div>
);

export const StudentsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    admission_number: "",
    first_name: "",
    last_name: "",
    gender: "M" as "M" | "F" | "O",
    date_of_birth: "",
    enrollment_date: "",
    guardian_name: "",
    guardian_phone: "",
    guardian_email: "",
    guardian_relationship: "LEGAL_GUARDIAN" as
      | "FATHER"
      | "MOTHER"
      | "STEP_FATHER"
      | "STEP_MOTHER"
      | "LEGAL_GUARDIAN"
      | "SPONSOR",
    email: "",
    password: "",
    stream: "",
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === studentsData.length && studentsData.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(studentsData.map((s: Student) => s.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const { data: studentsData = [], isLoading: loading } = useQuery({
    queryKey: ["students", debouncedSearch],
    queryFn: () => studentsService.getAll(debouncedSearch),
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });

  const createStudentMutation = useMutation({
    mutationFn: (data: any) => studentsService.create(data),
    onSuccess: () => {
      toast.success("Student added successfully!");
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: any) => {
      const data = error.response?.data;
      const errorMsg =
        data?.detail ||
        data?.email?.[0] ||
        data?.admission_number?.[0] ||
        "Failed to add student. Please check all fields.";
      toast.error(errorMsg);
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      studentsService.update(id, data),
    onSuccess: () => {
      toast.success("Student updated successfully!");
      setIsModalOpen(false);
      setEditingStudent(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update student");
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: (id: number) => studentsService.delete(id),
    onSuccess: () => {
      toast.success("Student deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete student");
    },
  });

  const { data: gradesData = [] } = useQuery({
    queryKey: ["grades"],
    queryFn: () => classesService.getGrades(),
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });

  const [importTaskId, setImportTaskId] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importStats, setImportStats] = useState({
    success: 0,
    total: 0,
    current: 0,
  });
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const importStudentsMutation = useMutation({
    mutationFn: (file: File) => studentsService.importStudents(file),
    onSuccess: (data) => {
      setImportTaskId(data.task_id);
      setImportStatus(data.status || "PENDING");
      setImportProgress(0);
      setImportStats({ success: 0, total: 0, current: 0 });
      setImportErrors([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Import failed to start");
    },
  });

  useEffect(() => {
    if (!importTaskId) return;

    const intervalId = setInterval(async () => {
      try {
        const data = await studentsService.importStatus(importTaskId);
        setImportStatus(data.status);
        setImportStats({
          success: data.success_count || 0,
          total: data.total || 0,
          current: data.current || 0,
        });
        setImportErrors(data.errors || []);

        if (data.total > 0) {
          setImportProgress(
            Math.min(100, Math.round((data.current / data.total) * 100)),
          );
        }

        if (data.status === "SUCCESS") {
          clearInterval(intervalId);
          toast.success("Student import completed successfully!");
          queryClient.invalidateQueries({ queryKey: ["students"] });
        } else if (data.status === "FAILURE") {
          clearInterval(intervalId);
          toast.error("Student import failed.");
        }
      } catch (err: any) {
        // Silently retry or fail gracefully
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [importTaskId, queryClient]);

  const resetForm = () => {
    setFormData({
      admission_number: "",
      first_name: "",
      last_name: "",
      gender: "M",
      date_of_birth: "",
      enrollment_date: "",
      guardian_name: "",
      guardian_phone: "",
      guardian_email: "",
      guardian_relationship: "LEGAL_GUARDIAN",
      email: "",
      password: "",
      stream: "",
    });
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      admission_number: student.admission_number,
      first_name: student.first_name,
      last_name: student.last_name,
      gender: student.gender || "M",
      date_of_birth: student.date_of_birth || "",
      enrollment_date: student.enrollment_date || "",
      guardian_name: student.guardians?.[0]
        ? `${student.guardians[0].first_name} ${student.guardians[0].last_name}`.trim()
        : "",
      guardian_phone: student.guardians?.[0]?.phone_number || "",
      guardian_email: student.guardians?.[0]?.email || "",
      guardian_relationship:
        student.guardians?.[0]?.relationship || "LEGAL_GUARDIAN",
      email: student.email || "",
      password: "",
      stream: student.stream?.toString() || "",
    });
    setIsModalOpen(true);
  };

  const handleAddStudent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isModalOpen) {
      setEditingStudent(null);
      resetForm();
      setIsModalOpen(true);
      return;
    }

    const guardian = {
      first_name: formData.guardian_name.split(" ")[0],
      last_name:
        formData.guardian_name.split(" ").slice(1).join(" ") || "Unknown",
      relationship: formData.guardian_relationship,
      phone_number: formData.guardian_phone,
      ...(formData.guardian_email ? { email: formData.guardian_email } : {}),
    };

    const {
      guardian_name: _gn,
      guardian_phone: _gp,
      guardian_email: _ge,
      guardian_relationship: _gr,
      email,
      password,
      stream,
      ...coreFields
    } = formData;

    if (editingStudent) {
      const payload: Record<string, unknown> = {
        ...coreFields,
        ...(stream ? { stream: Number(stream) } : {}),
        guardians: [guardian],
      };
      if (email && email.trim() !== "") payload.email = email;
      if (password && password.trim() !== "") payload.password = password;
      updateStudentMutation.mutate({ id: editingStudent.id, data: payload });
    } else {
      const payload: Record<string, unknown> = {
        ...coreFields,
        ...(stream ? { stream: Number(stream) } : {}),
        email,
        password,
        guardians: [guardian],
      };
      createStudentMutation.mutate(payload);
    }
  };

  const handleBulkUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return toast.error("Please select a CSV file first.");
    importStudentsMutation.mutate(csvFile);
  };

  const downloadTemplate = async () => {
    try {
      const blob = await studentsService.getTemplate();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "students_import_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Failed to download template.");
    }
  };

  const tabs = [
    {
      id: "identity",
      label: "Identity",
      icon: Users,
      content: (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Input
              required
              placeholder="First Name"
              value={formData.first_name}
              onChange={(e) =>
                setFormData({ ...formData, first_name: e.target.value })
              }
              className="h-12 text-sm"
            />
            <Input
              required
              placeholder="Last Name"
              value={formData.last_name}
              onChange={(e) =>
                setFormData({ ...formData, last_name: e.target.value })
              }
              className="h-12 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-primary-200/20 uppercase tracking-widest pl-1">
                Birth Date
              </label>
              <Input
                required
                type="date"
                value={formData.date_of_birth}
                onChange={(e) =>
                  setFormData({ ...formData, date_of_birth: e.target.value })
                }
                className="h-12 text-sm"
              />
            </div>
            <Select
              label="Gender"
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value as any })
              }
            >
              <option value="M" className="bg-bg-color">
                Male
              </option>
              <option value="F" className="bg-bg-color">
                Female
              </option>
            </Select>
          </div>
        </div>
      ),
    },
    {
      id: "academic",
      label: "Academic",
      icon: BookOpen,
      content: (
        <div className="space-y-4 pt-2">
          <Input
            required
            placeholder="Admission No (e.g. ADM-001)"
            value={formData.admission_number}
            onChange={(e) =>
              setFormData({ ...formData, admission_number: e.target.value })
            }
            className="h-12 text-sm"
          />
          <Select
            label="Target Stream"
            required
            value={formData.stream}
            onChange={(e) =>
              setFormData({ ...formData, stream: e.target.value })
            }
          >
            <option value="" className="bg-bg-color">
              Select Target Stream...
            </option>
            {gradesData.map((grade: any) => (
              <optgroup
                key={grade.id}
                label={grade.name}
                className="bg-bg-color"
              >
                {grade.streams.map((stream: any) => (
                  <option
                    key={stream.id}
                    value={stream.id.toString()}
                    className="bg-bg-color"
                  >
                    {grade.name} {stream.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-primary-200/20 uppercase tracking-widest pl-1">
              Enrollment Date
            </label>
            <Input
              required
              type="date"
              value={formData.enrollment_date}
              onChange={(e) =>
                setFormData({ ...formData, enrollment_date: e.target.value })
              }
              className="h-12 text-sm"
            />
          </div>
        </div>
      ),
    },
    {
      id: "guardian",
      label: "Guardian",
      icon: UserSquare2,
      content: (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Input
              required
              placeholder="Full Name"
              value={formData.guardian_name}
              onChange={(e) =>
                setFormData({ ...formData, guardian_name: e.target.value })
              }
              className="h-12 text-sm"
            />
            <Select
              label="Relationship"
              value={formData.guardian_relationship}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  guardian_relationship: e.target.value as any,
                })
              }
            >
              <option value="FATHER" className="bg-bg-color">
                Father
              </option>
              <option value="MOTHER" className="bg-bg-color">
                Mother
              </option>
              <option value="LEGAL_GUARDIAN" className="bg-bg-color">
                Guardian
              </option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              required
              type="tel"
              placeholder="Phone No"
              value={formData.guardian_phone}
              onChange={(e) =>
                setFormData({ ...formData, guardian_phone: e.target.value })
              }
              className="h-12 text-sm"
            />
            <Input
              type="email"
              placeholder="Email (Optional)"
              value={formData.guardian_email}
              onChange={(e) =>
                setFormData({ ...formData, guardian_email: e.target.value })
              }
              className="h-12 text-sm"
            />
          </div>
        </div>
      ),
    },
    {
      id: "security",
      label: "Access",
      icon: Shield,
      content: (
        <div className="space-y-4 pt-2">
          <Input
            required
            type="email"
            placeholder="Portal Login (Email)"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="h-12 text-sm"
          />
          <Input
            required={!editingStudent}
            type="password"
            placeholder={
              editingStudent
                ? "Reset Password? (Leave blank to keep)"
                : "Encryption Key"
            }
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="h-12 text-sm"
          />
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 md:space-y-12 pb-12"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary tracking-tight leading-none">
            Student <span className="text-gradient">Directory</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm md:text-base font-medium max-w-xl">
            A complete list of all students registered in our school, with their
            class and guardian details.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Button
            variant="outline"
            onClick={() => setIsBulkModalOpen(true)}
            className="gap-2 flex-1 sm:flex-none"
          >
            <UploadCloud className="w-4 h-4" /> Import CSV
          </Button>
          <Button
            onClick={handleAddStudent}
            className="gap-2 flex-1 sm:flex-none"
          >
            <UserPlus className="w-4 h-4" /> Add Student
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/20" />
            <Input
              type="text"
              placeholder="Search by admission number, name, or parent..."
              className="pl-12 bg-white/5 border-white/5 focus:bg-white/10 h-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 md:flex-none gap-2 text-[10px] h-10"
            >
              <Filter className="w-3.5 h-3.5" /> Filters
            </Button>
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 md:flex-none text-[10px] h-10"
                onClick={() => setIsBulkDeleteConfirmOpen(true)}
              >
                Delete ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        {/* Card View for Mobile, Table for Desktop */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="premium-card p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <TableSkeleton rows={1} cols={1} />
                  <div className="space-y-2">
                    <TableSkeleton rows={1} cols={1} />
                    <TableSkeleton rows={1} cols={1} />
                  </div>
                </div>
              </div>
            ))
          ) : studentsData.length === 0 ? (
            <div className="premium-card text-center py-20 italic text-[10px] font-black text-dim uppercase tracking-widest">
              No student records found.
            </div>
          ) : (
            studentsData.map((student: Student) => (
              <StudentCard
                key={student.id}
                student={student}
                onEdit={() => handleEditStudent(student)}
                onDelete={() => setStudentToDelete(student.id)}
                isSelected={selectedIds.includes(student.id)}
                onSelect={() => toggleSelect(student.id)}
              />
            ))
          )}
        </div>

        <div className="hidden md:block premium-card !p-0 overflow-hidden relative">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === studentsData.length &&
                      studentsData.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </TableHead>
                <TableHead>Admission No.</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Class Stream</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Parent / Guardian</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton rows={10} cols={8} />
              ) : (
                studentsData.map((student: Student, idx: number) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`group transition-all hover:bg-white/[0.03] ${selectedIds.includes(student.id) ? "bg-primary-500/5" : ""}`}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="font-black text-primary-400 font-mono text-xs">
                      {student.admission_number}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-black text-primary uppercase tracking-tight">
                        {student.first_name} {student.last_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-lg bg-primary-600/10 text-primary-400 text-[9px] font-black uppercase tracking-widest border border-primary-500/10">
                        {student.grade_name || "Unallocated"}{" "}
                        {student.stream_name ? `• ${student.stream_name}` : ""}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted text-[10px] font-bold uppercase">
                      {student.gender === "M" ? "Male" : "Female"}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-bold text-primary truncate max-w-[150px]">
                        {student.guardians?.[0]
                          ? `${student.guardians[0].first_name} ${student.guardians[0].last_name}`
                          : "—"}
                      </div>
                      <div className="text-[9px] font-black text-dim uppercase font-mono">
                        {student.guardians?.[0]?.phone_number || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/10">
                        Active
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditStudent(student)}
                          className="p-2 hover:bg-white/10 rounded-lg text-primary-200/30 hover:text-white transition-all"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setStudentToDelete(student.id)}
                          className="p-2 hover:bg-rose-500/10 text-primary-200/30 hover:text-rose-400 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
        }}
        title={editingStudent ? "Edit Student Details" : "Register New Student"}
        className="max-w-2xl !rounded-[32px] glass-morphic"
      >
        <div className="mt-4">
          <Tabs tabs={tabs} />

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/5 mt-6">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 text-[10px] h-12"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-[2] text-[10px] h-12"
              disabled={
                createStudentMutation.isPending ||
                updateStudentMutation.isPending
              }
              onClick={handleAddStudent}
            >
              {createStudentMutation.isPending ||
              updateStudentMutation.isPending
                ? "Saving..."
                : editingStudent
                  ? "Save Changes"
                  : "Register Student"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => {
          if (importStatus !== "PENDING" && importStatus !== "PROGRESS") {
            setIsBulkModalOpen(false);
            setImportTaskId(null);
            setCsvFile(null);
          }
        }}
        title="Upload Student List"
        className="max-w-lg glass-morphic border-white/10 !rounded-[32px]"
      >
        {importTaskId ? (
          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-primary-200">
                <span>
                  {importStatus === "SUCCESS"
                    ? "Import Finished"
                    : importStatus === "FAILURE"
                      ? "Import Failed"
                      : "Processing CSV..."}
                </span>
                <span className="font-mono text-primary-400">
                  {importProgress}%
                </span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${importProgress}%` }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full"
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="text-[9px] text-dim font-bold uppercase tracking-widest text-right mt-1.5">
                Processed {importStats.current} of {importStats.total} rows
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl text-center backdrop-blur-sm">
                <span className="text-emerald-400 text-base font-black uppercase block">
                  {importStats.success}
                </span>
                <span className="text-[8px] text-primary-200/40 uppercase tracking-widest font-black mt-1.5 block">
                  Imported
                </span>
              </div>
              <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl text-center backdrop-blur-sm">
                <span className="text-rose-400 text-base font-black uppercase block">
                  {importErrors.length}
                </span>
                <span className="text-[8px] text-primary-200/40 uppercase tracking-widest font-black mt-1.5 block">
                  Errors
                </span>
              </div>
            </div>

            {importErrors.length > 0 && (
              <div className="space-y-2">
                <span className="text-[9px] font-black text-dim uppercase tracking-widest pl-1 block">
                  Detailed Error Log
                </span>
                <div className="max-h-40 overflow-y-auto bg-white/5 rounded-2xl p-4 border border-white/5 space-y-2 font-mono text-[9px] text-rose-300 backdrop-blur-sm">
                  {importErrors.map((err, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-rose-500 select-none font-bold">
                        •
                      </span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2 pb-2">
              {importStatus === "SUCCESS" || importStatus === "FAILURE" ? (
                <Button
                  onClick={() => {
                    setIsBulkModalOpen(false);
                    setImportTaskId(null);
                    setCsvFile(null);
                  }}
                  className="w-full text-[10px] h-12"
                >
                  Close & Refresh
                </Button>
              ) : (
                <div className="text-center w-full text-[10px] font-black uppercase text-dim tracking-widest py-3 animate-pulse">
                  Celery background processor active...
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div
              className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer ${
                csvFile
                  ? "border-primary-500 bg-primary-500/5"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
              <div className="flex flex-col items-center gap-4">
                <UploadCloud
                  className={`w-12 h-12 ${csvFile ? "text-primary-500" : "text-primary-200/20"}`}
                />
                {csvFile ? (
                  <div>
                    <p className="text-xs font-black text-white uppercase">
                      {csvFile.name}
                    </p>
                    <p className="text-[9px] font-bold text-primary-200/40 uppercase tracking-widest mt-1">
                      {(csvFile.size / 1024).toFixed(1)} KB Ready
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-black text-white uppercase">
                      Select CSV File
                    </p>
                    <p className="text-[9px] font-bold text-primary-200/20 uppercase tracking-widest mt-1">
                      CSV Format Required
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-4">
              <div className="space-y-1.5 flex-1">
                <p className="text-xs font-black text-white uppercase">
                  Template Missing?
                </p>
                <p className="text-[10px] font-medium text-primary-200/40 leading-relaxed">
                  Download the structured CSV template to ensure everything
                  matches correctly.
                </p>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="text-[10px] font-black text-primary-400 hover:text-primary-300 mt-2 uppercase tracking-widest transition-all"
                >
                  Download Template →
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-2">
              <Button
                variant="ghost"
                className="flex-1 text-[10px] h-11"
                onClick={() => setIsBulkModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkUpload}
                disabled={!csvFile || importStudentsMutation.isPending}
                className="flex-[2] text-[10px] h-11"
              >
                {importStudentsMutation.isPending
                  ? "Uploading..."
                  : "Upload List"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={studentToDelete !== null}
        onClose={() => setStudentToDelete(null)}
        onConfirm={() => {
          if (studentToDelete) deleteStudentMutation.mutate(studentToDelete);
        }}
        title="Delete Student"
        description="Are you sure you want to permanently delete this student's records? This action cannot be undone."
      />

      <ConfirmModal
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={() => {
          toast
            .promise(
              Promise.all(selectedIds.map((id) => studentsService.delete(id))),
              {
                loading: "Deleting selected students...",
                success: "Students deleted",
                error: "Failed to delete students",
              },
            )
            .then(() => {
              setSelectedIds([]);
              queryClient.invalidateQueries({ queryKey: ["students"] });
            });
        }}
        title="Delete Multiple Students"
        description={`Are you sure you want to permanently delete these ${selectedIds.length} students? This action cannot be undone.`}
      />
    </motion.div>
  );
};
