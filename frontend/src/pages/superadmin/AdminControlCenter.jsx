import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Shield, Plus, KeyRound, Trash2, Search, Crown, Globe, MapPin, Building2, Landmark, Eye, EyeOff } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Input, Select, Label, FieldError } from "../../components/ui/Input";
import { Table, THead, TH, TBody, TR, TD, EmptyState } from "../../components/ui/Table";
import { SkeletonTable } from "../../components/ui/Skeleton";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog, ConfirmDialogSubject, ConfirmDialogWarning } from "../../components/ui/ConfirmDialog";
import { TypeAvatar, TypeBadge } from "../../components/ui/TypeAvatar";
import Button from "../../components/ui/Button";
import { Pagination } from "../../components/ui/Pagination";
import {
  useGetAdminsQuery, useCreateAdminMutation, useUpdateAdminMutation,
  useResetAdminPasswordMutation, useDeleteAdminMutation, useGetRolesQuery,
} from "../../app/api/adminApi";
import { useGetZonesQuery, useGetDistrictsQuery, useGetTownAdministrationsQuery, useGetOfficesQuery } from "../../app/api/hierarchyApi";
import { ADMIN_TYPE_LABELS } from "../../lib/utils";

const ADMIN_TYPES = ["SUPER_ADMIN", "ZONE_ADMIN", "TOWN_ADMIN", "DISTRICT_ADMIN", "OFFICE_ADMIN"];
const JURISDICTION_FIELD = { ZONE_ADMIN: "zoneId", TOWN_ADMIN: "townAdministrationId", DISTRICT_ADMIN: "districtId", OFFICE_ADMIN: "officeId" };

const TYPE_STYLE = {
  SUPER_ADMIN: { icon: Crown, className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  ZONE_ADMIN: { icon: Globe, className: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" },
  DISTRICT_ADMIN: { icon: MapPin, className: "bg-primary/15 text-primary border-primary/30" },
  TOWN_ADMIN: { icon: Building2, className: "bg-teal-500/15 text-teal-400 border-teal-500/30" },
  OFFICE_ADMIN: { icon: Landmark, className: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
};

function styleFor(type) {
  return TYPE_STYLE[type] || TYPE_STYLE.DISTRICT_ADMIN;
}

export default function AdminControlCenter() {
  const [search, setSearch] = useState("");
  const [adminType, setAdminType] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetAdminsQuery({ search: search || undefined, adminType: adminType || undefined, page, pageSize: 15 });
  const { data: rolesRes } = useGetRolesQuery();
  const { data: zonesRes } = useGetZonesQuery();
  const { data: districtsRes } = useGetDistrictsQuery();
  const { data: townsRes } = useGetTownAdministrationsQuery();
  const { data: officesRes } = useGetOfficesQuery();

  const [createAdmin, { isLoading: creating }] = useCreateAdminMutation();
  const [updateAdmin] = useUpdateAdminMutation();
  const [resetPassword, { isLoading: resetting }] = useResetAdminPasswordMutation();
  const [deleteAdmin, { isLoading: deleting }] = useDeleteAdminMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ defaultValues: { adminType: "DISTRICT_ADMIN" } });
  const selectedType = watch("adminType");
  const jurisdictionField = JURISDICTION_FIELD[selectedType];

  const jurisdictionOptions = {
    zoneId: zonesRes?.data ?? [],
    districtId: districtsRes?.data ?? [],
    townAdministrationId: townsRes?.data ?? [],
    officeId: officesRes?.data ?? [],
  }[jurisdictionField] || [];

  const admins = data?.data ?? [];

  function openCreate() {
    reset({ adminType: "DISTRICT_ADMIN" });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      await createAdmin(values).unwrap();
      toast.success("Admin account created");
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create admin");
    }
  }

  async function toggleActive(admin) {
    try {
      await updateAdmin({ id: admin.id, isActive: !admin.isActive }).unwrap();
      toast.success(admin.isActive ? "Admin deactivated" : "Admin activated");
    } catch (err) {
      toast.error(err?.data?.message || "Update failed");
    }
  }

  function closeResetModal() {
    setResetTarget(null);
    setNewPassword("");
    setShowPassword(false);
  }

  async function onResetPassword() {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      await resetPassword({ id: resetTarget.id, newPassword }).unwrap();
      toast.success("Password reset");
      closeResetModal();
    } catch (err) {
      toast.error(err?.data?.message || "Reset failed");
    }
  }

  async function onDelete() {
    try {
      await deleteAdmin(deleteTarget.id).unwrap();
      toast.success("Admin deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Delete failed");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Shield className="h-6 w-6 text-primary" /> Admin Control Center</h1>
          <p className="text-sm text-[rgb(var(--fg-muted))]">Create and manage every admin account across the hierarchy</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Create Admin</Button>
      </div>

      <Card className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={adminType} onChange={(e) => { setAdminType(e.target.value); setPage(1); }} className="sm:w-64">
            <option value="">All Admin Types</option>
            {ADMIN_TYPES.map((t) => <option key={t} value={t}>{ADMIN_TYPE_LABELS[t]}</option>)}
          </Select>
        </div>
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="p-5"><SkeletonTable /></div>
        ) : admins.length === 0 ? (
          <EmptyState message="No admins found" icon={Shield} />
        ) : (
          <Table>
            <THead>
              <tr><TH>Admin</TH><TH>Type</TH><TH>Jurisdiction</TH><TH>Status</TH><TH></TH></tr>
            </THead>
            <TBody>
              {admins.map((a) => (
                <TR key={a.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <TypeAvatar name={a.fullName} style={styleFor(a.adminType)} />
                      <div className="min-w-0">
                        <p className="font-medium">{a.fullName}</p>
                        <p className="truncate text-xs text-[rgb(var(--fg-muted))]">{a.email}</p>
                      </div>
                    </div>
                  </TD>
                  <TD><TypeBadge label={ADMIN_TYPE_LABELS[a.adminType]} style={styleFor(a.adminType)} /></TD>
                  <TD className="text-[rgb(var(--fg-muted))]">{a.zone?.name || a.district?.name || a.townAdministration?.name || a.office?.name || "—"}</TD>
                  <TD>
                    <button onClick={() => toggleActive(a)}>
                      <Badge variant={a.isActive ? "success" : "danger"}>{a.isActive ? "Active" : "Deactivated"}</Badge>
                    </button>
                  </TD>
                  <TD>
                    <div className="flex gap-2">
                      <button onClick={() => setResetTarget(a)} className="rounded-lg p-1.5 hover:bg-[rgb(var(--bg-alt))]" title="Reset password">
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(a)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <div className="px-5 pb-4">
          <Pagination page={data?.meta?.page || 1} totalPages={data?.meta?.totalPages || 1} onChange={setPage} />
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Admin Account">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input {...register("fullName", { required: "Required" })} />
            <FieldError>{errors.fullName?.message}</FieldError>
          </div>
          <div>
            <Label>Email Address</Label>
            <Input type="email" {...register("email", { required: "Required" })} />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div>
            <Label>Temporary Password</Label>
            <Input type="password" {...register("password", { required: "Required", minLength: { value: 8, message: "Minimum 8 characters" } })} />
            <FieldError>{errors.password?.message}</FieldError>
          </div>
          <div>
            <Label>Admin Type</Label>
            <Select {...register("adminType", { required: true })}>
              {ADMIN_TYPES.map((t) => <option key={t} value={t}>{ADMIN_TYPE_LABELS[t]}</option>)}
            </Select>
          </div>
          {jurisdictionField && (
            <div>
              <Label>{ADMIN_TYPE_LABELS[selectedType]} Jurisdiction</Label>
              <Select {...register(jurisdictionField, { required: `Select a ${jurisdictionField}` })}>
                <option value="">Select...</option>
                {jurisdictionOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Select>
            </div>
          )}
          <div>
            <Label>Role (optional)</Label>
            <Select {...register("roleId")}>
              <option value="">No specific role</option>
              {rolesRes?.data?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </div>
          <Button type="submit" className="w-full" loading={creating}>Create Admin</Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Delete Admin"
      >
        <ConfirmDialogSubject name={deleteTarget?.fullName} badge={deleteTarget?.email} />
        <ConfirmDialogWarning />
      </ConfirmDialog>

      <Modal open={Boolean(resetTarget)} onClose={closeResetModal} title="Reset Password" className="max-w-md">
        <div className="mb-4 flex items-center gap-3">
          <TypeAvatar name={resetTarget?.fullName} style={styleFor(resetTarget?.adminType)} />
          <div>
            <p className="font-medium">{resetTarget?.fullName}</p>
            <p className="text-xs text-[rgb(var(--fg-muted))]">{resetTarget?.email}</p>
          </div>
        </div>
        <Label>New Password</Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            className="pr-10"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[rgb(var(--fg))]"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={closeResetModal}>Cancel</Button>
          <Button loading={resetting} onClick={onResetPassword}>
            <KeyRound className="h-4 w-4" /> Reset Password
          </Button>
        </div>
      </Modal>
    </div>
  );
}
