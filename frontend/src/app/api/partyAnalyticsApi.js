import { partyBaseApi } from "./partyBaseApi";

export const partyAnalyticsApi = partyBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPartyOverview: builder.query({
      query: () => "/analytics/party-overview",
    }),
  }),
});

export const { useGetPartyOverviewQuery } = partyAnalyticsApi;
