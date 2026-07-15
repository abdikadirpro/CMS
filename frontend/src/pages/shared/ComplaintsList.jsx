import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ClipboardList } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Input";
import { Table, THead, TH, TBody, TR, TD, EmptyState } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/Badge";
import { SkeletonTable } from "../../components/ui/Skeleton";
import { Pagination } from "../../components/ui/Pagination";
import { useGetComplaintsQuery } from "../../app/api/complaintsApi";
import { useAuth } from "../../hooks/useAuth";
import { formatDate } from "../../lib/utils";

const STATUSES = ["PENDING", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "WAITING", "SOLVED", "CLOSED", "TRANSFERRED", "REJECTED", "ESCALATED"];

export default function ComplaintsList() {
  const { isAdmin } = useAuth();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetComplaintsQuery({ status: status || undefined, search: search || undefined, page, pageSize: 15 });
  const complaints = data?.data ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">{isAdmin ? "Complaint Management" : "My Complaints"}</h1>
          <p className="text-sm text-[rgb(var(--fg-muted))]">{isAdmin ? "Complaints within your jurisdiction" : "Track the status of complaints you've submitted"}</p>
        </div>
      </div>

      <Card className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input placeholder="Search by title or tracking ID..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sm:w-56">
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </Select>
        </div>
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="p-5"><SkeletonTable /></div>
        ) : complaints.length === 0 ? (
          <EmptyState message="No complaints found" icon={ClipboardList} />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Tracking ID</TH>
                <TH>Title</TH>
                <TH>Category</TH>
                <TH>Status</TH>
                <TH>Submitted</TH>
                <TH></TH>
              </tr>
            </THead>
            <TBody>
              {complaints.map((c) => (
                <TR key={c.id}>
                  <TD className="font-mono text-xs">{c.trackingId}</TD>
                  <TD className="max-w-xs truncate font-medium">{c.title}</TD>
                  <TD>{c.category?.name || "—"}</TD>
                  <TD><StatusBadge status={c.status} /></TD>
                  <TD className="text-[rgb(var(--fg-muted))]">{formatDate(c.createdAt)}</TD>
                  <TD>
                    <Link to={`/app/complaints/${c.id}`} className="text-sm font-medium text-primary hover:underline">View</Link>
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
    </div>
  );
}
