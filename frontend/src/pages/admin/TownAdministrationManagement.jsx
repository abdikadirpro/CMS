import { Building2 } from "lucide-react";
import HierarchyManager from "./HierarchyManager";
import {
  useGetTownAdministrationsQuery, useCreateTownAdministrationMutation,
  useUpdateTownAdministrationMutation, useDeleteTownAdministrationMutation,
} from "../../app/api/hierarchyApi";

export default function TownAdministrationManagement() {
  return (
    <HierarchyManager
      title="Town Administration Management"
      description="Manage the 6 town administrations"
      icon={Building2}
      useListQuery={useGetTownAdministrationsQuery}
      useCreateMutation={useCreateTownAdministrationMutation}
      useUpdateMutation={useUpdateTownAdministrationMutation}
      useDeleteMutation={useDeleteTownAdministrationMutation}
      columns={[
        { key: "admins", label: "Admins", render: (t) => t._count?.admins ?? 0 },
        { key: "complaints", label: "Complaints", render: (t) => t._count?.complaints ?? 0 },
      ]}
    />
  );
}
