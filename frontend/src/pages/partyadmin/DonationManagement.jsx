import { useState } from "react";
import { Search, Landmark, Trash2, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Input";
import { Table, THead, TH, TBody, TR, TD, EmptyState } from "../../components/ui/Table";
import { SkeletonTable } from "../../components/ui/Skeleton";
import { Pagination } from "../../components/ui/Pagination";
import { ConfirmDialog, ConfirmDialogSubject, ConfirmDialogWarning } from "../../components/ui/ConfirmDialog";
import { TypeAvatar } from "../../components/ui/TypeAvatar";
import { useGetDonationsQuery, useUpdateDonationMutation, useDeleteDonationMutation } from "../../app/api/partyDonationApi";
import { usePartyAuth } from "../../hooks/usePartyAuth";
import { formatDate, DONATION_STATUS_LABELS } from "../../lib/utils";

const DONATION_STATUSES = ["PENDING", "CONFIRMED"];
const DONOR_AVATAR_STYLE = { className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };

function LocationCell({ donation }) {
  return donation.zone?.name || donation.district?.name || donation.townAdministration?.name || donation.office?.name || "—";
}

export default function DonationManagement() {
  const { partyAdminType } = usePartyAuth();
  const isSuperAdmin = partyAdminType === "PARTY_SUPER_ADMIN";
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useGetDonationsQuery({ status: status || undefined, search: search || undefined, page, pageSize: 15 });
  const [updateDonation] = useUpdateDonationMutation();
  const [deleteDonation, { isLoading: deleting }] = useDeleteDonationMutation();
  const donations = data?.data ?? [];

  async function handleStatusChange(donation, newStatus) {
    try {
      await updateDonation({ id: donation.id, status: newStatus }).unwrap();
      toast.success("Donation status updated");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update status");
    }
  }

  async function handleDelete() {
    try {
      await deleteDonation(deleteTarget.id).unwrap();
      toast.success("Donation deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete donation");
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Landmark className="h-6 w-6 text-primary" /> Donations</h1>
        <p className="text-sm text-[rgb(var(--fg-muted))]">Xisbiga Barwaaqo donation submissions — confirm once payment is verified</p>
      </div>

      <Card className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input placeholder="Search by name, phone, or email..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sm:w-56">
            <option value="">All Statuses</option>
            {DONATION_STATUSES.map((s) => <option key={s} value={s}>{DONATION_STATUS_LABELS[s]}</option>)}
          </Select>
        </div>
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="p-5"><SkeletonTable /></div>
        ) : donations.length === 0 ? (
          <EmptyState message="No donations found" icon={Landmark} />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Donor</TH>
                <TH>Phone</TH>
                <TH>Amount</TH>
                <TH>Receipt</TH>
                <TH>Location</TH>
                <TH>Status</TH>
                <TH>Submitted</TH>
                <TH></TH>
              </tr>
            </THead>
            <TBody>
              {donations.map((d) => (
                <TR key={d.id}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <TypeAvatar name={d.donorName} style={DONOR_AVATAR_STYLE} />
                      <span className="font-medium">{d.donorName}</span>
                    </div>
                  </TD>
                  <TD>{d.phone}</TD>
                  <TD>{d.amount}</TD>
                  <TD>
                    {d.receiptUrl ? (
                      <a href={d.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <FileText className="h-4 w-4" /> View
                      </a>
                    ) : "—"}
                  </TD>
                  <TD><LocationCell donation={d} /></TD>
                  <TD>
                    <Select
                      value={d.status}
                      onChange={(e) => handleStatusChange(d, e.target.value)}
                      className="w-auto py-1 text-xs"
                    >
                      {DONATION_STATUSES.map((s) => <option key={s} value={s}>{DONATION_STATUS_LABELS[s]}</option>)}
                    </Select>
                  </TD>
                  <TD className="text-[rgb(var(--fg-muted))]">{formatDate(d.createdAt)}</TD>
                  <TD>
                    {isSuperAdmin && (
                      <button onClick={() => setDeleteTarget(d)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10" title="Delete donation">
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
        title="Delete Donation Record"
      >
        <ConfirmDialogSubject label="You're about to permanently delete the donation record from" name={deleteTarget?.donorName} />
        <ConfirmDialogWarning />
      </ConfirmDialog>
    </div>
  );
}
