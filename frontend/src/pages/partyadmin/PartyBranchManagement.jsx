import { Flag } from "lucide-react";
import HierarchyManager from "../admin/HierarchyManager";
import { useGetPartyBranchesQuery, useCreatePartyBranchMutation, useUpdatePartyBranchMutation, useDeletePartyBranchMutation } from "../../app/api/partyBranchApi";

export default function PartyBranchManagement() {
  return (
    <HierarchyManager
      title="Party Branches"
      description="Manage Xisbiga Barwaaqo's own branch/office locations, separate from the government hierarchy"
      icon={Flag}
      useListQuery={useGetPartyBranchesQuery}
      useCreateMutation={useCreatePartyBranchMutation}
      useUpdateMutation={useUpdatePartyBranchMutation}
      useDeleteMutation={useDeletePartyBranchMutation}
      columns={[
        { key: "members", label: "Members", render: (b) => b._count?.members ?? 0 },
      ]}
    />
  );
}
