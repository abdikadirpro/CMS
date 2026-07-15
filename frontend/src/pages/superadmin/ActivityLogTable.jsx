import { useState } from "react";
import { Search } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Table, THead, TH, TBody, TR, TD, EmptyState } from "../../components/ui/Table";
import { SkeletonTable } from "../../components/ui/Skeleton";
import { Badge } from "../../components/ui/Badge";
import { Pagination } from "../../components/ui/Pagination";
import { useGetActivityLogsQuery } from "../../app/api/adminApi";
import { formatDateTime } from "../../lib/utils";

export default function ActivityLogTable({ title, description, icon: Icon, actionFilter }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetActivityLogsQuery({ action: actionFilter || search || undefined, page, pageSize: 25 });
  const logs = data?.data ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">{Icon && <Icon className="h-6 w-6 text-primary" />} {title}</h1>
        <p className="text-sm text-[rgb(var(--fg-muted))]">{description}</p>
      </div>

      {!actionFilter && (
        <Card className="mb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input placeholder="Filter by action (e.g. COMPLAINT, ADMIN, LOGIN)..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </Card>
      )}

      <Card className="p-0">
        {isLoading ? (
          <div className="p-5"><SkeletonTable /></div>
        ) : logs.length === 0 ? (
          <EmptyState message="No activity recorded yet" icon={Icon} />
        ) : (
          <Table>
            <THead>
              <tr><TH>Action</TH><TH>Actor</TH><TH>Target</TH><TH>IP</TH><TH>Timestamp</TH></tr>
            </THead>
            <TBody>
              {logs.map((log) => (
                <TR key={log.id}>
                  <TD><Badge variant="primary">{log.action}</Badge></TD>
                  <TD>{log.actorName || "System"} <span className="text-[rgb(var(--fg-muted))]">({log.actorType})</span></TD>
                  <TD className="text-[rgb(var(--fg-muted))]">{log.targetType || "—"}</TD>
                  <TD className="text-[rgb(var(--fg-muted))]">{log.ipAddress || "—"}</TD>
                  <TD className="text-[rgb(var(--fg-muted))]">{formatDateTime(log.createdAt)}</TD>
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
