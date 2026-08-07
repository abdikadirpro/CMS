import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, logout } from "../partyAuthSlice";

// Mirrors baseApi.js but talks to the Xisbiga Barwaaqo party-admin endpoints with its own bearer
// token (state.partyAuth), kept fully separate so a party-admin session and a complaint-admin
// session can coexist in the same browser without one's token/refresh cycle touching the other's.
const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().partyAuth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

let refreshPromise = null;

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401 && !args?.url?.includes("/party-auth/")) {
    if (!refreshPromise) {
      refreshPromise = rawBaseQuery({ url: "/party-auth/refresh", method: "POST" }, api, extraOptions).finally(() => {
        refreshPromise = null;
      });
    }
    const refreshResult = await refreshPromise;

    if (refreshResult.data) {
      api.dispatch(setCredentials({ accessToken: refreshResult.data.data.accessToken }));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const partyBaseApi = createApi({
  reducerPath: "partyApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Member", "PartyBranch", "PartyAdmin", "Volunteer", "Donation"],
  endpoints: () => ({}),
});
