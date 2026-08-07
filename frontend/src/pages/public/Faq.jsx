import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

const FAQS = [
  { q: "How do I submit a complaint?", a: "Register for a free account, then use the 'Submit Complaint' page to describe your issue, choose a category, and optionally attach supporting files. You can also submit anonymously." },
  { q: "Can I submit a complaint anonymously?", a: "Yes. Toggle 'Anonymous Submission' on the complaint form. Anonymous complaints can still be tracked using the tracking ID, but won't be linked to a personal account." },
  { q: "How do I track my complaint?", a: "Use the tracking ID you received at submission on the 'Track Complaint' page, or view your full history from your dashboard if you're logged in." },
  { q: "What do the different statuses mean?", a: "Complaints move through Pending, Under Review, Assigned, In Progress, Waiting, Solved, Closed, Transferred, Rejected, or Escalated as admins work on them." },
  { q: "Who handles my complaint?", a: "Complaints are routed to the appropriate office, district, town administration, or zone admin based on where and what you reported. Admins can transfer complaints between jurisdictions if needed." },
  { q: "Is my data secure?", a: "Yes. All accounts are protected with hashed passwords and JWT-based authentication, and admin access is restricted by role to only the data within their jurisdiction." },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
      <p className="mt-2 text-[rgb(var(--fg-muted))]">Everything you need to know about using the Complaint Management System.</p>

      <div className="mt-8 space-y-3">
        {FAQS.map((item, i) => (
          <div
            key={item.q}
            className={cn(
              "card overflow-hidden transition-all duration-300 ease-out hover:border-primary/40 hover:shadow-md",
              openIndex === i && "border-primary/40 shadow-md"
            )}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left font-medium"
            >
              {item.q}
              <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform", openIndex === i && "rotate-180 text-primary")} />
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-sm text-[rgb(var(--fg-muted))]">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
