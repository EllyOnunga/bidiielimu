import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-sm text-primary transition-all duration-300",
          "placeholder:text-muted/50",
          "focus:border-primary-500/50 focus:bg-white/[0.08] focus:ring-4 focus:ring-primary-500/10 focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-40",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
