import { Link } from "react-router-dom";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from "recharts";
import {
  Clock, Activity, Hourglass, CheckCircle2, Archive, ArrowLeftRight, XCircle, AlertTriangle, FilePlus, ClipboardList,
} from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { SkeletonCard } from "../../components/ui/Skeleton";
import Button from "../../components/ui/Button";
import { useGetDashboardAnalyticsQuery } from "../../app/api/analyticsApi";
import { useAuth } from "../../hooks/useAuth";

const BUCKETS = [
  { key: "pending", label: "Pending", icon: Clock, accent: "sky" },
  { key: "active", label: "Active", icon: Activity, accent: "primary" },
  { key: "waiting", label: "Waiting", icon: Hourglass, accent: "amber" },
  { key: "solved", label: "Solved", icon: CheckCircle2, accent: "emerald" },
  { key: "closed", label: "Closed", icon: Archive, accent: "indigo" },
  { key: "transferred", label: "Transferred", icon: ArrowLeftRight, accent: "sky" },
  { key: "rejected", label: "Rejected", icon: XCircle, accent: "rose" },
  { key: "escalated", label: "Escalated", icon: AlertTriangle, accent: "rose" },
];

const PIE_COLORS = ["#3b82f6", "#06b6d4", "#0ea5e9", "#14b8a6", "#f59e0b", "#10b981", "#6366f1", "#f43f5e", "#94a3b8", "#ef4444"];

export default function Dashboard() {
  const { isUser, actor } = useAuth();
  const { data, isLoading } = useGetDashboardAnalyticsQuery();

  if (isLoading) return <SkeletonCard />;
  const stats = data?.data;
  if (!stats) return null;

  const statusPieData = Object.entries(stats.statusBreakdown)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ name: status.replace("_", " "), value: count }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {actor?.fullName?.split(" ")[0]}</h1>
          <p className="text-sm text-[rgb(var(--fg-muted))]">
            {isUser ? "Here's the status of your complaints" : "Here's what's happening in your jurisdiction"}
          </p>
        </div>
        {isUser && (
          <Link to="/app/submit">
            <Button><FilePlus className="h-4 w-4" /> Submit Complaint</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {BUCKETS.map((b) => (
          <StatCard key={b.key} label={b.label} value={stats.caseBuckets[b.key] ?? 0} icon={b.icon} accent={b.accent} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Status Breakdown</CardTitle></CardHeader>
          {statusPieData.length === 0 ? (
            <p className="py-10 text-center text-sm text-[rgb(var(--fg-muted))]">No complaints yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusPieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {statusPieData.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle>Complaints by Category</CardTitle></CardHeader>
          {stats.categoryBreakdown.length === 0 ? (
            <p className="py-10 text-center text-sm text-[rgb(var(--fg-muted))]">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Complaints — Last 30 Days</CardTitle></CardHeader>
        {stats.trend.length === 0 ? (
          <p className="py-10 text-center text-sm text-[rgb(var(--fg-muted))]">No recent activity</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {!isUser && (
        <div className="flex justify-end">
          <Link to="/app/complaints" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            <ClipboardList className="h-4 w-4" /> View all complaints
          </Link>
        </div>
      )}
    </div>
  );
}
