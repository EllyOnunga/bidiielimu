import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { IncidentsList } from "../components/discipline/IncidentsList";
import { IncidentForm } from "../components/discipline/IncidentForm";
import { StudentProfile } from "../components/discipline/StudentProfile";

export const DisciplinePage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8 p-4 md:p-0"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Discipline & Conduct</h1>
          <p className="text-sm text-primary-200/40 font-medium">Manage student incidents, conduct profiles and disciplinary actions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsFormOpen(true)} 
            className="uppercase tracking-[0.2em] text-[10px] font-black px-6 py-3 bg-primary-500 hover:bg-primary-600 border-none shadow-xl shadow-primary-500/20 transition-all active:scale-95"
          >
            New Incident
          </Button>
        </div>
      </div>

      <div className="w-full">
        <IncidentsList
          onOpenProfile={(studentId) => setSelectedStudentId(studentId)}
          onOpenForm={() => setIsFormOpen(true)}
        />
      </div>

      <IncidentForm 
        open={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
      />

      <StudentProfile
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    </motion.div>
  );
};

export default DisciplinePage;
