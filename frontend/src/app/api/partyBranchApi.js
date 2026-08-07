import { partyBaseApi } from "./partyBaseApi";

// Party-branch CRUD for the Xisbiga Barwaaqo portal (PartyAdmin-authenticated writes). Reads hit
// the same public GET the registration form uses, but are re-declared here (rather than reused
// from hierarchyApi/baseApi) so creates/updates/deletes correctly invalidate this list's cache.
export const partyBranchApi = partyBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPartyBranches: builder.query({
      query: () => "/party-branches",
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((b) => ({ type: "PartyBranch", id: b.id })), { type: "PartyBranch", id: "LIST" }]
          : [{ type: "PartyBranch", id: "LIST" }],
    }),
    createPartyBranch: builder.mutation({
      query: (body) => ({ url: "/party-branches", method: "POST", body }),
      invalidatesTags: [{ type: "PartyBranch", id: "LIST" }],
    }),
    updatePartyBranch: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/party-branches/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => [{ type: "PartyBranch", id }, { type: "PartyBranch", id: "LIST" }],
    }),
    deletePartyBranch: builder.mutation({
      query: (id) => ({ url: `/party-branches/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "PartyBranch", id: "LIST" }],
    }),
  }),
});

export const {
  useGetPartyBranchesQuery,
  useCreatePartyBranchMutation,
  useUpdatePartyBranchMutation,
  useDeletePartyBranchMutation,
} = partyBranchApi;
