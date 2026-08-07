import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { TrendingUp, Users, UserCheck, Clock, UserX } from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Table, THead, TH, TBody, TR, TD } from "../../components/ui/Table";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { useGetMemberAnalyticsQuery } from "../../app/api/partyMemberApi";

const CHART_TOOLTIP_STYLE = { background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" };

export default function MemberAnalytics() {
  const { data, isLoading } = useGetMemberAnalyticsQuery();
  const stats = data?.data;

  if (isLoading) return <SkeletonCard />;
  if (!stats) return null;

  const statusRows = [
    { status: "Pending", count: stats.statusBreakdown.PENDING },
    { status: "Full Member", count: stats.statusBreakdown.FULL },
    { status: "Rejected", count: stats.statusBreakdown.REJECTED },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><TrendingUp className="h-6 w-6 text-primary" /> Party Member Reports</h1>
        <p className="text-sm text-[rgb(var(--fg-muted))]">Xisbiga Barwaaqo membership breakdown</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Members" value={stats.total} icon={Users} accent="primary" />
        <StatCard label="Pending" value={stats.statusBreakdown.PENDING} icon={Clock} accent="amber" />
        <StatCard label="Full Members" value={stats.statusBreakdown.FULL} icon={UserCheck} accent="emerald" />
        <StatCard label="Rejected" value={stats.statusBreakdown.REJECTED} icon={UserX} accent="rose" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Members by Party Branch</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.branchBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="branch" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader><CardTitle>Members by Zone</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.zoneBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="zone" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-0">
        <div className="p-5"><CardTitle>Status Summary</CardTitle></div>
        <Table>
          <THead>
            <tr><TH>Status</TH><TH>Count</TH><TH>Share</TH></tr>
          </THead>
          <TBody>
            {statusRows.map((row) => (
              <TR key={row.status}>
                <TD>{row.status}</TD>
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
