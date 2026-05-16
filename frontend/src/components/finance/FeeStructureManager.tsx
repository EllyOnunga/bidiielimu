import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  Info,
} from "lucide-react";
import { feesService } from "../../api/services/feesService";

interface FeeStructure {
  id: number;
  grade_level_id: number;
  term: string;
  academic_year: string;
  amount: string | number;
  currency: string;
  description: string;
}

export const FeeStructureManager = () => {
  const { data: structures = [], isLoading } = useQuery({
    queryKey: ["fee_structures"],
    queryFn: () => feesService.getFeeStructures(),
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });

  const totalFees = structures.reduce(
    (acc: number, item: FeeStructure) => acc + Number(item.amount),
    0,
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Fee Structure
          </h1>
          <p className="text-primary-200/40 font-bold uppercase tracking-widest mt-1">
            Global Academic Year Structures
          </p>
        </div>

        <button className="px-8 py-4 bg-emerald-500 text-white rounded-[24px] font-black text-lg flex items-center gap-3 hover:bg-emerald-400 shadow-premium transition-all">
          <Plus className="w-6 h-6" />
          Create New Item
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fee Items List */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="text-center py-10 text-primary-200/40">
              Loading structures...
            </div>
          ) : structures.length === 0 ? (
            <div className="text-center py-10 text-primary-200/40">
              No fee structures defined yet.
            </div>
          ) : (
            structures.map((item: FeeStructure) => (
              <div
                key={item.id}
                className="glass p-6 rounded-[32px] border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all flex-wrap gap-4"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary-400 shrink-0">
                    <CreditCard className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">
                      {item.term} • {item.academic_year}
                    </h3>
                    <p className="text-xs font-bold text-primary-200/30 uppercase tracking-widest mt-1">
                      {item.description || "General Fee Component"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-8 ml-auto">
                  <p className="text-2xl font-black text-white tracking-tighter whitespace-nowrap">
                    {item.currency || "KES"}{" "}
                    {Number(item.amount).toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <button className="p-3 bg-white/5 rounded-xl text-primary-200/20 hover:text-white hover:bg-white/10 transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-3 bg-white/5 rounded-xl text-primary-200/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          <div className="p-10 border-2 border-dashed border-white/5 rounded-[48px] flex flex-col items-center justify-center text-center space-y-4 hover:border-primary-500/30 transition-all cursor-pointer mt-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/10">
              <Plus className="w-8 h-8" />
            </div>
            <p className="text-primary-200/20 font-bold uppercase tracking-widest text-xs">
              Click to add a custom fee component
            </p>
          </div>
        </div>

        {/* Summary & Controls */}
        <div className="space-y-8">
          <div className="glass p-10 rounded-[48px] border border-white/10 bg-primary-500/5 space-y-10">
            <div>
              <p className="text-sm font-black text-primary-400 uppercase tracking-widest mb-2">
                Total Fees Structured
              </p>
              <h2 className="text-5xl font-black text-white tracking-tighter">
                KES {totalFees.toLocaleString()}
              </h2>
            </div>

            <button className="w-full py-5 bg-white text-primary-900 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 shadow-premium hover:scale-[1.02] transition-all">
              Publish Structure
              <ShieldCheck className="w-6 h-6" />
            </button>
          </div>

          <div className="glass p-8 rounded-[40px] border border-white/5 space-y-6">
            <h4 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-3">
              <Info className="w-4 h-4" />
              Impact Summary
            </h4>
            <p className="text-primary-200/40 text-sm leading-relaxed">
              This structure applies to the specified grades. Total computed
              fees reflect the current filtered view.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
