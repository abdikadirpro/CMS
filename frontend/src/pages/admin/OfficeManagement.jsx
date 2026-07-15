import { Landmark } from "lucide-react";
import HierarchyManager from "./HierarchyManager";
import {
  useGetOfficesQuery, useCreateOfficeMutation, useUpdateOfficeMutation, useDeleteOfficeMutation,
  useGetZonesQuery, useGetDistrictsQuery, useGetTownAdministrationsQuery,
} from "../../app/api/hierarchyApi";

export default function OfficeManagement() {
  const { data: zonesRes } = useGetZonesQuery();
  const { data: districtsRes } = useGetDistrictsQuery();
  const { data: townsRes } = useGetTownAdministrationsQuery();

  return (
    <HierarchyManager
      title="Office Management"
      description="Create and manage dynamic offices/departments that receive complaints"
      icon={Landmark}
      useListQuery={useGetOfficesQuery}
      useCreateMutation={useCreateOfficeMutation}
      useUpdateMutation={useUpdateOfficeMutation}
      useDeleteMutation={useDeleteOfficeMutation}
      fields={[
        { name: "zoneId", label: "Zone (optional)", type: "select", options: (zonesRes?.data ?? []).map((z) => ({ value: z.id, label: z.name })) },
        { name: "districtId", label: "District (optional)", type: "select", options: (districtsRes?.data ?? []).map((d) => ({ value: d.id, label: d.name })) },
        { name: "townAdministrationId", label: "Town Administration (optional)", type: "select", options: (townsRes?.data ?? []).map((t) => ({ value: t.id, label: t.name })) },
      ]}
      columns={[
        { key: "zone", label: "Zone", render: (o) => o.zone?.name ?? "—" },
        { key: "district", label: "District", render: (o) => o.district?.name ?? "—" },
        { key: "admins", label: "Admins", render: (o) => o._count?.admins ?? 0 },
      ]}
    />
  );
}
