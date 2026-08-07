import { forwardRef, useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "./Input";
import { cn } from "../../lib/utils";

/** Password field with a left lock icon and a right show/hide toggle — drop-in for a plain <Input type="password">. */
export const PasswordInput = forwardRef(function PasswordInput({ className, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <Input ref={ref} type={visible ? "text" : "password"} className={cn("pl-9 pr-10", className)} {...props} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[rgb(var(--fg))]"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
