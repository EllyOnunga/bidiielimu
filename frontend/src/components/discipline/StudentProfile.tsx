import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  disciplineService,
  type DisciplineIncident,
} from "../../api/services/disciplineService";
import {
  studentsService,
  type Student,
} from "../../api/services/studentsService";
import { toast } from "react-hot-toast";

interface StudentProfileProps {
  studentId: string | null;
  onClose: () => void;
}

export const StudentProfile = ({ studentId, onClose }: StudentProfileProps) => {
  const {
    data: student,
    isLoading: loadingStudent,
    error: studentError,
  } = useQuery<Student>({
    queryKey: ["student", studentId],
    queryFn: () => studentsService.getById(parseInt(studentId!)),
    enabled: !!studentId,
  });

  const {
    data: incidentsData,
    isLoading: loadingIncidents,
    error: incidentsError,
  } = useQuery({
    queryKey: ["student-incidents", studentId],
    queryFn: () => disciplineService.getIncidents({ student: studentId }),
    enabled: !!studentId,
  });

  useEffect(() => {
    if (studentError || incidentsError) {
      toast.error("Failed to load student profile information");
    }
  }, [studentError, incidentsError]);

  const incidents: DisciplineIncident[] = Array.isArray(incidentsData)
    ? incidentsData
    : incidentsData?.results || [];
  const loading = loadingStudent || loadingIncidents;

  if (!studentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="glass h-full w-full max-w-md z-10 border-l border-white/10 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              Student Conduct
            </h3>
            <button
              onClick={onClose}
              className="bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all"
            >
              <svg
                className="w-5 h-5 text-white/40"
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

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : student ? (
            <div className="space-y-8">
              <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                <div className="w-16 h-16 rounded-2xl bg-primary-500/20 flex items-center justify-center text-primary-400 text-2xl font-black">
                  {student.first_name[0]}
                  {student.last_name[0]}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">
                    {student.first_name} {student.last_name}
                  </h4>
                  <p className="text-xs font-black uppercase tracking-widest text-white/30">
                    ID: {student.admission_number}
                  </p>
                  <p className="text-xs text-primary-400/60 mt-1">
                    {student.grade_name} • {student.stream_name}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    Incident History
                  </h5>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400">
                    {incidents.length} Total
                  </span>
                </div>

                {incidents.length > 0 ? (
                  <div className="space-y-3">
                    {incidents.map((it) => (
                      <div
                        key={it.id}
                        className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-white/60">
                            {new Date(it.date).toLocaleDateString()}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase tracking-widest ${
                              it.category === "SEVERE"
                                ? "text-red-400"
                                : it.category === "MAJOR"
                                  ? "text-orange-400"
                                  : "text-primary-400"
                            }`}
                          >
                            {it.category}
                          </span>
                        </div>
                        <h6 className="text-sm font-bold text-white mb-1">
                          {it.summary}
                        </h6>
                        <p className="text-xs text-white/40 leading-relaxed">
                          {it.description}
                        </p>
                        {it.action_taken && (
                          <div className="mt-3 pt-3 border-t border-white/5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/20 block mb-1">
                              Action Taken
                            </span>
                            <p className="text-xs text-primary-200/50 italic">
                              "{it.action_taken}"
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                    <p className="text-xs text-white/20">
                      No disciplinary records found
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-white/20">Student profile not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
