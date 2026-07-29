import { Link } from "react-router-dom";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from "recharts";
import {
  Clock, Activity, Hourglass, CheckCircle2, ArrowLeftRight, XCircle, AlertTriangle, FilePlus, ClipboardList,
  MapPin, Landmark, Building2, UserRound, Ticket,
} from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { SkeletonCard } from "../../components/ui/Skeleton";
import Button from "../../components/ui/Button";
import { useGetDashboardAnalyticsQuery } from "../../app/api/analyticsApi";
import { useAuth } from "../../hooks/useAuth";
import { formatDateTime } from "../../lib/utils";

/**
 * The org-context chips shown per admin tier — driven entirely by adminType, since that's what
 * decides which relation (zone/district/townAdministration/office) is actually populated on the
 * actor. District Admins get their parent Zone alongside their District; the rest pair their own
 * organization with the administrator's name.
 */
function orgContextItems(actor) {
  if (!actor || actor.type !== "ADMIN") return [];
  switch (actor.adminType) {
    case "DISTRICT_ADMIN":
      return [
        { icon: MapPin, label: "District", value: actor.district?.name },
        { icon: Landmark, label: "Zone", value: actor.district?.zone?.name },
      ];
    case "ZONE_ADMIN":
      return [
        { icon: Landmark, label: "Zone", value: actor.zone?.name },
        { icon: UserRound, label: "Administrator", value: actor.fullName },
      ];
    case "OFFICE_ADMIN":
      return [
        { icon: Building2, label: "Office", value: actor.office?.name },
        { icon: UserRound, label: "Administrator", value: actor.fullName },
      ];
    case "TOWN_ADMIN":
      return [
        { icon: Building2, label: "Council", value: actor.townAdministration?.name },
        { icon: UserRound, label: "Administrator", value: actor.fullName },
      ];
    default:
      return [];
  }
}

function OrgContextBar({ actor }) {
  const items = orgContextItems(actor).filter((i) => i.value);
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg-alt))] px-3 py-1.5 text-sm">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-[rgb(var(--fg-muted))]">{label}:</span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * A citizen's complaint-submission "tokens": 3 per rolling 30 days, at least 10 days apart.
 * Mirrors exactly what the backend enforces (assertSubmissionAllowed) — this is read-only display.
 */
function TokenStatusCard({ tokens }) {
  if (!tokens) return null;
  const dots = Array.from({ length: tokens.limit }, (_, i) => i < tokens.used);
  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Ticket className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">Complaint Tokens</p>
          <p className="text-xs text-[rgb(var(--fg-muted))]">
            {Math.min(tokens.used, tokens.limit)} of {tokens.limit} used this month
            {!tokens.canSubmitNow && tokens.nextEligibleAt && <> · next available {formatDateTime(tokens.nextEligibleAt)}</>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {dots.map((filled, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full ${filled ? "bg-primary" : "border-2 border-[rgb(var(--fg-muted))]/40"}`}
            aria-hidden="true"
          />
        ))}
        <span className="ml-1 text-xs font-medium text-[rgb(var(--fg-muted))]">{tokens.remaining} remaining</span>
      </div>
    </Card>
  );
}

const BUCKETS = [
  { key: "pending", label: "Pending", icon: Clock, accent: "sky" },
  { key: "inProgress", label: "In Progress", icon: Activity, accent: "primary" },
  { key: "waiting", label: "Waiting", icon: Hourglass, accent: "amber" },
  { key: "solved", label: "Solved", icon: CheckCircle2, accent: "emerald" },
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

      <OrgContextBar actor={actor} />
      {isUser && <TokenStatusCard tokens={stats.tokens} />}

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
