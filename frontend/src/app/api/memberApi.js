import { baseApi } from "./baseApi";

export const memberApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    registerMember: builder.mutation({
      query: (formData) => ({ url: "/members", method: "POST", body: formData }),
    }),
    trackMember: builder.query({
      query: (membershipNumber) => `/members/track/${membershipNumber}`,
    }),
  }),
});

export const { useRegisterMemberMutation, useTrackMemberQuery, useLazyTrackMemberQuery } = memberApi;
