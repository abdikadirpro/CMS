import { baseApi } from "./baseApi";

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardAnalytics: builder.query({
      query: () => "/analytics/dashboard",
      providesTags: ["Analytics"],
    }),
    getGlobalAnalytics: builder.query({
      query: () => "/analytics/global",
      providesTags: ["Analytics"],
    }),
  }),
});

export const { useGetDashboardAnalyticsQuery, useGetGlobalAnalyticsQuery } = analyticsApi;
