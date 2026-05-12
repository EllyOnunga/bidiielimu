import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, ...props }, ref) => {
    const variants = {
      default: "bg-primary-600 text-white hover:bg-primary-500 shadow-premium active:scale-95",
      destructive: "bg-rose-500 text-white hover:bg-rose-400 shadow-lg active:scale-95",
      outline: "border border-white/10 bg-white/5 hover:bg-white/10 text-primary hover:text-primary active:scale-95",
      secondary: "bg-accent-600 text-white hover:bg-accent-500 shadow-md active:scale-95",
      ghost: "hover:bg-white/5 text-muted hover:text-primary active:scale-95",
      link: "text-primary-400 underline-offset-4 hover:underline active:opacity-70",
    };

    const sizes = {
      default: "h-11 px-6 py-2 rounded-2xl",
      sm: "h-9 px-4 rounded-xl text-xs",
      lg: "h-14 px-8 rounded-[20px] text-base",
      icon: "h-11 w-11 rounded-2xl",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold tracking-tight transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-widest",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="opacity-70">Processing...</span>
          </div>
        ) : children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
