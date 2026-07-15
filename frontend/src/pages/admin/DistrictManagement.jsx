import { MapPin } from "lucide-react";
import HierarchyManager from "./HierarchyManager";
import { useGetDistrictsQuery, useCreateDistrictMutation, useUpdateDistrictMutation, useDeleteDistrictMutation, useGetZonesQuery } from "../../app/api/hierarchyApi";

export default function DistrictManagement() {
  const { data: zonesRes } = useGetZonesQuery();
  const zoneOptions = (zonesRes?.data ?? []).map((z) => ({ value: z.id, label: z.name }));

  return (
    <HierarchyManager
      title="District Management"
      description="Manage the 95 districts and which zone each belongs to"
      icon={MapPin}
      useListQuery={useGetDistrictsQuery}
      useCreateMutation={useCreateDistrictMutation}
      useUpdateMutation={useUpdateDistrictMutation}
      useDeleteMutation={useDeleteDistrictMutation}
      fields={[{ name: "zoneId", label: "Zone", type: "select", required: "Zone is required", options: zoneOptions }]}
      columns={[
        { key: "zone", label: "Zone", render: (d) => d.zone?.name ?? "—" },
        { key: "admins", label: "Admins", render: (d) => d._count?.admins ?? 0 },
        { key: "complaints", label: "Complaints", render: (d) => d._count?.complaints ?? 0 },
      ]}
    />
  );
}
