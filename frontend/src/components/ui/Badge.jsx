import { cn } from "../../lib/utils";
import { STATUS_COLORS, formatStatusLabel } from "../../lib/utils";

export function Badge({ className, children, variant = "default" }) {
  const variants = {
    default: "bg-[rgb(var(--bg-alt))] text-[rgb(var(--fg-muted))] border-[rgb(var(--border))]",
    primary: "bg-primary/15 text-primary border-primary/30",
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    danger: "bg-red-500/15 text-red-400 border-red-500/30",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", STATUS_COLORS[status])}>
      {formatStatusLabel(status)}
    </span>
  );
}
