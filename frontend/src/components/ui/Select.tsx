import * as React from "react";
import { cn } from "../../lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="text-xs font-black uppercase tracking-wider text-muted ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "flex h-12 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-3 text-sm text-[var(--text-color)] transition-all duration-300 outline-none cursor-pointer appearance-none",
              "focus:border-primary-500/50 focus:bg-white/[0.08] focus:ring-4 focus:ring-primary-500/10",
              "disabled:cursor-not-allowed disabled:opacity-40",
              error
                ? "border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/10"
                : "",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          {/* Custom Chevron Indicator */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && (
          <p className="text-xs font-semibold text-rose-400 ml-1">{error}</p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
