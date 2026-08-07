import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Table, THead, TH, TBody, TR, TD, EmptyState } from "../../components/ui/Table";
import { SkeletonTable } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog, ConfirmDialogSubject, ConfirmDialogWarning } from "../../components/ui/ConfirmDialog";
import Button from "../../components/ui/Button";
import { Input, Select, Label, FieldError } from "../../components/ui/Input";

/**
 * Generic CRUD manager for hierarchy resources (Zone, District, Town Administration, Office, Category).
 * `fields` describes the create/edit form; `columns` describes extra read-only table columns beyond name.
 */
export default function HierarchyManager({
  title, description, icon: Icon,
  useListQuery, useCreateMutation, useUpdateMutation, useDeleteMutation,
  fields = [], columns = [],
}) {
  const { data, isLoading } = useListQuery();
  const [createItem, { isLoading: creating }] = useCreateMutation();
  const [updateItem, { isLoading: updating }] = useUpdateMutation();
  const [deleteItem, { isLoading: deleting }] = useDeleteMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const items = data?.data ?? [];

  function openCreate() {
    setEditing(null);
    reset({});
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    // Only seed the form with fields it actually edits — resetting with the full fetched record
    // (which includes _count, createdAt, relation objects, etc.) would submit those straight to
    // the API along with the real changes.
    const editableKeys = ["name", ...fields.map((f) => f.name)];
    reset(Object.fromEntries(editableKeys.map((key) => [key, item[key] ?? ""])));
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) {
        await updateItem({ id: editing.id, ...values }).unwrap();
        toast.success("Updated successfully");
      } else {
        await createItem(values).unwrap();
        toast.success("Created successfully");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || "Operation failed");
    }
  }

  async function onDelete() {
    try {
      await deleteItem(deleteTarget.id).unwrap();
      toast.success("Deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Delete failed");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">{Icon && <Icon className="h-6 w-6 text-primary" />} {title}</h1>
          <p className="text-sm text-[rgb(var(--fg-muted))]">{description}</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add New</Button>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="p-5"><SkeletonTable /></div>
        ) : items.length === 0 ? (
          <EmptyState message="No records yet" />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                {columns.map((c) => <TH key={c.key}>{c.label}</TH>)}
                <TH></TH>
              </tr>
            </THead>
            <TBody>
              {items.map((item) => (
                <TR key={item.id}>
                  <TD className="font-medium">{item.name}</TD>
                  {columns.map((c) => (
                    <TD key={c.key}>{c.render ? c.render(item) : item[c.key] ?? "—"}</TD>
                  ))}
                  <TD>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 hover:bg-[rgb(var(--bg-alt))]">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(item)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${title}` : `Add ${title}`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input {...register("name", { required: "Name is required" })} />
            <FieldError>{errors.name?.message}</FieldError>
          </div>
          {fields.map((field) => (
            <div key={field.name}>
              <Label>{field.label}</Label>
              {field.type === "select" ? (
                <Select {...register(field.name, { required: field.required })}>
                  <option value="">{field.placeholder || "Select..."}</option>
                  {field.options?.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </Select>
              ) : (
                <Input {...register(field.name, { required: field.required })} />
              )}
              <FieldError>{errors[field.name]?.message}</FieldError>
            </div>
          ))}
          <Button type="submit" className="w-full" loading={creating || updating}>
            {editing ? "Save Changes" : "Create"}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
        loading={deleting}
        title={`Delete ${title}`}
      >
        <ConfirmDialogSubject name={deleteTarget?.name} />
        <ConfirmDialogWarning />
      </ConfirmDialog>
    </div>
  );
}
