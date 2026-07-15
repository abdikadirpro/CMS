import { baseApi } from "./baseApi";

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdmins: builder.query({
      query: (params) => ({ url: "/admins", params }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((a) => ({ type: "Admin", id: a.id })), { type: "Admin", id: "LIST" }]
          : [{ type: "Admin", id: "LIST" }],
    }),
    getAdminDirectory: builder.query({
      query: (params) => ({ url: "/admins/directory", params }),
    }),
    updateOwnAdminProfile: builder.mutation({
      query: (body) => ({ url: "/admins/me/profile", method: "PATCH", body }),
    }),
    changeOwnAdminPassword: builder.mutation({
      query: (body) => ({ url: "/admins/me/password", method: "PATCH", body }),
    }),
    getAdminById: builder.query({
      query: (id) => `/admins/${id}`,
      providesTags: (result, error, id) => [{ type: "Admin", id }],
    }),
    createAdmin: builder.mutation({
      query: (body) => ({ url: "/admins", method: "POST", body }),
      invalidatesTags: [{ type: "Admin", id: "LIST" }],
    }),
    updateAdmin: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admins/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => [{ type: "Admin", id }, { type: "Admin", id: "LIST" }],
    }),
    resetAdminPassword: builder.mutation({
      query: ({ id, newPassword }) => ({ url: `/admins/${id}/password`, method: "PATCH", body: { newPassword } }),
    }),
    deleteAdmin: builder.mutation({
      query: (id) => ({ url: `/admins/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Admin", id: "LIST" }],
    }),
    getRoles: builder.query({
      query: () => "/rbac/roles",
      providesTags: ["Role"],
    }),
    createRole: builder.mutation({
      query: (body) => ({ url: "/rbac/roles", method: "POST", body }),
      invalidatesTags: ["Role"],
    }),
    updateRole: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/rbac/roles/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Role"],
    }),
    deleteRole: builder.mutation({
      query: (id) => ({ url: `/rbac/roles/${id}`, method: "DELETE" }),
      invalidatesTags: ["Role"],
    }),
    getPermissions: builder.query({
      query: () => "/rbac/permissions",
    }),
    getActivityLogs: builder.query({
      query: (params) => ({ url: "/activity-logs", params }),
      providesTags: ["ActivityLog"],
    }),
    getBackups: builder.query({
      query: () => "/backup",
      providesTags: ["Backup"],
    }),
    createBackup: builder.mutation({
      query: () => ({ url: "/backup", method: "POST" }),
      invalidatesTags: ["Backup"],
    }),
  }),
});

export const {
  useGetAdminsQuery,
  useGetAdminDirectoryQuery,
  useUpdateOwnAdminProfileMutation,
  useChangeOwnAdminPasswordMutation,
  useGetAdminByIdQuery,
  useCreateAdminMutation,
  useUpdateAdminMutation,
  useResetAdminPasswordMutation,
  useDeleteAdminMutation,
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
  useGetActivityLogsQuery,
  useGetBackupsQuery,
  useCreateBackupMutation,
} = adminApi;
