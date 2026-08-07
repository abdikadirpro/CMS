import { partyBaseApi } from "./partyBaseApi";

// Authenticated member endpoints for the Xisbiga Barwaaqo portal — uses the PartyAdmin bearer
// token (partyBaseApi), not the complaint-admin one. The public registerMember mutation stays on
// the original memberApi/baseApi since it's unauthenticated (the public registration form).
export const partyMemberApi = partyBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMembers: builder.query({
      query: (params) => ({ url: "/members", params }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((m) => ({ type: "Member", id: m.id })), { type: "Member", id: "LIST" }]
          : [{ type: "Member", id: "LIST" }],
    }),
    getMemberById: builder.query({
      query: (id) => `/members/${id}`,
      providesTags: (result, error, id) => [{ type: "Member", id }],
    }),
    approveMember: builder.mutation({
      query: (id) => ({ url: `/members/${id}/approve`, method: "POST" }),
      invalidatesTags: (result, error, id) => [{ type: "Member", id }, { type: "Member", id: "LIST" }],
    }),
    finalizeMember: builder.mutation({
      query: (id) => ({ url: `/members/${id}/finalize`, method: "POST" }),
      invalidatesTags: (result, error, id) => [{ type: "Member", id }, { type: "Member", id: "LIST" }],
    }),
    rejectMember: builder.mutation({
      query: ({ id, reason }) => ({ url: `/members/${id}/reject`, method: "POST", body: { reason } }),
      invalidatesTags: (result, error, { id }) => [{ type: "Member", id }, { type: "Member", id: "LIST" }],
    }),
    updateMember: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/members/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => [{ type: "Member", id }, { type: "Member", id: "LIST" }],
    }),
    deleteMember: builder.mutation({
      query: (id) => ({ url: `/members/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Member", id: "LIST" }],
    }),
    getMemberAnalytics: builder.query({
      query: () => "/analytics/members",
    }),
  }),
});

export const {
  useGetMembersQuery,
  useGetMemberByIdQuery,
  useApproveMemberMutation,
  useFinalizeMemberMutation,
  useRejectMemberMutation,
  useUpdateMemberMutation,
  useDeleteMemberMutation,
  useGetMemberAnalyticsQuery,
} = partyMemberApi;
