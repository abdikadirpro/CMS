import { Tag } from "lucide-react";
import HierarchyManager from "./HierarchyManager";
import { useGetCategorysQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } from "../../app/api/hierarchyApi";

export default function CategoryManagement() {
  return (
    <HierarchyManager
      title="Complaint Categories"
      description="Manage the categories citizens choose from when submitting a complaint"
      icon={Tag}
      useListQuery={useGetCategorysQuery}
      useCreateMutation={useCreateCategoryMutation}
      useUpdateMutation={useUpdateCategoryMutation}
      useDeleteMutation={useDeleteCategoryMutation}
      fields={[{ name: "description", label: "Description (optional)" }]}
    />
  );
}
