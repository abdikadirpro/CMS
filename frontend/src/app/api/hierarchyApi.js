import { baseApi } from "./baseApi";

function resourceEndpoints(builder, path, tagType) {
  return {
    [`get${tagType}s`]: builder.query({
      query: () => `/${path}`,
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((i) => ({ type: tagType, id: i.id })), { type: tagType, id: "LIST" }]
          : [{ type: tagType, id: "LIST" }],
    }),
    [`create${tagType}`]: builder.mutation({
      query: (body) => ({ url: `/${path}`, method: "POST", body }),
      invalidatesTags: [{ type: tagType, id: "LIST" }],
    }),
    [`update${tagType}`]: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/${path}/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => [{ type: tagType, id }, { type: tagType, id: "LIST" }],
    }),
    [`delete${tagType}`]: builder.mutation({
      query: (id) => ({ url: `/${path}/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagType, id: "LIST" }],
    }),
  };
}

export const hierarchyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...resourceEndpoints(builder, "zones", "Zone"),
    ...resourceEndpoints(builder, "districts", "District"),
    ...resourceEndpoints(builder, "town-administrations", "TownAdministration"),
    ...resourceEndpoints(builder, "offices", "Office"),
    ...resourceEndpoints(builder, "categories", "Category"),
    ...resourceEndpoints(builder, "party-branches", "PartyBranch"),
  }),
});

export const {
  useGetZonesQuery, useCreateZoneMutation, useUpdateZoneMutation, useDeleteZoneMutation,
  useGetDistrictsQuery, useCreateDistrictMutation, useUpdateDistrictMutation, useDeleteDistrictMutation,
  useGetTownAdministrationsQuery, useCreateTownAdministrationMutation, useUpdateTownAdministrationMutation, useDeleteTownAdministrationMutation,
  useGetOfficesQuery, useCreateOfficeMutation, useUpdateOfficeMutation, useDeleteOfficeMutation,
  useGetCategorysQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation,
  useGetPartyBranchsQuery, useCreatePartyBranchMutation, useUpdatePartyBranchMutation, useDeletePartyBranchMutation,
} = hierarchyApi;
