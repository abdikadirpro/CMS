import { Globe } from "lucide-react";
import HierarchyManager from "./HierarchyManager";
import { useGetZonesQuery, useCreateZoneMutation, useUpdateZoneMutation, useDeleteZoneMutation } from "../../app/api/hierarchyApi";

export default function ZoneManagement() {
  return (
    <HierarchyManager
      title="Zone Management"
      description="Manage the 11 administrative zones and their district counts"
      icon={Globe}
      useListQuery={useGetZonesQuery}
      useCreateMutation={useCreateZoneMutation}
      useUpdateMutation={useUpdateZoneMutation}
      useDeleteMutation={useDeleteZoneMutation}
      columns={[
        { key: "districts", label: "Districts", render: (z) => z._count?.districts ?? 0 },
        { key: "admins", label: "Admins", render: (z) => z._count?.admins ?? 0 },
        { key: "complaints", label: "Complaints", render: (z) => z._count?.complaints ?? 0 },
      ]}
    />
  );
}
