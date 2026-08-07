import { partyBaseApi } from "./partyBaseApi";

// Authenticated donation management for the Xisbiga Barwaaqo portal — uses the PartyAdmin
// bearer token (partyBaseApi). The public registerDonation mutation stays on donationApi/baseApi.
export const partyDonationApi = partyBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDonations: builder.query({
      query: (params) => ({ url: "/donations", params }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((d) => ({ type: "Donation", id: d.id })), { type: "Donation", id: "LIST" }]
          : [{ type: "Donation", id: "LIST" }],
    }),
    updateDonation: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/donations/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => [{ type: "Donation", id }, { type: "Donation", id: "LIST" }],
    }),
    deleteDonation: builder.mutation({
      query: (id) => ({ url: `/donations/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Donation", id: "LIST" }],
    }),
  }),
});

export const { useGetDonationsQuery, useUpdateDonationMutation, useDeleteDonationMutation } = partyDonationApi;
