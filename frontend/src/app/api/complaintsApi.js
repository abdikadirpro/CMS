import { baseApi } from "./baseApi";

export const complaintsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitComplaint: builder.mutation({
      query: (formData) => ({ url: "/complaints", method: "POST", body: formData }),
      invalidatesTags: ["Complaint"],
    }),
    getComplaints: builder.query({
      query: (params) => ({ url: "/complaints", params }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((c) => ({ type: "Complaint", id: c.id })), { type: "Complaint", id: "LIST" }]
          : [{ type: "Complaint", id: "LIST" }],
    }),
    getComplaintById: builder.query({
      query: (id) => `/complaints/${id}`,
      providesTags: (result, error, id) => [{ type: "Complaint", id }],
    }),
    trackComplaint: builder.query({
      query: (trackingId) => `/complaints/track/${trackingId}`,
    }),
    updateComplaintStatus: builder.mutation({
      query: ({ id, status, reason }) => ({ url: `/complaints/${id}/status`, method: "PATCH", body: { status, reason } }),
      invalidatesTags: (result, error, { id }) => [{ type: "Complaint", id }, { type: "Complaint", id: "LIST" }],
    }),
    assignComplaint: builder.mutation({
      query: ({ id, adminId }) => ({ url: `/complaints/${id}/assign`, method: "POST", body: { adminId } }),
      invalidatesTags: (result, error, { id }) => [{ type: "Complaint", id }, { type: "Complaint", id: "LIST" }],
    }),
    transferComplaint: builder.mutation({
      query: ({ id, toAdminId, toOfficeName, reason }) => ({
        url: `/complaints/${id}/transfer`,
        method: "POST",
        body: { toAdminId, toOfficeName, reason },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Complaint", id }, { type: "Complaint", id: "LIST" }],
    }),
    addComplaintNote: builder.mutation({
      query: ({ id, content }) => ({ url: `/complaints/${id}/notes`, method: "POST", body: { content } }),
      invalidatesTags: (result, error, { id }) => [{ type: "Complaint", id }],
    }),
  }),
});

export const {
  useSubmitComplaintMutation,
  useGetComplaintsQuery,
  useGetComplaintByIdQuery,
  useLazyTrackComplaintQuery,
  useUpdateComplaintStatusMutation,
  useAssignComplaintMutation,
  useTransferComplaintMutation,
  useAddComplaintNoteMutation,
} = complaintsApi;
