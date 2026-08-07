import { baseApi } from "./baseApi";

export const donationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    registerDonation: builder.mutation({
      query: (body) => ({ url: "/donations", method: "POST", body }),
    }),
    getDonationStatus: builder.query({
      query: (id) => `/donations/${id}/status`,
    }),
  }),
});

export const { useRegisterDonationMutation, useLazyGetDonationStatusQuery } = donationApi;
