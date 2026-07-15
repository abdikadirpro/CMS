import { cn } from "../../lib/utils";

export function Table({ className, children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[rgb(var(--border))]">
      <table className={cn("w-full text-sm", className)}>{children}</table>
    </div>
  );
}

export function THead({ children }) {
  return <thead className="bg-[rgb(var(--bg-alt))] text-left text-xs uppercase tracking-wide text-[rgb(var(--fg-muted))]">{children}</thead>;
}

export function TH({ className, children }) {
  return <th className={cn("px-4 py-3 font-medium", className)}>{children}</th>;
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-[rgb(var(--border))]">{children}</tbody>;
}

export function TR({ className, children, ...props }) {
  return (
    <tr className={cn("transition-colors hover:bg-[rgb(var(--bg-alt))]/60", className)} {...props}>
      {children}
    </tr>
  );
}

export function TD({ className, children }) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>;
}

export function EmptyState({ message = "No records found", icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-[rgb(var(--fg-muted))]">
      {Icon && <Icon className="h-10 w-10 opacity-40" />}
      <p className="text-sm">{message}</p>
    </div>
  );
}
