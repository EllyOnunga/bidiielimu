import * as React from "react";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  description,
  className,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4">
      <div
        className={cn(
          "glass w-full max-w-lg rounded-t-[28px] rounded-b-none sm:rounded-[32px] p-5 sm:p-6 md:p-8 relative animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto custom-scrollbar",
          className,
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 sm:right-6 sm:top-6 p-2 rounded-xl text-muted hover:text-primary hover:bg-white/5 transition-all active:scale-95 z-10"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>

        {(title || description) && (
          <div className="flex flex-col space-y-1 text-left mb-5 sm:mb-6 pr-10">
            {title && (
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-primary tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs sm:text-sm font-medium text-muted mt-1">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="text-primary">{children}</div>
      </div>
    </div>
  );
}
