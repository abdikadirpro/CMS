import { useState } from "react";
import { Search, HeartHandshake, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Input";
import { Table, THead, TH, TBody, TR, TD, EmptyState } from "../../components/ui/Table";
import { SkeletonTable } from "../../components/ui/Skeleton";
import { Pagination } from "../../components/ui/Pagination";
import { ConfirmDialog, ConfirmDialogSubject, ConfirmDialogWarning } from "../../components/ui/ConfirmDialog";
import { TypeAvatar } from "../../components/ui/TypeAvatar";
import { useGetVolunteersQuery, useUpdateVolunteerMutation, useDeleteVolunteerMutation } from "../../app/api/partyVolunteerApi";
import { usePartyAuth } from "../../hooks/usePartyAuth";
import { formatDate, VOLUNTEER_STATUS_LABELS } from "../../lib/utils";

const VOLUNTEER_STATUSES = ["NEW", "CONTACTED", "ACTIVE", "INACTIVE"];
const VOLUNTEER_AVATAR_STYLE = { className: "bg-primary/15 text-primary border-primary/30" };

function LocationCell({ volunteer }) {
  return volunteer.zone?.name || volunteer.district?.name || volunteer.townAdministration?.name || volunteer.office?.name || "—";
}

export default function VolunteerManagement() {
  const { partyAdminType } = usePartyAuth();
  const isSuperAdmin = partyAdminType === "PARTY_SUPER_ADMIN";
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useGetVolunteersQuery({ status: status || undefined, search: search || undefined, page, pageSize: 15 });
  const [updateVolunteer] = useUpdateVolunteerMutation();
  const [deleteVolunteer, { isLoading: deleting }] = useDeleteVolunteerMutation();
  const volunteers = data?.data ?? [];

  async function handleStatusChange(volunteer, newStatus) {
    try {
      await updateVolunteer({ id: volunteer.id, status: newStatus }).unwrap();
      toast.success("Volunteer status updated");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update status");
    }
  }

  async function handleDelete() {
    try {
      await deleteVolunteer(deleteTarget.id).unwrap();
      toast.success("Volunteer deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete volunteer");
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><HeartHandshake className="h-6 w-6 text-primary" /> Volunteers</h1>
        <p className="text-sm text-[rgb(var(--fg-muted))]">Xisbiga Barwaaqo volunteer sign-ups</p>
      </div>

      <Card className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input placeholder="Search by name, phone, or email..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sm:w-56">
            <option value="">All Statuses</option>
            {VOLUNTEER_STATUSES.map((s) => <option key={s} value={s}>{VOLUNTEER_STATUS_LABELS[s]}</option>)}
          </Select>
        </div>
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="p-5"><SkeletonTable /></div>
        ) : volunteers.length === 0 ? (
          <EmptyState message="No volunteers found" icon={HeartHandshake} />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Phone</TH>
                <TH>Interest</TH>
                <TH>Location</TH>
                <TH>Status</TH>
                <TH>Signed Up</TH>
                <TH></TH>
              </tr>
            </THead>
            <TBody>
              {volunteers.map((v) => (
                <TR key={v.id}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <TypeAvatar name={v.fullName} style={VOLUNTEER_AVATAR_STYLE} />
                      <span className="font-medium">{v.fullName}</span>
                    </div>
                  </TD>
                  <TD>{v.phone}</TD>
                  <TD className="max-w-xs truncate text-[rgb(var(--fg-muted))]">{v.interest || "—"}</TD>
                  <TD><LocationCell volunteer={v} /></TD>
                  <TD>
                    <Select
                      value={v.status}
                      onChange={(e) => handleStatusChange(v, e.target.value)}
                      className="w-auto py-1 text-xs"
                    >
                      {VOLUNTEER_STATUSES.map((s) => <option key={s} value={s}>{VOLUNTEER_STATUS_LABELS[s]}</option>)}
                    </Select>
                  </TD>
                  <TD className="text-[rgb(var(--fg-muted))]">{formatDate(v.createdAt)}</TD>
                  <TD>
                    {isSuperAdmin && (
                      <button onClick={() => setDeleteTarget(v)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10" title="Delete volunteer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <div className="px-5 pb-4">
          <Pagination page={data?.meta?.page || 1} totalPages={data?.meta?.totalPages || 1} onChange={setPage} />
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Volunteer"
      >
        <ConfirmDialogSubject name={deleteTarget?.fullName} />
        <ConfirmDialogWarning />
      </ConfirmDialog>
    </div>
  );
}
