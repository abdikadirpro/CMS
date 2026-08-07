import { Link, Outlet } from "react-router-dom";
import { motion } from "framer-motion";

export default function PartyAuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent-sky/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-panel relative z-10 w-full max-w-md rounded-2xl p-8 text-slate-100"
      >
        <Link to="/membership" className="mb-6 flex items-center justify-center gap-2 text-xl font-bold">
          <img src="/barwaaqo-logo.jpeg" alt="Xisbiga Barwaaqo" className="h-14 w-14 rounded-full object-cover" />
        </Link>
        <Outlet />
      </motion.div>
    </div>
  );
}
