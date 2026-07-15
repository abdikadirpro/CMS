import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { ArrowLeft, Paperclip, MessageSquarePlus, ArrowLeftRight, UserCheck } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { StatusBadge, Badge } from "../../components/ui/Badge";
import { Select, Textarea, Label } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { SkeletonCard } from "../../components/ui/Skeleton";
import {
  useGetComplaintByIdQuery, useUpdateComplaintStatusMutation,
  useTransferComplaintMutation, useAddComplaintNoteMutation,
} from "../../app/api/complaintsApi";
import { useGetAdminDirectoryQuery } from "../../app/api/adminApi";
import { useAuth } from "../../hooks/useAuth";
import { formatDateTime } from "../../lib/utils";

const STATUSES = ["PENDING", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "WAITING", "SOLVED", "CLOSED", "TRANSFERRED", "REJECTED", "ESCALATED"];

function Row({ label, value }) {
  if (!value) return null;
  return (
    <>
      <dt className="text-[rgb(var(--fg-muted))]">{label}</dt>
      <dd className="mb-1 sm:mb-0">{value}</dd>
    </>
  );
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { data, isLoading } = useGetComplaintByIdQuery(id);
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateComplaintStatusMutation();
  const [transferComplaint, { isLoading: transferring }] = useTransferComplaintMutation();
  const [addNote, { isLoading: addingNote }] = useAddComplaintNoteMutation();
  const { data: directoryRes } = useGetAdminDirectoryQuery(undefined, { skip: !isAdmin });

  const [transferOpen, setTransferOpen] = useState(false);
  const { register: registerNote, handleSubmit: handleNoteSubmit, reset: resetNote } = useForm();
  const { register: registerTransfer, handleSubmit: handleTransferSubmit, reset: resetTransfer } = useForm();

  if (isLoading) return <SkeletonCard />;
  const complaint = data?.data;
  if (!complaint) return <p>Complaint not found.</p>;

  async function onStatusChange(e) {
    const status = e.target.value;
    if (!status || status === complaint.status) return;
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success("Status updated");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update status");
    }
  }

  async function onSubmitNote(values) {
    try {
      await addNote({ id, content: values.content }).unwrap();
      resetNote();
      toast.success("Note added");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add note");
    }
  }

  async function onSubmitTransfer(values) {
    try {
      await transferComplaint({ id, toAdminId: values.toAdminId || undefined, toOfficeName: values.toOfficeName, reason: values.reason }).unwrap();
      toast.success("Complaint transferred");
      setTransferOpen(false);
      resetTransfer();
    } catch (err) {
      toast.error(err?.data?.message || "Transfer failed");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/app/complaints" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))]">
        <ArrowLeft className="h-4 w-4" /> Back to complaints
      </Link>

      <Card className="mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-[rgb(var(--fg-muted))]">{complaint.trackingId}</p>
            <h1 className="text-xl font-bold">{complaint.title}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {complaint.category && <Badge>{complaint.category.name}</Badge>}
              {complaint.isAnonymous && <Badge variant="warning">Anonymous</Badge>}
              {complaint.office && <Badge variant="primary">{complaint.office.name}</Badge>}
              {complaint.district && <Badge>{complaint.district.name}{complaint.zone ? ` · ${complaint.zone.name}` : ""}</Badge>}
              {!complaint.district && complaint.zone && <Badge>{complaint.zone.name} (zone-wide)</Badge>}
              {complaint.townAdministration && <Badge>{complaint.townAdministration.name}</Badge>}
            </div>
          </div>
          <StatusBadge status={complaint.status} />
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm text-[rgb(var(--fg-muted))]">{complaint.description}</p>
        {complaint.location && <p className="mt-3 text-sm"><span className="font-medium">Location:</span> {complaint.location}</p>}

        {complaint.attachments?.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Attachments</p>
            <div className="flex flex-wrap gap-2">
              {complaint.attachments.map((a) => (
                <a key={a.id} href={`${import.meta.env.VITE_API_URL || ""}${a.url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-[rgb(var(--border))] px-3 py-1.5 text-xs hover:bg-[rgb(var(--bg-alt))]">
                  <Paperclip className="h-3.5 w-3.5" /> {a.fileName}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 border-t border-[rgb(var(--border))] pt-4 text-sm">
          <p className="mb-2 font-medium">Complainant Information</p>

          {complaint.isAnonymous ? (
            <div>
              <Badge variant="warning">Anonymous submission — identity withheld</Badge>
              {(complaint.guestEmail || complaint.guestPhone) && (
                <p className="mt-2 text-xs text-[rgb(var(--fg-muted))]">
                  Optional contact info left by the reporter (not a verified identity):{" "}
                  {[complaint.guestEmail, complaint.guestPhone].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          ) : complaint.submitter ? (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
              <Row label="Full Name" value={complaint.submitter.fullName} />
              <Row label="Email" value={complaint.submitter.email} />
              <Row label="Phone" value={complaint.submitter.phone} />
              <Row label="Account Type" value="Registered Citizen" />
            </dl>
          ) : (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
              <Row label="Full Name" value={complaint.guestFullName} />
              <Row label="Email" value={complaint.guestEmail} />
              <Row label="Phone" value={complaint.guestPhone} />
              <Row label="ID Number" value={complaint.guestIdNumber} />
              <Row label="Office / Workplace" value={complaint.guestOffice} />
              <Row label="Job Position" value={complaint.guestJobTitle} />
            </dl>
          )}
        </div>
      </Card>

      {isAdmin && (
        <Card className="mb-5">
          <h3 className="mb-4 font-semibold">Admin Actions</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-48">
              <Label>Update Status</Label>
              <Select defaultValue="" onChange={onStatusChange} disabled={updatingStatus}>
                <option value="" disabled>Change status...</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </Select>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setTransferOpen(true)}>
              <ArrowLeftRight className="h-4 w-4" /> Transfer
            </Button>
          </div>
        </Card>
      )}

      <Card className="mb-5">
        <h3 className="mb-4 font-semibold">Status Timeline</h3>
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
      </Card>

      {isAdmin && (
        <Card>
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <MessageSquarePlus className="h-4 w-4" /> Internal Notes
          </h3>
          <form onSubmit={handleNoteSubmit(onSubmitNote)} className="mb-4 flex gap-2">
            <Textarea rows={2} placeholder="Add a note visible to admins only..." {...registerNote("content", { required: true })} />
            <Button type="submit" loading={addingNote}>Add</Button>
          </form>
          <div className="space-y-3">
            {complaint.notes?.length === 0 && <p className="text-sm text-[rgb(var(--fg-muted))]">No notes yet.</p>}
            {complaint.notes?.map((n) => (
              <div key={n.id} className="rounded-lg bg-[rgb(var(--bg-alt))] p-3 text-sm">
                <p>{n.content}</p>
                <p className="mt-1 text-xs text-[rgb(var(--fg-muted))]">{n.admin?.fullName} · {formatDateTime(n.createdAt)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer Complaint">
        <form onSubmit={handleTransferSubmit(onSubmitTransfer)} className="space-y-4">
          <div>
            <Label>Transfer to Admin (optional)</Label>
            <Select {...registerTransfer("toAdminId")}>
              <option value="">— None specified —</option>
              {directoryRes?.data?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName} ({a.adminType.replace("_", " ")}{a.district ? ` · ${a.district.name}` : a.zone ? ` · ${a.zone.name}` : a.office ? ` · ${a.office.name}` : ""})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Or Office Name</Label>
            <input className="input-field" placeholder="Destination office (free text)" {...registerTransfer("toOfficeName")} />
          </div>
          <div>
            <Label>Reason for Transfer</Label>
            <Textarea rows={3} {...registerTransfer("reason", { required: true })} />
          </div>
          <Button type="submit" className="w-full" loading={transferring}>
            <UserCheck className="h-4 w-4" /> Confirm Transfer
          </Button>
        </form>
      </Modal>
    </div>
  );
}
