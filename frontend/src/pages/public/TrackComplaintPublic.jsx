import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { Search, FileSearch } from "lucide-react";
import { Input, FieldError } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/Badge";
import { useLazyTrackComplaintQuery } from "../../app/api/complaintsApi";
import { formatDateTime } from "../../lib/utils";

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
