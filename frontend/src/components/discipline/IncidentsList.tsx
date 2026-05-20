import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  disciplineService,
  type DisciplineIncident,
} from "../../api/services/disciplineService";
import { toast } from "react-hot-toast";

interface IncidentsListProps {
  onOpenProfile: (id: string) => void;
  onOpenForm: () => void;
}

export const IncidentsList = ({
  onOpenProfile,
  onOpenForm,
}: IncidentsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["discipline-incidents", searchTerm],
    queryFn: () => disciplineService.getIncidents({ search: searchTerm }),
  });

  const incidents: DisciplineIncident[] = Array.isArray(data)
    ? data
    : data?.results || [];

  useEffect(() => {
    if (error) {
      console.error("Failed to fetch incidents:", error);
      toast.error("Failed to load incidents");
    }
  }, [error]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "SEVERE":
        return "text-red-400";
      case "MAJOR":
        return "text-orange-400";
      default:
        return "text-primary-400";
    }
  };

  return (
    <div className="glass p-6 rounded-[24px] w-full border border-white/5">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-white">Recent Incidents</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students or incidents..."
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/20 w-full md:w-64 focus:outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>
          <button
            onClick={onOpenForm}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary-500/20 active:scale-95"
          >
            Add New
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : incidents.length > 0 ? (
        <div className="grid gap-3">
          {incidents.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/5 transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white truncate">
                    {it.student_name}
                  </span>
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/40 font-medium">
                    {new Date(it.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-white/50 truncate max-w-md">
                  {it.summary}
                </div>
              </div>

              <div className="flex items-center gap-4 ml-4">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${getSeverityColor(it.category)}`}
                >
                  {it.category}
                </span>
                <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
                <button
                  onClick={() => onOpenProfile(it.student)}
                  className="text-white/40 hover:text-primary-400 text-xs font-semibold transition-colors uppercase tracking-wider"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
          <div className="text-white/20 text-sm mb-2">No incidents found</div>
          <button
            onClick={() => setSearchTerm("")}
            className="text-primary-400 text-xs hover:underline"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
};

export default IncidentsList;
