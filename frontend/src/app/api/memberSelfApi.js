import { partyBaseApi } from "./partyBaseApi";

// A member's own self-service actions (update profile, renew membership) — uses the shared party
// portal bearer token (partyBaseApi), same client Members authenticate through post-login-merge.
export const memberSelfApi = partyBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOwnProfile: builder.query({
      query: () => "/members/me",
      providesTags: ["Member"],
    }),
    updateOwnProfile: builder.mutation({
      query: (body) => ({ url: "/members/me", method: "PATCH", body }),
      invalidatesTags: ["Member"],
    }),
    renewMembership: builder.mutation({
      query: () => ({ url: "/members/me/renew", method: "POST" }),
      invalidatesTags: ["Member"],
    }),
  }),
});

export const { useGetOwnProfileQuery, useUpdateOwnProfileMutation, useRenewMembershipMutation } = memberSelfApi;
