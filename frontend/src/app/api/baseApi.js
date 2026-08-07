import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, logout } from "../authSlice";

// In dev, Vite proxies relative "/api" to the backend (see vite.config.js). In production the
// frontend and backend are deployed to different origins, so VITE_API_URL must point at the
// deployed backend (e.g. https://api.example.com) — set at build time on the hosting platform.
const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

let refreshPromise = null;

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401 && !args?.url?.includes("/auth/")) {
    if (!refreshPromise) {
      refreshPromise = rawBaseQuery({ url: "/auth/refresh", method: "POST" }, api, extraOptions).finally(() => {
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

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Complaint", "Member", "Notification", "Admin", "PartyAdmin", "Zone", "District",
    "TownAdministration", "Office", "Category", "PartyBranch", "Role", "ActivityLog", "Backup", "Analytics",
  ],
  endpoints: () => ({}),
});
