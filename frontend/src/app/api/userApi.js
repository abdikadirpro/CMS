import { baseApi } from "./baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCitizens: builder.query({
      query: (params) => ({ url: "/users", params }),
    }),
    updateOwnProfile: builder.mutation({
      query: (body) => ({ url: "/users/profile", method: "PATCH", body }),
    }),
    changeOwnPassword: builder.mutation({
      query: (body) => ({ url: "/users/change-password", method: "PATCH", body }),
    }),
  }),
});

export const { useGetCitizensQuery, useUpdateOwnProfileMutation, useChangeOwnPasswordMutation } = userApi;
