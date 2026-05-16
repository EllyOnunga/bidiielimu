import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { accountsService } from "../api/services/accountsService";
import { ArrowRight, School as SchoolIcon, Globe } from "lucide-react";
import { ElimuHubLogo } from "../components/ui/Logo";

interface School {
  id: number;
  name: string;
  schema_name: string;
  domain?: string;
}

export const MySchoolsPage = () => {
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ["my-schools"],
    queryFn: accountsService.getSchools,
  });

  const handleSchoolSwitch = (school: School) => {
    const { protocol, port, hostname } = window.location;
    const isDev = hostname === "localhost" || port === "5173";

    if (isDev) {
      // Construction for local multi-tenancy (e.g., http://tenant.localhost:5173)
      const domain = school.schema_name.replace(/_/g, "-");
      window.location.href = `${protocol}//${domain}.localhost:5173`;
    } else {
      // Production redirection using the domain provided by the backend
      window.location.href = `${protocol}//${school.domain}`;
    }
  };

  return (
    <div className="min-h-screen bg-bg-color p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <ElimuHubLogo className="w-12 h-12" showText={false} />
              <h1 className="text-4xl font-black text-primary tracking-tighter uppercase font-serif">
                Institutional <span className="text-primary-500">Registry</span>
              </h1>
            </div>
            <p className="text-muted text-xs font-black uppercase tracking-widest leading-relaxed max-w-lg">
              Select an established institution to initialize operational
              command. Your credentials grant access to the following secure
              environments.
            </p>
          </div>
        </div>

        {/* GRID */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-white/5 rounded-[40px] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {schools.length === 0 ? (
              <div className="col-span-full py-20 text-center glass rounded-[40px] border-white/5">
                <SchoolIcon className="w-16 h-16 text-muted/20 mx-auto mb-4" />
                <p className="text-sm font-black text-muted uppercase tracking-widest">
                  No institutional affiliations detected.
                </p>
              </div>
            ) : (
              schools.map((school: School, index: number) => (
                <motion.div
                  key={school.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="premium-card p-8 group hover:scale-[1.02] transition-all duration-500 h-full flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="p-4 bg-primary-600/10 text-primary-400 rounded-2xl group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                          <SchoolIcon className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                            Active
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-primary uppercase tracking-tight mb-2 group-hover:text-primary-500 transition-colors">
                          {school.name}
                        </h3>
                        <div className="flex items-center gap-2 text-muted">
                          <Globe className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-mono font-bold">
                            {school.schema_name}.localhost
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleSchoolSwitch(school)}
                      className="w-full mt-8 bg-white/5 hover:bg-primary-600 text-primary-200 hover:text-white border-white/5 group/btn overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2 uppercase text-[10px] font-black tracking-widest">
                        Enter Dashboard
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
