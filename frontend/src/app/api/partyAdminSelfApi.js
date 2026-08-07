import { partyBaseApi } from "./partyBaseApi";

// Party-Super-Admin-only self-management of the Xisbiga Barwaaqo admin hierarchy (Zone/District/
// Town/Office, and further Party Super Admins) — uses the party portal's own bearer token
// (partyBaseApi), not the complaint-admin one.
export const partyAdminSelfApi = partyBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPartyAdmins: builder.query({
      query: (params) => ({ url: "/party-admins", params }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((a) => ({ type: "PartyAdmin", id: a.id })), { type: "PartyAdmin", id: "LIST" }]
          : [{ type: "PartyAdmin", id: "LIST" }],
    }),
    createPartyAdmin: builder.mutation({
      query: (body) => ({ url: "/party-admins", method: "POST", body }),
      invalidatesTags: [{ type: "PartyAdmin", id: "LIST" }],
    }),
    updatePartyAdmin: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/party-admins/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => [{ type: "PartyAdmin", id }, { type: "PartyAdmin", id: "LIST" }],
    }),
    resetPartyAdminPassword: builder.mutation({
      query: ({ id, newPassword }) => ({ url: `/party-admins/${id}/password`, method: "PATCH", body: { newPassword } }),
    }),
    deletePartyAdmin: builder.mutation({
      query: (id) => ({ url: `/party-admins/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "PartyAdmin", id: "LIST" }],
    }),
  }),
});

export const {
  useGetPartyAdminsQuery,
  useCreatePartyAdminMutation,
  useUpdatePartyAdminMutation,
  useResetPartyAdminPasswordMutation,
  useDeletePartyAdminMutation,
} = partyAdminSelfApi;
