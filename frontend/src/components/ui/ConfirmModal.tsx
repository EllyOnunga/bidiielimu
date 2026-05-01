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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="max-w-md bg-slate-900 border-white/10"
    >
      <div className="space-y-6 pt-4">
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
          <div className={`p-2 rounded-lg ${variant === 'destructive' ? 'bg-rose-500/20 text-rose-500' : 'bg-primary-500/20 text-primary-500'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            className={`flex-1 ${variant === 'destructive' ? 'bg-rose-600 hover:bg-rose-500' : ''}`}
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
