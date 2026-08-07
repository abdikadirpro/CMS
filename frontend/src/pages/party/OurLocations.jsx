import { MapPin, Building2, Landmark, Flag } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { SkeletonCard } from "../../components/ui/Skeleton";
import AboutSubnav from "../../components/AboutSubnav";
import { useGetZonesQuery, useGetDistrictsQuery, useGetTownAdministrationsQuery, useGetPartyBranchsQuery } from "../../app/api/hierarchyApi";

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-[rgb(var(--fg-muted))]">{label}</p>
      </div>
    </Card>
  );
}

export default function OurLocations() {
  const { data: zonesRes, isLoading: zonesLoading } = useGetZonesQuery();
  const { data: districtsRes } = useGetDistrictsQuery();
  const { data: townsRes } = useGetTownAdministrationsQuery();
  const { data: branchesRes } = useGetPartyBranchsQuery();

  const zones = zonesRes?.data ?? [];
  const districts = districtsRes?.data ?? [];
  const towns = townsRes?.data ?? [];
  const branches = branchesRes?.data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold">Our Locations</h1>
        <p className="mt-3 text-[rgb(var(--fg-muted))]">
          Xisbiga Barwaaqo Laantiisa DDS is organized across every zone, district, and town administration in the region.
        </p>
      </div>

      <div className="mt-8">
        <AboutSubnav />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={MapPin} label="Zones" value={zones.length} />
        <StatCard icon={Building2} label="Districts" value={districts.length} />
        <StatCard icon={Landmark} label="Town Admins" value={towns.length} />
      </div>

      <div className="mt-12">
        <h2 className="mb-5 text-xl font-bold">Zones &amp; Districts</h2>
        {zonesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><SkeletonCard /><SkeletonCard /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {zones.map((zone) => {
              const zoneDistricts = districts.filter((d) => d.zoneId === zone.id);
              return (
                <Card key={zone.id}>
                  <div className="mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    <h3 className="font-semibold">{zone.name}</h3>
                  </div>
                  {zoneDistricts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {zoneDistricts.map((d) => (
                        <span key={d.id} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          {d.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[rgb(var(--fg-muted))]">No districts listed yet.</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {towns.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-5 text-xl font-bold">Town Administrations</h2>
          <div className="flex flex-wrap gap-2">
            {towns.map((t) => (
              <span key={t.id} className="flex items-center gap-1.5 rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-sm">
                <Landmark className="h-3.5 w-3.5 text-primary" /> {t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {branches.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-5 text-xl font-bold">Party Branches</h2>
          <div className="flex flex-wrap gap-2">
            {branches.map((b) => (
              <span key={b.id} className="flex items-center gap-1.5 rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-sm">
                <Flag className="h-3.5 w-3.5 text-primary" /> {b.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
