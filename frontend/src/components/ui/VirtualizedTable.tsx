import React, { useMemo, useState } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

interface VirtualizedTableProps<T> {
  data: T[];
  columns: {
    key: keyof T | string;
    header: string;
    width: number;
    render?: (item: T) => React.ReactNode;
  }[];
  rowHeight?: number;
  height?: number;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function VirtualizedTable<T extends Record<string, any>>({
  data,
  columns,
  rowHeight = 50,
  height = 400,
  onRowClick,
  className = "",
}: VirtualizedTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const item = sortedData[index];
    if (!item) return null;

    return (
      <div
        style={style}
        className={`flex border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
          onRowClick ? "cursor-pointer" : ""
        }`}
        onClick={() => onRowClick?.(item)}
      >
        {columns.map((column, colIndex) => {
          const value = column.render
            ? column.render(item)
            : item[column.key as keyof T];
          return (
            <div
              key={colIndex}
              className="px-4 py-2 truncate text-sm text-primary flex items-center"
              style={{ width: column.width }}
            >
              {value}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`glass rounded-2xl border border-white/5 overflow-hidden w-full ${className}`}
    >
      <div className="overflow-x-auto custom-scrollbar w-full">
        <div
          style={{ minWidth: columns.reduce((acc, col) => acc + col.width, 0) }}
        >
          {/* Header */}
          <div className="flex bg-white/5 border-b border-white/5">
            {columns.map((column, index) => (
              <div
                key={index}
                className="px-4 py-3 font-black text-muted text-[10px] uppercase tracking-[0.2em] cursor-pointer hover:bg-white/5 select-none transition-colors"
                style={{ width: column.width }}
                onClick={() => handleSort(column.key as string)}
              >
                <div className="flex items-center justify-between">
                  <span>{column.header}</span>
                  {sortConfig?.key === column.key && (
                    <span className="ml-1 text-primary-400">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Virtualized Body */}
          <div style={{ height, width: "100%" }}>
            <AutoSizer>
              {({ width }: { width: number }) => (
                <List
                  height={height - 40} // Subtract header height
                  itemCount={sortedData.length}
                  itemSize={rowHeight}
                  width={width}
                >
                  {Row}
                </List>
              )}
            </AutoSizer>
          </div>
        </div>
      </div>

      {/* Footer with row count */}
      <div className="bg-white/5 px-4 py-3 text-xs font-bold text-muted border-t border-white/5 flex items-center justify-between">
        <div>
          {sortedData.length} of {data.length} rows
        </div>
        {sortConfig && (
          <div className="uppercase tracking-widest text-[10px]">
            Sorted by <span className="text-primary-400">{sortConfig.key}</span>{" "}
            ({sortConfig.direction})
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for lazy loading data with virtualization
// eslint-disable-next-line react-refresh/only-export-components
export function useVirtualizedData<T>(
  fetchData: (
    offset: number,
    limit: number,
  ) => Promise<{ data: T[]; total: number }>,
  pageSize: number = 50,
) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadedRanges, setLoadedRanges] = useState<Set<string>>(new Set());

  const loadRange = async (start: number, end: number) => {
    const rangeKey = `${start}-${end}`;
    if (loadedRanges.has(rangeKey)) return;

    setLoading(true);
    try {
      const result = await fetchData(start, end - start + 1);
      setData((prev) => {
        const newData = [...prev];
        for (let i = start; i <= end && i < result.data.length; i++) {
          newData[i] = result.data[i - start];
        }
        return newData;
      });
      setTotal(result.total);
      setLoadedRanges((prev) => new Set([...prev, rangeKey]));
    } catch (error) {
      console.error("Failed to load data range:", error);
    } finally {
      setLoading(false);
    }
  };

  const onItemsRendered = ({ visibleStartIndex, visibleStopIndex }: any) => {
    // Load data for visible range + buffer
    const buffer = pageSize;
    const start = Math.max(0, visibleStartIndex - buffer);
    const end = Math.min(total - 1, visibleStopIndex + buffer);

    if (end >= start) {
      loadRange(start, end);
    }
  };

  return {
    data,
    total,
    loading,
    onItemsRendered,
  };
}
