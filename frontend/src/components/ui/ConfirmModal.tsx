import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "primary";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
      <div className="space-y-6">
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-primary-500/5 border border-primary-500/10">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${variant === "destructive" ? "bg-rose-500/20 text-rose-500" : "bg-primary-500/20 text-primary-500"}`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-muted leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 order-2 sm:order-1"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            className={`flex-1 order-1 sm:order-2 ${variant === "destructive" ? "bg-rose-600 hover:bg-rose-500 shadow-rose-500/20" : ""}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
