import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { Search, FileSearch, XCircle, Check } from "lucide-react";
import { Input, FieldError } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/Badge";
import { useLazyTrackComplaintQuery } from "../../app/api/complaintsApi";
import { formatDateTime } from "../../lib/utils";

// The citizen-facing journey has 4 stages. Transferred/Escalated aren't separate stages here —
// the complaint is still actively being handled, just moved administratively — so both read as
// "In Progress" on this simplified tracker. Rejected is a terminal outcome off the main path,
// not a stage the complaint "passes through", so it's shown as its own state instead of a step.
const STAGES = [
  { key: "PENDING", label: "Pending" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "WAITING", label: "Waiting" },
  { key: "SOLVED", label: "Solved" },
];

function stageIndexForStatus(status) {
  if (status === "TRANSFERRED" || status === "ESCALATED") return 1; // In Progress
  const idx = STAGES.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function daysSince(date) {
  const ms = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

function StageTracker({ status, createdAt }) {
  if (status === "REJECTED") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
        <XCircle className="h-6 w-6 shrink-0 text-rose-400" />
        <div>
          <p className="text-sm font-semibold text-rose-400">Complaint Rejected</p>
          <p className="text-xs text-[rgb(var(--fg-muted))]">See the status history below for the reason given.</p>
        </div>
      </div>
    );
  }

  const currentIndex = stageIndexForStatus(status);
  const solved = status === "SOLVED";
  const progressPct = Math.round(((currentIndex + 1) / STAGES.length) * 100);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between text-sm">
        <span className="text-[rgb(var(--fg-muted))]">
          Progress: <span className="font-bold text-[rgb(var(--fg))] underline decoration-primary/40 underline-offset-2">{progressPct}%</span>
        </span>
        <span className="text-[rgb(var(--fg-muted))]">
          Days Open: <span className="font-bold text-[rgb(var(--fg))] underline decoration-primary/40 underline-offset-2">{daysSince(createdAt)}</span>
        </span>
      </div>

      <div className="flex items-start">
        {STAGES.map((stage, i) => {
          const isReached = i <= currentIndex || solved;
          const isLast = i === STAGES.length - 1;
          return (
            <div key={stage.key} className={`flex flex-col items-center ${isLast ? "" : "flex-1"}`}>
              <div className="flex w-full items-center">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isReached
                      ? "border-primary bg-primary text-surface"
                      : "border-[rgb(var(--border))] bg-[rgb(var(--bg-alt))] text-[rgb(var(--fg-muted))]"
                  }`}
                >
                  <Check className="h-5 w-5" strokeWidth={3} />
                </div>
                {!isLast && (
                  <div className={`mx-1 h-1 flex-1 rounded-full ${i < currentIndex || solved ? "bg-primary" : "bg-[rgb(var(--border))]"}`} />
                )}
              </div>
              <span className={`mt-2 text-center text-xs font-semibold ${isReached ? "text-[rgb(var(--fg))]" : "text-[rgb(var(--fg-muted))]"}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TrackComplaintPublic() {
  const [searchParams] = useSearchParams();
  const prefilledId = searchParams.get("id") || "";
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { trackingId: prefilledId } });
  const [trackComplaint, { data, isFetching, isError, error }] = useLazyTrackComplaintQuery();
  const [searched, setSearched] = useState(false);

  function onSubmit(values) {
    setSearched(true);
    trackComplaint(values.trackingId.trim());
  }

  // Coming straight from "Submit Complaint" with ?id=... — look it up immediately
  // instead of leaving the citizen to copy-paste their own tracking ID back in.
  useEffect(() => {
    if (prefilledId) {
      setSearched(true);
      trackComplaint(prefilledId.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledId]);

  const complaint = data?.data;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <FileSearch className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold">Track Your Complaint</h1>
        <p className="mt-2 text-[rgb(var(--fg-muted))]">Enter your tracking ID to see the current status and history.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto mt-8 flex max-w-md gap-2">
        <div className="flex-1">
          <Input placeholder="e.g. CMS-2026-AB12CD34" {...register("trackingId", { required: "Tracking ID is required" })} />
          <FieldError>{errors.trackingId?.message}</FieldError>
        </div>
        <Button type="submit" loading={isFetching}>
          <Search className="h-4 w-4" /> Track
        </Button>
      </form>

      {searched && isError && (
        <p className="mt-6 text-center text-sm text-red-400">{error?.data?.message || "No complaint found with that tracking ID"}</p>
      )}

      {complaint && (
        <Card className="mt-8">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-[rgb(var(--fg-muted))]">{complaint.trackingId}</p>
              <h3 className="text-lg font-semibold">{complaint.title}</h3>
            </div>
            <StatusBadge status={complaint.status} />
          </div>
          <p className="text-sm text-[rgb(var(--fg-muted))]">{complaint.description}</p>

          <div className="mt-6 border-t border-[rgb(var(--border))] pt-6">
            <StageTracker status={complaint.status} createdAt={complaint.createdAt} />
          </div>

          <div className="mt-6">
            <h4 className="mb-3 text-sm font-semibold">Status History</h4>
            <ol className="space-y-3 border-l border-[rgb(var(--border))] pl-4">
              {complaint.statusHistory?.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  <div className="flex items-center gap-2">
                    <StatusBadge status={h.toStatus} />
                    <span className="text-xs text-[rgb(var(--fg-muted))]">{formatDateTime(h.createdAt)}</span>
                  </div>
                  {h.reason && <p className="mt-1 text-xs text-[rgb(var(--fg-muted))]">{h.reason}</p>}
                </li>
              ))}
            </ol>
          </div>
        </Card>
      )}
    </div>
  );
}
