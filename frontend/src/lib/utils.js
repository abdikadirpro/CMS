import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function formatStatusLabel(status) {
  if (!status) return "";
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export const STATUS_COLORS = {
  PENDING: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  IN_PROGRESS: "bg-primary/15 text-primary border-primary/30",
  WAITING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  SOLVED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  TRANSFERRED: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  REJECTED: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  ESCALATED: "bg-red-500/15 text-red-400 border-red-500/30",
};

export const ADMIN_TYPE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ZONE_ADMIN: "Zone Admin",
  TOWN_ADMIN: "Town Administration Admin",
  DISTRICT_ADMIN: "District Admin",
  OFFICE_ADMIN: "Office Admin",
};
