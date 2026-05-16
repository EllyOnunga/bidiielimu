import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Search,
  Plus,
  AlertTriangle,
  ArrowDownLeft,
  BookOpen,
  Pencil,
  Truck,
  MoreHorizontal,
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
import {
  inventoryService,
  type StockItem,
} from "../../api/services/inventoryService";

export const InventoryManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const { data: rawStock = [], isLoading } = useQuery({
    queryKey: ["inventory", activeTab],
    queryFn: () => inventoryService.getItems(activeTab),
    select: (data) => (Array.isArray(data) ? data : data.results || []),
  });

  const stock: StockItem[] = rawStock;

  const filteredStock = stock.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalCategories = new Set(stock.map((s) => s.category)).size;
  const lowStockCount = stock.filter(
    (s) => s.quantity < s.min_threshold,
  ).length;
  const libraryCollection = stock
    .filter((s) => s.category === "LIBRARY")
    .reduce((acc, s) => acc + s.quantity, 0);

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
            Inventory & Stock
          </h1>
          <p className="text-primary-200/40 font-bold uppercase tracking-widest mt-1 text-[10px] sm:text-xs">
            Resource & Supply Management
          </p>
        </div>

        <div className="flex flex-wrap gap-3 sm:gap-4 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all text-xs sm:text-sm">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            Procurement
          </button>
          <button className="flex-1 sm:flex-none px-6 sm:px-8 py-3 bg-primary-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-primary-400 shadow-premium transition-all text-xs sm:text-sm">
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            Add Item
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          {
            label: "Total Categories",
            value: totalCategories.toString(),
            icon: Box,
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
          },
          {
            label: "Low Stock Alerts",
            value: lowStockCount.toString(),
            icon: AlertTriangle,
            color: "text-rose-400",
            bg: "bg-rose-500/10",
          },
          {
            label: "Library Collection",
            value:
              libraryCollection > 1000
                ? (libraryCollection / 1000).toFixed(1) + "K"
                : libraryCollection.toString(),
            icon: BookOpen,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Procured (Month)",
            value: "KES 0", // Would be computed from actual procurement data
            icon: ArrowDownLeft,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className="glass p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-white/5 space-y-4"
          >
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${kpi.bg} flex items-center justify-center ${kpi.color}`}
            >
              <kpi.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-black text-primary-200/30 uppercase tracking-widest mb-1">
                {kpi.label}
              </p>
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tighter">
                {kpi.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="glass p-3 sm:p-4 rounded-[24px] sm:rounded-[28px] border border-white/5 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[280px] sm:min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-primary-200/20" />
          <input
            type="text"
            placeholder="Search items by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-2.5 sm:py-3 pl-10 sm:pl-12 pr-4 text-white focus:ring-2 focus:ring-primary-500/20 transition-all outline-none text-sm"
          />
        </div>
        <div className="flex gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-white/5 rounded-2xl border border-white/5">
          {["All", "Stationery", "Library", "Lab"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-primary-500 text-white shadow-premium" : "text-primary-200/40 hover:text-white"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table */}
      <div className="glass rounded-[32px] sm:rounded-[40px] border border-white/5 overflow-hidden relative">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/[0.02]">
              <TableHead>Resource Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-center">Health</TableHead>
              <TableHead className="text-right">Restock</TableHead>
              <TableHead className="text-center">Ops</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={4} cols={6} />
            ) : filteredStock.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-primary-200/40 font-bold uppercase tracking-widest text-xs"
                >
                  No inventory items found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStock.map((item) => (
                <TableRow key={item.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/5 flex items-center justify-center text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-all">
                        {item.category === "LIBRARY" ? (
                          <BookOpen size={16} className="sm:w-5 sm:h-5" />
                        ) : (
                          <Pencil size={16} className="sm:w-5 sm:h-5" />
                        )}
                      </div>
                      <span className="text-white font-bold text-xs sm:text-sm">
                        {item.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-primary-200/30 font-black text-[9px] sm:text-xs uppercase tracking-widest">
                      {item.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-base sm:text-lg font-black text-white">
                      {item.quantity.toLocaleString()} {item.unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {item.quantity < item.min_threshold ? (
                        <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                          <AlertTriangle size={10} className="sm:w-3 sm:h-3" />
                          Low
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg">
                          Optimal
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-[10px] sm:text-xs text-primary-200/40 font-bold whitespace-nowrap">
                      {item.last_restock}
                    </span>
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
