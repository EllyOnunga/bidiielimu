import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MoreHorizontal,
  ChevronRight,
  Loader2,
  Edit2,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teachersService } from "../../api/services/teachersService";
import { hrService } from "../../api/services/hrService";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Select";

interface StaffMember {
  id: number;
  uniqueId?: string;
  name: string;
  first_name: string;
  last_name: string;
  role: string;
  designation?: string;
  specialization?: string;
  email: string;
  phone_number: string;
  status: "ACTIVE" | "ON_LEAVE" | "SUSPENDED";
  is_active: boolean;
  employee_id: string;
}

export const StaffDirectory = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"All" | "Teachers" | "Other">(
    "All",
  );
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_number: "",
    employee_id: "",
    designation: "",
    specialization: "",
    joining_date: new Date().toISOString().split("T")[0],
    contract_type: "PERMANENT",
    role: "TEACHER",
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: staff = [], isLoading: loading } = useQuery({
    queryKey: ["staff", debouncedSearch],
    queryFn: async () => {
      const [teachersRes, staffRes] = await Promise.all([
        teachersService.getAll(debouncedSearch),
        hrService.getStaffProfiles({ search: debouncedSearch }),
      ]);
      const teachers = Array.isArray(teachersRes)
        ? teachersRes
        : teachersRes.results || [];
      const otherStaff = Array.isArray(staffRes)
        ? staffRes
        : staffRes.results || [];

      const teachersList = teachers.map((t: any) => ({
        ...t,
        uniqueId: `teacher-${t.id}`,
        role: t.role || "TEACHER",
      }));
      const otherStaffList = otherStaff.map((s: any) => ({
        ...s,
        uniqueId: `staff-${s.id}`,
        role: s.role || "ADMIN",
      }));

      return [...teachersList, ...otherStaffList];
    },
  });

  const formatApiError = (error: any, fallbackMessage: string) => {
    const data = error.response?.data;
    if (data && typeof data === "object") {
      const messages = Object.entries(data)
        .map(([key, val]) => {
          if (key === "detail") return String(val);
          const formattedKey = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          const valMessage = Array.isArray(val) ? val.join(", ") : String(val);
          return `${formattedKey}: ${valMessage}`;
        })
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join("\n");
      }
    }
    return data?.detail || fallbackMessage;
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      return data.role === "TEACHER"
        ? teachersService.create(data)
        : hrService.createStaffProfile({ ...data, role_name: data.role });
    },
    onSuccess: () => {
      toast.success("Staff onboarded successfully!");
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (error: any) => {
      toast.error(formatApiError(error, "Failed to onboard staff"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => {
      return data.role === "TEACHER"
        ? teachersService.update(id, data)
        : hrService.updateStaffProfile(id, { ...data, role_name: data.role });
    },
    onSuccess: () => {
      toast.success("Staff updated");
      setIsModalOpen(false);
      setEditingStaff(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (error: any) => {
      toast.error(formatApiError(error, "Update failed"));
    },
  });

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      phone_number: "",
      employee_id: "",
      designation: "",
      specialization: "",
      joining_date: new Date().toISOString().split("T")[0],
      contract_type: "PERMANENT",
      role: "TEACHER",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editingStaff
      ? { ...formData, id: editingStaff.id }
      : formData;
    if (editingStaff) {
      updateMutation.mutate({ id: editingStaff.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      password: "",
      phone_number: member.phone_number,
      employee_id: member.employee_id,
      designation: member.designation || "",
      specialization: member.specialization || "",
      joining_date: new Date().toISOString().split("T")[0],
      contract_type: "PERMANENT",
      role: member.role,
    });
    setIsModalOpen(true);
  };

  const filteredStaff = staff.filter((member) => {
    if (activeTab === "Teachers") {
      return member.role === "TEACHER";
    }
    if (activeTab === "Other") {
      return member.role !== "TEACHER";
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-tighter">
            Staff Directory
          </h1>
          <p className="text-muted font-bold uppercase tracking-widest mt-1">
            Human Capital Management
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 sm:px-8 py-3 sm:py-4 bg-primary-500 text-white rounded-[24px] font-black text-sm sm:text-lg flex items-center gap-3 hover:bg-primary-400 shadow-premium transition-all active:scale-95 w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          Onboard New Staff
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass p-4 rounded-[28px] border border-white/5 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-200/20" />
          <input
            type="text"
            placeholder="Search staff by name, role or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-primary focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
          />
        </div>
        <div className="flex gap-2 p-2 bg-white/5 rounded-2xl border border-white/5">
          {(["All", "Teachers", "Other"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${tab === activeTab ? "bg-primary-500 text-white shadow-premium" : "text-muted hover:text-primary"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
          <p className="text-muted font-bold uppercase tracking-widest">
            Accessing Secure Records...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredStaff.map((member: StaffMember) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={member.uniqueId}
              className="glass rounded-[40px] border border-white/5 overflow-hidden group hover:border-primary-500/30 transition-all"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-all shadow-inner">
                    <Users className="w-8 h-8" />
                  </div>
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-2 text-primary-200/20 hover:text-primary-400 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-primary-200/20 hover:text-white transition-all">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-black text-primary">
                    {member.first_name} {member.last_name}
                  </h3>
                  <p className="text-[10px] sm:text-xs font-bold text-primary-400 uppercase tracking-widest mt-1">
                    {member.designation || member.specialization || "Staff"}
                  </p>
                  <p className="text-[9px] sm:text-[10px] font-black text-dim uppercase tracking-tighter mt-1">
                    ID: {member.employee_id}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Mail className="w-3.5 h-3.5 text-dim" />
                    <p className="text-xs text-muted truncate">
                      {member.email || "No email"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-3.5 h-3.5 text-dim" />
                    <p className="text-xs text-muted">{member.phone_number}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      member.is_active
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {member.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-primary-200/20 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
          {filteredStaff.length === 0 && (
            <div className="col-span-full text-center py-20">
              <p className="text-primary-200/20 font-black text-2xl">
                NO STAFF MEMBERS FOUND
              </p>
            </div>
          )}
        </div>
      )}

      {/* Onboard Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStaff(null);
          resetForm();
        }}
        title={editingStaff ? "Edit Staff Member" : "Onboard New Staff"}
      >
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-2"
        >
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">
              First Name
            </label>
            <input
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-primary outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
              value={formData.first_name}
              onChange={(e) =>
                setFormData({ ...formData, first_name: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">
              Last Name
            </label>
            <input
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-primary outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
              value={formData.last_name}
              onChange={(e) =>
                setFormData({ ...formData, last_name: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">
              Work Email
            </label>
            <input
              required
              type="email"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-primary outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">
              Temporary Password
            </label>
            <input
              required
              type="password"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-primary outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">
              Employee ID
            </label>
            <input
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
              value={formData.employee_id}
              onChange={(e) =>
                setFormData({ ...formData, employee_id: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">
              Phone Number
            </label>
            <input
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
              value={formData.phone_number}
              onChange={(e) =>
                setFormData({ ...formData, phone_number: e.target.value })
              }
            />
          </div>
          <Select
            label="System Role"
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="TEACHER" className="bg-bg-color">
              Teacher
            </option>
            <option value="ADMIN" className="bg-bg-color">
              Administrator
            </option>
            <option value="PRINCIPAL" className="bg-bg-color">
              Principal
            </option>
            <option value="HOD" className="bg-bg-color">
              Head of Department
            </option>
            <option value="LIBRARIAN" className="bg-bg-color">
              Librarian
            </option>
            <option value="FINANCE" className="bg-bg-color">
              Finance / Bursar
            </option>
          </Select>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">
              Designation
            </label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
              placeholder="e.g. Senior Teacher"
              value={formData.designation}
              onChange={(e) =>
                setFormData({ ...formData, designation: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-primary-200/40 uppercase tracking-widest ml-1">
              Joining Date
            </label>
            <input
              type="date"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
              value={formData.joining_date}
              onChange={(e) =>
                setFormData({ ...formData, joining_date: e.target.value })
              }
            />
          </div>

          <div className="col-span-full pt-6">
            <button
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full py-4 bg-primary-500 hover:bg-primary-400 text-white rounded-[20px] font-black text-base shadow-premium transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {createMutation.isPending || updateMutation.isPending
                ? "PROVISIONING..."
                : "FINALIZE ONBOARDING"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
