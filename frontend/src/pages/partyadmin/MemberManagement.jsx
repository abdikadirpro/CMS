import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Search, UserCheck, Pencil, Trash2, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "../../components/ui/Card";
import { Input, Select, Textarea, Label, FieldError } from "../../components/ui/Input";
import { Table, THead, TH, TBody, TR, TD, EmptyState } from "../../components/ui/Table";
import { SkeletonTable } from "../../components/ui/Skeleton";
import { Badge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog, ConfirmDialogSubject, ConfirmDialogWarning } from "../../components/ui/ConfirmDialog";
import { TypeAvatar } from "../../components/ui/TypeAvatar";
import Button from "../../components/ui/Button";
import { useGetMembersQuery, useApproveMemberMutation, useFinalizeMemberMutation, useRejectMemberMutation, useUpdateMemberMutation, useDeleteMemberMutation } from "../../app/api/partyMemberApi";
import { useGetPartyBranchesQuery } from "../../app/api/partyBranchApi";
import { useGetZonesQuery, useGetDistrictsQuery, useGetTownAdministrationsQuery, useGetOfficesQuery } from "../../app/api/hierarchyApi";
import { usePartyAuth } from "../../hooks/usePartyAuth";
import { formatDate, MEMBER_STATUS_LABELS, MEMBER_STATUS_VARIANT } from "../../lib/utils";

const STATUS_AVATAR_CLASS = {
  PENDING: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  PROBATIONARY: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  FULL: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  REJECTED: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

function LocationCell({ member }) {
  return member.zone?.name || member.district?.name || member.townAdministration?.name || member.office?.name || "—";
}

function memberLocationType(member) {
  if (member.districtId) return "district";
  if (member.zoneId) return "zone";
  if (member.townAdministrationId) return "town";
  if (member.officeId) return "office";
  return "district";
}

function buildMemberDefaults(member) {
  return {
    fullName: member.fullName,
    phone: member.phone,
    email: member.email || "",
    idNumber: member.idNumber,
    status: member.status,
    partyBranchId: member.partyBranchId || "",
    locationType: memberLocationType(member),
    districtId: member.districtId || "",
    zoneOnlyId: member.zoneId && !member.districtId ? member.zoneId : "",
    // A district-type member only stores districtId, not zoneId — the Zone <select> that drives
    // the District <select>'s options has to be derived from district.zoneId instead, or the
    // District field renders empty and silently drops the district on save.
    zoneId: member.districtId ? member.district?.zoneId || "" : member.zoneId || "",
    townAdministrationId: member.townAdministrationId || "",
    officeId: member.officeId || "",
  };
}

function EditMemberModal({ member, onClose }) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: buildMemberDefaults(member),
  });
  const [updateMember, { isLoading }] = useUpdateMemberMutation();
  const { data: zonesRes } = useGetZonesQuery();
  const { data: districtsRes } = useGetDistrictsQuery();
  const { data: townsRes } = useGetTownAdministrationsQuery();
  const { data: officesRes } = useGetOfficesQuery();
  const { data: branchesRes } = useGetPartyBranchesQuery();

  // The Zone/District/Town/Office/Branch <option>s populate asynchronously from these queries —
  // if they arrive after react-hook-form's initial mount, the pre-filled id has no matching
  // <option> yet and silently falls back to the placeholder. Re-apply defaults once loaded so the
  // select actually finds and selects the real option.
  useEffect(() => {
    if (zonesRes && districtsRes && townsRes && officesRes && branchesRes) {
      reset(buildMemberDefaults(member));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonesRes, districtsRes, townsRes, officesRes, branchesRes]);

  const locationType = watch("locationType");
  const selectedZoneId = watch("zoneId");
  const districtsInZone = (districtsRes?.data ?? []).filter((d) => d.zoneId === selectedZoneId);

  async function onSubmit(values) {
    const payload = {
      id: member.id,
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      idNumber: values.idNumber,
      status: values.status,
      partyBranchId: values.partyBranchId,
      zoneId: "",
      districtId: "",
      townAdministrationId: "",
      officeId: "",
    };
    if (values.locationType === "district") payload.districtId = values.districtId;
    else if (values.locationType === "zone") payload.zoneId = values.zoneOnlyId;
    else if (values.locationType === "town") payload.townAdministrationId = values.townAdministrationId;
    else if (values.locationType === "office") payload.officeId = values.officeId;

    try {
      await updateMember(payload).unwrap();
      toast.success("Member updated");
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update member");
    }
  }

  return (
    <Modal open onClose={onClose} title="Edit Member" className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Full Name</Label>
            <Input {...register("fullName", { required: "Full name is required" })} />
            <FieldError>{errors.fullName?.message}</FieldError>
          </div>
          <div>
            <Label>Phone</Label>
            <Input {...register("phone", { required: "Phone is required" })} />
            <FieldError>{errors.phone?.message}</FieldError>
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" {...register("email")} />
          </div>
          <div>
            <Label>National ID</Label>
            <Input {...register("idNumber", { required: "National ID is required" })} />
            <FieldError>{errors.idNumber?.message}</FieldError>
          </div>
          <div>
            <Label>Status</Label>
            <Select {...register("status")}>
              <option value="PENDING">Applicant</option>
              <option value="PROBATIONARY">Probationary Member</option>
              <option value="FULL">Full Member</option>
              <option value="REJECTED">Rejected</option>
            </Select>
          </div>
          <div>
            <Label>Party Branch</Label>
            <Select {...register("partyBranchId")}>
              <option value="">No specific branch</option>
              {branchesRes?.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
        </div>

        <div>
          <Label>Location</Label>
          <div className="mb-3 flex flex-wrap gap-4 text-sm">
            {[
              ["district", "District"],
              ["zone", "Zone (general)"],
              ["town", "Town Administration"],
              ["office", "Office (regional level)"],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  value={value}
                  checked={locationType === value}
                  onChange={() => setValue("locationType", value)}
                  className="h-4 w-4 accent-primary"
                />
                {label}
              </label>
            ))}
          </div>

          {locationType === "district" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Zone</Label>
                <Select {...register("zoneId")} onChange={(e) => { setValue("zoneId", e.target.value); setValue("districtId", ""); }}>
                  <option value="">Select zone</option>
                  {zonesRes?.data?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>District</Label>
                <Select {...register("districtId")} disabled={!selectedZoneId}>
                  <option value="">{selectedZoneId ? "Select district" : "Select a zone first"}</option>
                  {districtsInZone.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </div>
            </div>
          )}

          {locationType === "zone" && (
            <Select {...register("zoneOnlyId")}>
              <option value="">Select zone</option>
              {zonesRes?.data?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </Select>
          )}

          {locationType === "town" && (
            <Select {...register("townAdministrationId")}>
              <option value="">Select town administration</option>
              {townsRes?.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          )}

          {locationType === "office" && (
            <Select {...register("officeId")}>
              <option value="">Select office</option>
              {officesRes?.data?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isLoading}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function MemberManagement() {
  const { partyAdminType } = usePartyAuth();
  const isSuperAdmin = partyAdminType === "PARTY_SUPER_ADMIN";
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useGetMembersQuery({ status: status || undefined, search: search || undefined, page, pageSize: 15 });
  const [approveMember, { isLoading: isApproving }] = useApproveMemberMutation();
  const [finalizeMember, { isLoading: isFinalizing }] = useFinalizeMemberMutation();
  const [rejectMember, { isLoading: isRejecting }] = useRejectMemberMutation();
  const [deleteMember, { isLoading: isDeleting }] = useDeleteMemberMutation();
  const members = data?.data ?? [];

  async function handleApprove(id) {
    try {
      await approveMember(id).unwrap();
      toast.success("Application approved — member is now in probation");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to approve application");
    }
  }

  async function handleFinalize(id) {
    try {
      await finalizeMember(id).unwrap();
      toast.success("Member confirmed as a full member");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to confirm full membership");
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      await rejectMember({ id: rejectTarget.id, reason: rejectReason }).unwrap();
      toast.success("Member registration rejected");
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to reject member");
    }
  }

  async function handleDelete() {
    try {
      await deleteMember(deleteTarget.id).unwrap();
      toast.success("Member deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete member");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><UserCheck className="h-6 w-6 text-primary" /> Party Members</h1>
          <p className="text-sm text-[rgb(var(--fg-muted))]">Xisbiga Barwaaqo membership registrations</p>
        </div>
        <Link to="/barwaaqo/app/members/analytics" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <TrendingUp className="h-4 w-4" /> View member reports
        </Link>
      </div>

      <Card className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input placeholder="Search by name, membership #, or ID number..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sm:w-56">
            <option value="">All Statuses</option>
            <option value="PENDING">Applicant</option>
            <option value="PROBATIONARY">Probationary Member</option>
            <option value="FULL">Full Member</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        </div>
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="p-5"><SkeletonTable /></div>
        ) : members.length === 0 ? (
          <EmptyState message="No members found" icon={UserCheck} />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Membership #</TH>
                <TH>Name</TH>
                <TH>Phone</TH>
                <TH>Location</TH>
                <TH>Party Branch</TH>
                <TH>Status</TH>
                <TH>Registered</TH>
                <TH>Eligible</TH>
                <TH></TH>
              </tr>
            </THead>
            <TBody>
              {members.map((m) => {
                const eligible = new Date(m.eligibleAt) <= new Date();
                const canApproveNow = eligible || isSuperAdmin;
                return (
                  <TR key={m.id}>
                    <TD className="font-mono text-xs">{m.membershipNumber}</TD>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <TypeAvatar name={m.fullName} style={{ className: STATUS_AVATAR_CLASS[m.status] || STATUS_AVATAR_CLASS.PENDING }} />
                        <span className="font-medium">{m.fullName}</span>
                      </div>
                    </TD>
                    <TD>{m.phone}</TD>
                    <TD><LocationCell member={m} /></TD>
                    <TD>{m.partyBranch?.name || "—"}</TD>
                    <TD><Badge variant={MEMBER_STATUS_VARIANT[m.status]}>{MEMBER_STATUS_LABELS[m.status]}</Badge></TD>
                    <TD className="text-[rgb(var(--fg-muted))]">{formatDate(m.createdAt)}</TD>
                    <TD className="text-[rgb(var(--fg-muted))]">{formatDate(m.eligibleAt)}</TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        {m.status === "PENDING" && (
                          <>
                            <Button size="sm" loading={isApproving} onClick={() => handleApprove(m.id)}>
                              Approve Application
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setRejectTarget(m)}>Reject</Button>
                          </>
                        )}
                        {m.status === "PROBATIONARY" && (
                          <Button
                            size="sm"
                            disabled={!canApproveNow}
                            loading={isFinalizing}
                            title={eligible ? undefined : isSuperAdmin ? "Party Super Admin override — confirming before eligibility date" : `Eligible on ${formatDate(m.eligibleAt)}`}
                            onClick={() => handleFinalize(m.id)}
                          >
                            Confirm Full Membership
                          </Button>
                        )}
                        {isSuperAdmin && (
                          <>
                            <button onClick={() => setEditTarget(m)} className="rounded-lg p-1.5 hover:bg-[rgb(var(--bg-alt))]" title="Edit member">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(m)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10" title="Delete member">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
        <div className="px-5 pb-4">
          <Pagination page={data?.meta?.page || 1} totalPages={data?.meta?.totalPages || 1} onChange={setPage} />
        </div>
      </Card>

      <Modal open={Boolean(rejectTarget)} onClose={() => { setRejectTarget(null); setRejectReason(""); }} title="Reject Member Registration">
        <p className="mb-3 text-sm text-[rgb(var(--fg-muted))]">Rejecting {rejectTarget?.fullName}&apos;s registration ({rejectTarget?.membershipNumber}).</p>
        <Label>Reason</Label>
        <Textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain why this registration is being rejected..." />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>Cancel</Button>
          <Button variant="danger" loading={isRejecting} onClick={handleReject}>Reject</Button>
        </div>
      </Modal>

      {editTarget && <EditMemberModal member={editTarget} onClose={() => setEditTarget(null)} />}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Membership"
        confirmLabel="Delete Membership"
      >
        <ConfirmDialogSubject name={deleteTarget?.fullName} badge={deleteTarget?.membershipNumber} />
        <ConfirmDialogWarning>
          This action cannot be undone. All membership records tied to this person will be permanently removed.
        </ConfirmDialogWarning>
      </ConfirmDialog>
    </div>
  );
}
