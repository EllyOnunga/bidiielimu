import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  disciplineService,
  type DisciplineIncident,
} from "../../api/services/disciplineService";
import {
  studentsService,
  type Student,
} from "../../api/services/studentsService";
import { toast } from "react-hot-toast";
import { Select } from "../ui/Select";

interface IncidentFormProps {
  open: boolean;
  onClose: () => void;
}

export const IncidentForm = ({ open, onClose }: IncidentFormProps) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<DisciplineIncident>>({
    student: "",
    date: new Date().toISOString().split("T")[0],
    category: "MINOR",
    summary: "",
    description: "",
    action_taken: "",
    status: "PENDING",
  });

  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ["students-list"],
    queryFn: () => studentsService.getAll(),
    enabled: open,
  });

  const students: Student[] = Array.isArray(studentsData)
    ? studentsData
    : studentsData?.results || [];

  const createIncidentMutation = useMutation({
    mutationFn: (data: Partial<DisciplineIncident>) =>
      disciplineService.createIncident(data),
    onSuccess: () => {
      toast.success("Incident recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["discipline-incidents"] });
      onClose();
      // Reset form
      setFormData({
        student: "",
        date: new Date().toISOString().split("T")[0],
        category: "MINOR",
        summary: "",
        description: "",
        action_taken: "",
        status: "PENDING",
      });
    },
    onError: (error) => {
      console.error("Failed to create incident:", error);
      toast.error("Failed to record incident");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student || !formData.summary || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    createIncidentMutation.mutate(formData);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="glass p-8 rounded-[32px] w-full max-w-lg z-10 border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-extrabold text-white tracking-tight">
            Record Incident
          </h3>
          <button
            onClick={onClose}
            className="text-white/20 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Select
                label="Student"
                value={formData.student}
                onChange={(e) =>
                  setFormData({ ...formData, student: e.target.value })
                }
              >
                {loadingStudents ? (
                  <option className="bg-slate-900">Loading students...</option>
                ) : (
                  <>
                    <option value="" className="bg-slate-900">
                      Select a student
                    </option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id} className="bg-slate-900">
                        {s.first_name} {s.last_name} ({s.admission_number})
                      </option>
                    ))}
                  </>
                )}
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500/50 transition-all"
              />
            </div>

            <Select
              label="Severity"
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as DisciplineIncident["category"],
                })
              }
            >
              <option value="MINOR" className="bg-slate-900">
                Minor
              </option>
              <option value="MAJOR" className="bg-slate-900">
                Major
              </option>
              <option value="SEVERE" className="bg-slate-900">
                Severe
              </option>
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">
              Summary
            </label>
            <input
              value={formData.summary}
              onChange={(e) =>
                setFormData({ ...formData, summary: e.target.value })
              }
              placeholder="Brief title of the incident"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500/50 transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block">
              Detailed Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Provide a detailed account of what happened..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500/50 transition-all resize-none"
            />
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createIncidentMutation.isPending}
              className="flex-[2] px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-black text-sm transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 active:scale-95"
            >
              {createIncidentMutation.isPending
                ? "Recording..."
                : "Record Incident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentForm;
