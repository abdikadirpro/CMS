import { partyBaseApi } from "./partyBaseApi";

export const partyAuthApi = partyBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    partyLogin: builder.mutation({
      query: (body) => ({ url: "/party-auth/login", method: "POST", body }),
    }),
    partyLogout: builder.mutation({
      query: () => ({ url: "/party-auth/logout", method: "POST" }),
    }),
    partyRefreshSession: builder.mutation({
      query: () => ({ url: "/party-auth/refresh", method: "POST" }),
    }),
    getPartyMe: builder.query({
      query: () => "/party-auth/me",
    }),
    partyForgotPassword: builder.mutation({
      query: (body) => ({ url: "/party-auth/forgot-password", method: "POST", body }),
    }),
    partyResetPassword: builder.mutation({
      query: (body) => ({ url: "/party-auth/reset-password", method: "POST", body }),
    }),
  }),
});

export const {
  usePartyLoginMutation,
  usePartyLogoutMutation,
  usePartyRefreshSessionMutation,
  useGetPartyMeQuery,
  useLazyGetPartyMeQuery,
  usePartyForgotPasswordMutation,
  usePartyResetPasswordMutation,
} = partyAuthApi;
