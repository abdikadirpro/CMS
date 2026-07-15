import { useState } from "react";
import { Users, Search } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Table, THead, TH, TBody, TR, TD, EmptyState } from "../../components/ui/Table";
import { SkeletonTable } from "../../components/ui/Skeleton";
import { Badge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { useGetCitizensQuery } from "../../app/api/userApi";
import { formatDate } from "../../lib/utils";

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetCitizensQuery({ search: search || undefined, page, pageSize: 15 });
  const users = data?.data ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Users className="h-6 w-6 text-primary" /> User Management</h1>
        <p className="text-sm text-[rgb(var(--fg-muted))]">Citizens who have filed complaints within your jurisdiction</p>
      </div>

      <Card className="mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="p-5"><SkeletonTable /></div>
        ) : users.length === 0 ? (
          <EmptyState message="No citizen accounts found" icon={Users} />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Name</TH><TH>Email</TH><TH>Phone</TH><TH>Complaints Filed</TH><TH>Status</TH><TH>Joined</TH>
              </tr>
            </THead>
            <TBody>
              {users.map((u) => (
                <TR key={u.id}>
                  <TD className="font-medium">{u.fullName}</TD>
                  <TD>{u.email}</TD>
                  <TD>{u.phone || "—"}</TD>
                  <TD>{u._count?.complaints ?? 0}</TD>
                  <TD><Badge variant={u.isActive ? "success" : "danger"}>{u.isActive ? "Active" : "Deactivated"}</Badge></TD>
                  <TD className="text-[rgb(var(--fg-muted))]">{formatDate(u.createdAt)}</TD>
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
