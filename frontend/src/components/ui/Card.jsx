import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

export function Card({ className, children, animate = true, ...props }) {
  const Comp = animate ? motion.div : "div";
  const motionProps = animate
    ? { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }
    : {};
  return (
    <Comp className={cn("card p-5", className)} {...motionProps} {...props}>
      {children}
    </Comp>
  );
}

export function GlassCard({ className, children, ...props }) {
  return (
    <div className={cn("glass-panel rounded-xl p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn("mb-4 flex items-center justify-between", className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={cn("text-base font-semibold", className)}>{children}</h3>;
}
