import { baseApi } from "./baseApi";

export const volunteerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    registerVolunteer: builder.mutation({
      query: (body) => ({ url: "/volunteers", method: "POST", body }),
    }),
  }),
});

export const { useRegisterVolunteerMutation } = volunteerApi;
