import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[rgb(var(--bg-alt))] transition-colors disabled:opacity-50 disabled:pointer-events-none",
  danger: "inline-flex items-center justify-center gap-2 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 px-4 py-2.5 font-semibold hover:bg-red-500/25 transition-colors disabled:opacity-50 disabled:pointer-events-none",
};

const SIZES = {
  sm: "text-xs px-3 py-1.5",
  md: "",
  lg: "text-base px-6 py-3",
};

const Button = forwardRef(function Button(
  { className, variant = "primary", size = "md", loading = false, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(VARIANTS[variant], SIZES[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

export default Button;
