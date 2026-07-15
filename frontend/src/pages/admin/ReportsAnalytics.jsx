import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Table, THead, TH, TBody, TR, TD } from "../../components/ui/Table";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { useGetDashboardAnalyticsQuery } from "../../app/api/analyticsApi";
import { formatStatusLabel } from "../../lib/utils";

export default function ReportsAnalytics() {
  const { data, isLoading } = useGetDashboardAnalyticsQuery();

  if (isLoading) return <SkeletonCard />;
  const stats = data?.data;
  if (!stats) return null;

  const statusRows = Object.entries(stats.statusBreakdown).map(([status, count]) => ({ status, count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><BarChart3 className="h-6 w-6 text-primary" /> Reports & Analytics</h1>
        <p className="text-sm text-[rgb(var(--fg-muted))]">Detailed breakdown of complaint volume by status and category within your jurisdiction.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Complaints by Category</CardTitle></CardHeader>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.categoryBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }} />
            <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-0">
        <div className="p-5"><CardTitle>Status Summary</CardTitle></div>
        <Table>
          <THead>
            <tr><TH>Status</TH><TH>Count</TH><TH>Share</TH></tr>
          </THead>
          <TBody>
            {statusRows.map((row) => (
              <TR key={row.status}>
                <TD>{formatStatusLabel(row.status)}</TD>
                <TD className="font-semibold">{row.count}</TD>
                <TD>{stats.total > 0 ? `${((row.count / stats.total) * 100).toFixed(1)}%` : "0%"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
