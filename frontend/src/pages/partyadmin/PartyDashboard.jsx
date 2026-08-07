import { Link } from "react-router-dom";
import { LayoutDashboard, UserCheck, Clock, ShieldCheck, HeartHandshake, Landmark, Shield, TrendingUp } from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { useGetPartyOverviewQuery } from "../../app/api/partyAnalyticsApi";
import { usePartyAuth } from "../../hooks/usePartyAuth";
import { MEMBER_STATUS_LABELS, VOLUNTEER_STATUS_LABELS } from "../../lib/utils";

export default function PartyDashboard() {
  const { partyAdminType } = usePartyAuth();
  const isSuperAdmin = partyAdminType === "PARTY_SUPER_ADMIN";
  const { data, isLoading } = useGetPartyOverviewQuery();
  const stats = data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><LayoutDashboard className="h-6 w-6 text-primary" /> Dashboard</h1>
        <p className="text-sm text-[rgb(var(--fg-muted))]">Xisbiga Barwaaqo overview{!isSuperAdmin ? " for your jurisdiction" : ""}</p>
      </div>

      {isLoading ? (
        <SkeletonCard />
      ) : !stats ? null : (
        <>
          <div className={`grid grid-cols-2 gap-4 ${isSuperAdmin ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
            <StatCard label="Total Members" value={stats.members.total} icon={UserCheck} accent="primary" />
            <StatCard label="Pending Applications" value={stats.members.statusBreakdown.PENDING} icon={Clock} accent="amber" />
            <StatCard label="Full Members" value={stats.members.statusBreakdown.FULL} icon={ShieldCheck} accent="emerald" />
            {isSuperAdmin && <StatCard label="Party Admins" value={stats.partyAdminCount} icon={Shield} accent="indigo" />}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Members by Status</CardTitle></CardHeader>
              <div className="space-y-3">
                {Object.entries(stats.members.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between rounded-lg bg-[rgb(var(--bg-alt))] px-4 py-3">
                    <span className="text-sm font-medium">{MEMBER_STATUS_LABELS[status] || status}</span>
                    <span className="text-lg font-bold text-primary">{count}</span>
                  </div>
                ))}
              </div>
              <Link to="/barwaaqo/app/members/analytics" className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <TrendingUp className="h-4 w-4" /> View detailed member reports
              </Link>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-primary" /> Volunteers</CardTitle>
                </CardHeader>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Object.entries(stats.volunteers.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="rounded-lg bg-[rgb(var(--bg-alt))] px-3 py-2.5 text-center">
                      <p className="text-lg font-bold">{count}</p>
                      <p className="text-xs text-[rgb(var(--fg-muted))]">{VOLUNTEER_STATUS_LABELS[status] || status}</p>
                    </div>
                  ))}
                </div>
                <Link to="/barwaaqo/app/volunteers" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                  Manage volunteers
                </Link>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Landmark className="h-4 w-4 text-primary" /> Donations</CardTitle>
                </CardHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-[rgb(var(--bg-alt))] px-4 py-3">
                    <p className="text-xs text-[rgb(var(--fg-muted))]">Confirmed</p>
                    <p className="text-lg font-bold text-emerald-400">{stats.donations.confirmedCount}</p>
                  </div>
                  <div className="rounded-lg bg-[rgb(var(--bg-alt))] px-4 py-3">
                    <p className="text-xs text-[rgb(var(--fg-muted))]">Confirmed Total</p>
                    <p className="text-lg font-bold text-emerald-400">{stats.donations.confirmedAmount}</p>
                  </div>
                </div>
                <Link to="/barwaaqo/app/donations" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                  Manage donations
                </Link>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
