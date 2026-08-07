import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  ArrowLeft, Paperclip, MessageSquarePlus, ArrowLeftRight, UserCheck, ArrowUpCircle,
  FileText, Image as ImageIcon, User, Mail, Phone, BadgeCheck, Building2, Briefcase, Hash,
  MapPin, Clock, Loader2, Hourglass, CheckCircle2, XCircle, ShieldQuestion,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { StatusBadge, Badge } from "../../components/ui/Badge";
import { Select, Textarea, Label } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { SkeletonCard } from "../../components/ui/Skeleton";
import {
  useGetComplaintByIdQuery, useUpdateComplaintStatusMutation,
  useTransferComplaintMutation, useEscalateComplaintMutation, useSubmitSatisfactionMutation, useAddComplaintNoteMutation,
} from "../../app/api/complaintsApi";
import { useGetAdminDirectoryQuery } from "../../app/api/adminApi";
import { useAuth } from "../../hooks/useAuth";
import { formatDateTime } from "../../lib/utils";

const STATUSES = ["PENDING", "IN_PROGRESS", "WAITING", "SOLVED", "REJECTED", "TRANSFERRED", "ESCALATED"];

const ESCALATION_LEVEL_LABELS = { ZONE_ADMIN: "Zone", SUPER_ADMIN: "Regional level (Super Admin)" };
const SATISFACTION_REJECTION_THRESHOLD = 3;

const STATUS_TIMELINE_STYLE = {
  PENDING: { icon: Clock, className: "bg-slate-500/15 text-slate-400" },
  IN_PROGRESS: { icon: Loader2, className: "bg-primary/15 text-primary" },
  WAITING: { icon: Hourglass, className: "bg-amber-500/15 text-amber-400" },
  SOLVED: { icon: CheckCircle2, className: "bg-emerald-500/15 text-emerald-400" },
  TRANSFERRED: { icon: ArrowLeftRight, className: "bg-indigo-500/15 text-indigo-400" },
  REJECTED: { icon: XCircle, className: "bg-rose-500/15 text-rose-400" },
  ESCALATED: { icon: ArrowUpCircle, className: "bg-red-500/15 text-red-400" },
};

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|bmp)$/i;

function apiUrl(path) {
  return `${import.meta.env.VITE_API_URL || ""}${path}`;
}

/** Mirrors the backend's isValidTransferTarget (jurisdiction.service.js) so the transfer dropdown only offers valid targets. */
function isValidTransferTarget(complaint, admin) {
  if (admin.adminType === "SUPER_ADMIN") return true;
  if (complaint.districtId) {
    if (admin.districtId === complaint.districtId) return true;
    if (admin.adminType === "ZONE_ADMIN" && admin.zoneId === complaint.zoneId) return true;
    return false;
  }
  if (complaint.zoneId) return admin.zoneId === complaint.zoneId;
  if (complaint.townAdministrationId) return admin.townAdministrationId === complaint.townAdministrationId;
  if (complaint.officeId) return admin.officeId === complaint.officeId;
  return true;
}

function InfoField({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 rounded-lg bg-[rgb(var(--bg-alt))] p-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-[rgb(var(--fg-muted))]">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const { isAdmin, actor } = useAuth();
  const { data, isLoading } = useGetComplaintByIdQuery(id);
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateComplaintStatusMutation();
  const [transferComplaint, { isLoading: transferring }] = useTransferComplaintMutation();
  const [escalateComplaint, { isLoading: escalating }] = useEscalateComplaintMutation();
  const [submitSatisfaction, { isLoading: submittingSatisfaction }] = useSubmitSatisfactionMutation();
  const [addNote, { isLoading: addingNote }] = useAddComplaintNoteMutation();
  const { data: directoryRes } = useGetAdminDirectoryQuery(undefined, { skip: !isAdmin });

  const [transferOpen, setTransferOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [dissatisfiedOpen, setDissatisfiedOpen] = useState(false);
  const { register: registerNote, handleSubmit: handleNoteSubmit, reset: resetNote } = useForm();
  const { register: registerTransfer, handleSubmit: handleTransferSubmit, reset: resetTransfer } = useForm();
  const { register: registerEscalate, handleSubmit: handleEscalateSubmit, reset: resetEscalate } = useForm();
  const { register: registerDissatisfied, handleSubmit: handleDissatisfiedSubmit, reset: resetDissatisfied } = useForm();

  if (isLoading) return <SkeletonCard />;
  const complaint = data?.data;
  if (!complaint) return <p>Complaint not found.</p>;

  const isOwner = !isAdmin && actor && complaint.submitterId === actor.id;
  const escalation = complaint.escalation;
  const validTransferTargets = (directoryRes?.data ?? []).filter((a) => isValidTransferTarget(complaint, a));

  async function onSubmitEscalate(values) {
    try {
      await escalateComplaint({ id, reason: values.reason }).unwrap();
      toast.success("Complaint escalated");
      setEscalateOpen(false);
      resetEscalate();
    } catch (err) {
      toast.error(err?.data?.message || "Escalation failed");
    }
  }

  async function onConfirmSatisfied() {
    try {
      await submitSatisfaction({ id, satisfied: true }).unwrap();
      toast.success("Thanks for confirming");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to submit feedback");
    }
  }

  async function onSubmitDissatisfied(values) {
    try {
      await submitSatisfaction({ id, satisfied: false, reason: values.reason }).unwrap();
      toast.success("Feedback recorded — complaint reopened");
      setDissatisfiedOpen(false);
      resetDissatisfied();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to submit feedback");
    }
  }

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

      <Card className="mb-5 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg-alt))] px-2.5 py-0.5 font-mono text-xs text-[rgb(var(--fg-muted))]">
              <Hash className="h-3 w-3" /> {complaint.trackingId}
            </span>
            <h1 className="mt-2 text-xl font-bold sm:text-2xl">{complaint.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {complaint.category && <Badge variant="primary">{complaint.category.name}</Badge>}
              {complaint.isAnonymous && <Badge variant="warning">Anonymous</Badge>}
              {complaint.office && <Badge>{complaint.office.name}</Badge>}
              {complaint.district && <Badge>{complaint.district.name}{complaint.zone ? ` · ${complaint.zone.name}` : ""}</Badge>}
              {!complaint.district && complaint.zone && <Badge>{complaint.zone.name} (zone-wide)</Badge>}
              {complaint.townAdministration && <Badge>{complaint.townAdministration.name}</Badge>}
            </div>
          </div>
          <StatusBadge status={complaint.status} />
        </div>

        <p className="mt-5 whitespace-pre-wrap rounded-xl bg-[rgb(var(--bg-alt))] p-4 text-sm leading-relaxed text-[rgb(var(--fg-muted))]">
          {complaint.description}
        </p>
        {complaint.location && (
          <p className="mt-3 flex items-center gap-1.5 text-sm">
            <MapPin className="h-4 w-4 text-primary" /> <span className="font-medium">Location:</span> {complaint.location}
          </p>
        )}

        {complaint.attachments?.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <Paperclip className="h-4 w-4" /> Attachments
            </p>
            <div className="flex flex-wrap gap-3">
              {complaint.attachments.map((a) =>
                IMAGE_EXTENSIONS.test(a.fileName) ? (
                  <a
                    key={a.id}
                    href={apiUrl(a.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[rgb(var(--border))]"
                  >
                    <img src={apiUrl(a.url)} alt={a.fileName} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {a.fileName}
                    </span>
                  </a>
                ) : (
                  <a
                    key={a.id}
                    href={apiUrl(a.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] px-3 py-2.5 text-xs transition-colors hover:border-primary/40 hover:bg-[rgb(var(--bg-alt))]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="max-w-[10rem] truncate">{a.fileName}</span>
                  </a>
                )
              )}
            </div>
          </div>
        )}

        <div className="mt-5 border-t border-[rgb(var(--border))] pt-5">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-medium">
            <User className="h-4 w-4" /> Complainant Information
          </p>

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
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <InfoField icon={User} label="Full Name" value={complaint.submitter.fullName} />
              <InfoField icon={Mail} label="Email" value={complaint.submitter.email} />
              <InfoField icon={Phone} label="Phone" value={complaint.submitter.phone} />
              <InfoField icon={BadgeCheck} label="Account Type" value="Registered Citizen" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <InfoField icon={User} label="Full Name" value={complaint.guestFullName} />
              <InfoField icon={Mail} label="Email" value={complaint.guestEmail} />
              <InfoField icon={Phone} label="Phone" value={complaint.guestPhone} />
              <InfoField icon={ShieldQuestion} label="National ID" value={complaint.guestIdNumber} />
              <InfoField icon={Building2} label="Office / Workplace" value={complaint.guestOffice} />
              <InfoField icon={Briefcase} label="Job Position" value={complaint.guestJobTitle} />
              <InfoField icon={Hash} label="Employee ID" value={complaint.guestEmployeeId} />
            </div>
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

      {isOwner && complaint.status === "SOLVED" && (
        <Card className="mb-5">
          <h3 className="mb-2 font-semibold">Are you satisfied with this resolution?</h3>
          <p className="mb-3 text-sm text-[rgb(var(--fg-muted))]">
            Let us know if this actually solved your complaint.
            {complaint.satisfactionRejections > 0 && (
              <> You&apos;ve marked this unsatisfactory {complaint.satisfactionRejections} of {SATISFACTION_REJECTION_THRESHOLD} time(s).</>
            )}
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={onConfirmSatisfied} loading={submittingSatisfaction}>Yes, satisfied</Button>
            <Button size="sm" variant="secondary" onClick={() => setDissatisfiedOpen(true)}>Not satisfied</Button>
          </div>
        </Card>
      )}

      {isOwner && escalation?.nextLevel && (
        <Card className="mb-5">
          <h3 className="mb-2 flex items-center gap-2 font-semibold"><ArrowUpCircle className="h-4 w-4 text-primary" /> Escalation</h3>
          {escalation.canEscalate ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[rgb(var(--fg-muted))]">
                {escalation.dissatisfactionEligible
                  ? `You've rejected this resolution ${SATISFACTION_REJECTION_THRESHOLD}+ times. You can request a transfer to the upper office.`
                  : "It's been 10+ days with no response. You can escalate this complaint."}{" "}
                Next stop: {ESCALATION_LEVEL_LABELS[escalation.nextLevel]}.
              </p>
              <Button size="sm" onClick={() => setEscalateOpen(true)}>
                <ArrowUpCircle className="h-4 w-4" /> Transfer to {ESCALATION_LEVEL_LABELS[escalation.nextLevel]}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-[rgb(var(--fg-muted))]">
              You can escalate this complaint to the {ESCALATION_LEVEL_LABELS[escalation.nextLevel]} if there&apos;s no response by {formatDateTime(escalation.eligibleAt)}.
            </p>
          )}
        </Card>
      )}

      <Card className="mb-5">
        <h3 className="mb-4 font-semibold">Status Timeline</h3>
        <ol className="space-y-5">
          {complaint.statusHistory?.map((h, i) => {
            const style = STATUS_TIMELINE_STYLE[h.toStatus] || STATUS_TIMELINE_STYLE.PENDING;
            const StatusIcon = style.icon;
            const isLast = i === complaint.statusHistory.length - 1;
            return (
              <li key={h.id} className="relative flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.className}`}>
                    <StatusIcon className="h-4 w-4" />
                  </span>
                  {!isLast && <span className="mt-1 w-px flex-1 bg-[rgb(var(--border))]" />}
                </div>
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={h.toStatus} />
                    <span className="text-xs text-[rgb(var(--fg-muted))]">{formatDateTime(h.createdAt)}</span>
                  </div>
                  {h.reason && <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">{h.reason}</p>}
                </div>
              </li>
            );
          })}
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
              <div key={n.id} className="flex gap-3 rounded-xl bg-[rgb(var(--bg-alt))] p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {(n.admin?.fullName || "?").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-sm">{n.content}</p>
                  <p className="mt-1 text-xs text-[rgb(var(--fg-muted))]">{n.admin?.fullName} · {formatDateTime(n.createdAt)}</p>
                </div>
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
              {validTransferTargets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName} ({a.adminType.replace("_", " ")}{a.district ? ` · ${a.district.name}` : a.zone ? ` · ${a.zone.name}` : a.office ? ` · ${a.office.name}` : ""})
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-[rgb(var(--fg-muted))]">
              Only shows admins within this complaint&apos;s own jurisdiction, its parent zone, or the Super Admin — transfers can&apos;t cross into an unrelated zone/district.
            </p>
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

      <Modal open={escalateOpen} onClose={() => setEscalateOpen(false)} title="Transfer to Upper Office">
        <form onSubmit={handleEscalateSubmit(onSubmitEscalate)} className="space-y-4">
          <div>
            <Label>Describe the issue</Label>
            <Textarea
              rows={3}
              placeholder="Explain why this needs to go to the upper office..."
              {...registerEscalate("reason", { required: escalation?.dissatisfactionEligible })}
            />
          </div>
          <Button type="submit" className="w-full" loading={escalating}>
            <ArrowUpCircle className="h-4 w-4" /> Confirm Transfer
          </Button>
        </form>
      </Modal>

      <Modal open={dissatisfiedOpen} onClose={() => setDissatisfiedOpen(false)} title="What's still wrong?">
        <form onSubmit={handleDissatisfiedSubmit(onSubmitDissatisfied)} className="space-y-4">
          <div>
            <Label>Description</Label>
            <Textarea rows={3} placeholder="Tell us why this resolution didn't solve your complaint..." {...registerDissatisfied("reason", { required: true })} />
          </div>
          <Button type="submit" className="w-full" loading={submittingSatisfaction}>Submit</Button>
        </form>
      </Modal>
    </div>
  );
}
