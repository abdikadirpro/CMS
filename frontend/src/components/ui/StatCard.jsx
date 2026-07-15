import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function StatCard({ label, value, icon: Icon, accent = "primary", className }) {
  const accents = {
    primary: "text-primary bg-primary/10 border-primary/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("card flex items-center gap-4 p-5", className)}
    >
      {Icon && (
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border", accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-[rgb(var(--fg-muted))]">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </div>
    </motion.div>
  );
}
