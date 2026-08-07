import { partyBaseApi } from "./partyBaseApi";

// Authenticated volunteer management for the Xisbiga Barwaaqo portal — uses the PartyAdmin
// bearer token (partyBaseApi). The public registerVolunteer mutation stays on volunteerApi/baseApi.
export const partyVolunteerApi = partyBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVolunteers: builder.query({
      query: (params) => ({ url: "/volunteers", params }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((v) => ({ type: "Volunteer", id: v.id })), { type: "Volunteer", id: "LIST" }]
          : [{ type: "Volunteer", id: "LIST" }],
    }),
    updateVolunteer: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/volunteers/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => [{ type: "Volunteer", id }, { type: "Volunteer", id: "LIST" }],
    }),
    deleteVolunteer: builder.mutation({
      query: (id) => ({ url: `/volunteers/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Volunteer", id: "LIST" }],
    }),
  }),
});

export const { useGetVolunteersQuery, useUpdateVolunteerMutation, useDeleteVolunteerMutation } = partyVolunteerApi;
