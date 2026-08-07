import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { Key, Plus, Trash2 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Input, Label, FieldError } from "../../components/ui/Input";
import { EmptyState } from "../../components/ui/Table";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog, ConfirmDialogSubject, ConfirmDialogWarning } from "../../components/ui/ConfirmDialog";
import Button from "../../components/ui/Button";
import { useGetRolesQuery, useCreateRoleMutation, useDeleteRoleMutation, useGetPermissionsQuery } from "../../app/api/adminApi";

export default function PermissionManagement() {
  const { data: rolesRes, isLoading } = useGetRolesQuery();
  const { data: permissionsRes } = useGetPermissionsQuery();
  const [createRole, { isLoading: creating }] = useCreateRoleMutation();
  const [deleteRole, { isLoading: deleting }] = useDeleteRoleMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({ defaultValues: { permissionCodes: [] } });

  const roles = rolesRes?.data ?? [];
  const permissions = permissionsRes?.data ?? [];

  async function onSubmit(values) {
    try {
      await createRole({ ...values, permissionCodes: values.permissionCodes || [] }).unwrap();
      toast.success("Role created");
      reset({ permissionCodes: [] });
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create role");
    }
  }

  async function onDelete() {
    try {
      await deleteRole(deleteTarget.id).unwrap();
      toast.success("Role deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Delete failed");
    }
  }

  if (isLoading) return <SkeletonCard />;

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Key className="h-6 w-6 text-primary" /> Permission Management</h1>
          <p className="text-sm text-[rgb(var(--fg-muted))]">Define roles and the permissions assigned to each</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> New Role</Button>
      </div>

      {roles.length === 0 ? (
        <Card><EmptyState message="No roles defined yet" icon={Key} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.id}>
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{role.name}</h3>
                  <p className="text-xs text-[rgb(var(--fg-muted))]">{role._count?.admins ?? 0} admins assigned</p>
                </div>
                <button onClick={() => setDeleteTarget(role)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions?.map((rp) => <Badge key={rp.permissionId}>{rp.permission.code}</Badge>)}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Role">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Role Name</Label>
            <Input {...register("name", { required: "Required" })} />
            <FieldError>{errors.name?.message}</FieldError>
          </div>
          <div>
            <Label>Description</Label>
            <Input {...register("description")} />
          </div>
          <div>
            <Label>Permissions</Label>
            <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-[rgb(var(--border))] p-3">
              {permissions.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <Controller
                    name="permissionCodes"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded accent-primary"
                        checked={field.value?.includes(p.code)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...(field.value || []), p.code]
                            : (field.value || []).filter((c) => c !== p.code);
                          field.onChange(next);
                        }}
                      />
                    )}
                  />
                  {p.code}
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" loading={creating}>Create Role</Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Delete Role"
      >
        <ConfirmDialogSubject name={deleteTarget?.name} />
        <ConfirmDialogWarning>
          Any admin currently assigned this role will lose the permissions it grants.
        </ConfirmDialogWarning>
      </ConfirmDialog>
    </div>
  );
}
