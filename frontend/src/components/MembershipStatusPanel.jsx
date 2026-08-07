import { XCircle, Check, Clock, FileClock } from "lucide-react";
import { formatDate } from "../lib/utils";

function daysBetween(from, to) {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)));
}

/** Shared status visualization for a Member — used by both the public tracker and the member's
 * own dashboard. Applicant -> Probationary Member -> Full Member, with Rejected as a terminal
 * state off that path (mirrors TrackComplaintPublic.jsx's REJECTED handling). */
export default function MembershipStatusPanel({ member }) {
  if (member.status === "REJECTED") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
        <XCircle className="h-6 w-6 shrink-0 text-rose-400" />
        <div>
          <p className="text-sm font-semibold text-rose-400">Application Rejected</p>
          {member.rejectionReason && <p className="mt-0.5 text-xs text-[rgb(var(--fg-muted))]">{member.rejectionReason}</p>}
        </div>
      </div>
    );
  }

  if (member.status === "FULL") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
        <Check className="h-6 w-6 shrink-0 text-emerald-400" />
        <div>
          <p className="text-sm font-semibold text-emerald-400">Full Member</p>
          <p className="text-xs text-[rgb(var(--fg-muted))]">Your membership has been confirmed.</p>
        </div>
      </div>
    );
  }

  if (member.status === "PROBATIONARY") {
    const total = daysBetween(member.probationStartedAt, member.eligibleAt) || 1;
    const elapsed = daysBetween(member.probationStartedAt, new Date());
    const progressPct = Math.min(100, Math.round((elapsed / total) * 100));
    const remainingDays = Math.max(0, daysBetween(new Date(), member.eligibleAt));

    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Probationary Member</p>
            <p className="text-xs text-[rgb(var(--fg-muted))]">
              {remainingDays > 0 ? `${remainingDays} day(s) remaining in your 6-month probation period` : "Probation period complete — awaiting final approval"}
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/20">
          <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-[rgb(var(--fg-muted))]">
          <span>Started {formatDate(member.probationStartedAt)}</span>
          <span>Eligible {formatDate(member.eligibleAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-500/30 bg-slate-500/10 px-4 py-3">
      <FileClock className="h-6 w-6 shrink-0 text-slate-400" />
      <div>
        <p className="text-sm font-semibold text-slate-300">Applicant — Application Under Review</p>
        <p className="text-xs text-[rgb(var(--fg-muted))]">A party administrator will review your application soon.</p>
      </div>
    </div>
  );
}
