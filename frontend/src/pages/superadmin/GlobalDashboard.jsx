import { Link } from "react-router-dom";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Users, ClipboardList, Shield, Globe, BarChart3, MapPin, Landmark, Building2 } from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { useGetGlobalAnalyticsQuery } from "../../app/api/analyticsApi";
import { ADMIN_TYPE_LABELS } from "../../lib/utils";

export default function GlobalDashboard() {
  const { data, isLoading } = useGetGlobalAnalyticsQuery();
  const stats = data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Globe className="h-6 w-6 text-primary" /> Global Dashboard</h1>
        <p className="text-sm text-[rgb(var(--fg-muted))]">System-wide overview across all zones, districts, and offices</p>
      </div>

      {isLoading ? (
        <SkeletonCard />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Complaints" value={stats.complaintCount} icon={ClipboardList} accent="primary" />
            <StatCard label="Registered Citizens" value={stats.userCount} icon={Users} accent="sky" />
            <StatCard label="Total Admins" value={Object.values(stats.adminCounts).reduce((a, b) => a + b, 0)} icon={Shield} accent="emerald" />
            <StatCard label="Zones" value={stats.zoneCount} icon={Globe} accent="indigo" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Districts" value={stats.districtCount} icon={MapPin} accent="sky" />
            <StatCard label="Town Administrations" value={stats.townAdministrationCount} icon={Landmark} accent="amber" />
            <StatCard label="Offices" value={stats.officeCount} icon={Building2} accent="primary" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Complaints by Zone</CardTitle></CardHeader>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.zoneBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="zone" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }} />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardHeader><CardTitle>Admin Network Breakdown</CardTitle></CardHeader>
              <div className="space-y-3">
                {Object.entries(stats.adminCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between rounded-lg bg-[rgb(var(--bg-alt))] px-4 py-3">
                    <span className="text-sm font-medium">{ADMIN_TYPE_LABELS[type] || type}</span>
                    <span className="text-lg font-bold text-primary">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <Link to="/app/reports" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <BarChart3 className="h-4 w-4" /> View detailed status & category reports
        </Link>
      </div>
    </div>
  );
}
