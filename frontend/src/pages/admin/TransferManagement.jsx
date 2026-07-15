import { Link } from "react-router-dom";
import { ArrowLeftRight } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Table, THead, TH, TBody, TR, TD, EmptyState } from "../../components/ui/Table";
import { SkeletonTable } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/ui/Badge";
import { useGetComplaintsQuery } from "../../app/api/complaintsApi";
import { formatDateTime } from "../../lib/utils";

export default function TransferManagement() {
  const { data, isLoading } = useGetComplaintsQuery({ status: "TRANSFERRED", pageSize: 30 });
  const complaints = data?.data ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><ArrowLeftRight className="h-6 w-6 text-primary" /> Transfer Management</h1>
        <p className="text-sm text-[rgb(var(--fg-muted))]">Complaints transferred between offices, districts, or zones. Open a complaint to view its full transfer trail or initiate a new transfer.</p>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="p-5"><SkeletonTable /></div>
        ) : complaints.length === 0 ? (
          <EmptyState message="No transferred complaints" icon={ArrowLeftRight} />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Tracking ID</TH>
                <TH>Title</TH>
                <TH>Current Office</TH>
                <TH>Status</TH>
                <TH>Last Updated</TH>
                <TH></TH>
              </tr>
            </THead>
            <TBody>
              {complaints.map((c) => (
                <TR key={c.id}>
                  <TD className="font-mono text-xs">{c.trackingId}</TD>
                  <TD className="max-w-xs truncate font-medium">{c.title}</TD>
                  <TD>{c.office?.name || "—"}</TD>
                  <TD><StatusBadge status={c.status} /></TD>
                  <TD className="text-[rgb(var(--fg-muted))]">{formatDateTime(c.updatedAt)}</TD>
                  <TD><Link to={`/app/complaints/${c.id}`} className="text-sm font-medium text-primary hover:underline">View</Link></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
