import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Download,
  ArrowDownLeft,
  Clock,
  MoreHorizontal,
  CheckCircle,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/Table";
import { TableSkeleton } from "../ui/Skeleton";
import { feesService } from "../../api/services/feesService";

export const TransactionHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["fee_payments", searchTerm],
    queryFn: () => feesService.getPayments(searchTerm),
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
            Finance Ledger
          </h1>
          <p className="text-primary-200/40 font-bold uppercase tracking-widest mt-1 text-[10px] sm:text-xs">
            Real-time Transaction History
          </p>
        </div>

        <div className="flex flex-wrap gap-3 sm:gap-4 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all text-xs sm:text-sm">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            Filter
          </button>
          <button className="flex-1 sm:flex-none px-6 sm:px-8 py-3 bg-primary-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-primary-400 shadow-premium transition-all text-xs sm:text-sm">
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass p-3 sm:p-4 rounded-[24px] sm:rounded-[28px] border border-white/5 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[280px] sm:min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-primary-200/20" />
          <input
            type="text"
            placeholder="Search by student, transaction ID or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-2.5 sm:py-3 pl-10 sm:pl-12 pr-4 text-white focus:ring-2 focus:ring-primary-500/20 transition-all outline-none text-sm"
          />
        </div>
        <div className="flex gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-white/5 rounded-2xl border border-white/5">
          {["All", "Payments", "Refunds", "Waivers"].map((filter) => (
            <button
              key={filter}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-widest transition-all ${filter === "All" ? "bg-primary-500 text-white shadow-premium" : "text-primary-200/40 hover:text-white"}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass rounded-[32px] sm:rounded-[40px] border border-white/5 overflow-hidden relative">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/[0.02]">
              <TableHead>Transaction ID</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Date</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Ops</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={4} cols={7} />
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-primary-200/40 font-bold uppercase tracking-widest text-xs"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((tx: any) => (
                <TableRow key={tx.id} className="group">
                  <TableCell>
                    <span className="text-primary-200/30 font-black text-[10px] sm:text-xs uppercase">
                      {tx.transaction_id || tx.id}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-primary-400 font-black text-[10px] uppercase">
                        {(tx.student_name || "U").charAt(0)}
                      </div>
                      <span className="text-white font-bold text-xs sm:text-sm">
                        {tx.student_name || "Unknown Student"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2.5 sm:px-3 py-1 bg-white/5 rounded-lg text-[9px] sm:text-[10px] font-black text-primary-200/60 uppercase tracking-widest whitespace-nowrap">
                      {tx.payment_method || "UNKNOWN"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                      <ArrowDownLeft className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                      <span className="text-base sm:text-lg font-black tracking-tighter whitespace-nowrap text-white">
                        {tx.currency || "KES"}{" "}
                        {Number(tx.amount).toLocaleString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-primary-200/30 text-[10px] sm:text-xs whitespace-nowrap">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      {tx.payment_date || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-emerald-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      {tx.is_confirmed !== false ? "COMPLETED" : "PENDING"}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <button className="p-2 text-primary-200/20 hover:text-white transition-all">
                      <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
