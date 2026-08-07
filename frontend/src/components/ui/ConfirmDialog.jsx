import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import Button from "./Button";

/** Styled stand-in for window.confirm() — a centered icon, custom body, and Cancel/Confirm actions. */
export function ConfirmDialog({
  open, onClose, onConfirm, loading,
  title = "Confirm", icon: Icon = AlertTriangle,
  confirmLabel = "Delete", confirmIcon: ConfirmIcon = Trash2,
  children,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-md">
      <div className="flex flex-col items-center text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <Icon className="h-7 w-7" />
        </span>
        {children}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>
          <ConfirmIcon className="h-4 w-4" /> {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function ConfirmDialogSubject({ label = "You're about to permanently delete", name, badge }) {
  return (
    <>
      <p className="text-sm text-[rgb(var(--fg-muted))]">{label}</p>
      <p className="mt-1 text-lg font-semibold">{name}</p>
      {badge && (
        <span className="mt-1.5 inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg-alt))] px-2.5 py-0.5 font-mono text-xs text-[rgb(var(--fg-muted))]">
          {badge}
        </span>
      )}
    </>
  );
}

export function ConfirmDialogWarning({ children = "This action cannot be undone." }) {
  return <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{children}</p>;
}
