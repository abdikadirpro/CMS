import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { UploadCloud, Send, X, FileText } from "lucide-react";
import { Input, Textarea, Select, Label, FieldError } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useSubmitComplaintMutation } from "../../app/api/complaintsApi";
import { useGetCategorysQuery, useGetOfficesQuery, useGetZonesQuery, useGetDistrictsQuery, useGetTownAdministrationsQuery } from "../../app/api/hierarchyApi";
import { useAuth } from "../../hooks/useAuth";

export default function SubmitComplaint() {
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { isAnonymous: false, locationType: "district" },
  });
  const [submitComplaint, { isLoading }] = useSubmitComplaintMutation();
  const { data: categoriesRes } = useGetCategorysQuery();
  const { data: officesRes } = useGetOfficesQuery();
  const { data: zonesRes } = useGetZonesQuery();
  const { data: districtsRes } = useGetDistrictsQuery();
  const { data: townsRes } = useGetTownAdministrationsQuery();
  const { isUser, actor } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);

  const isAnonymous = watch("isAnonymous");
  // A logged-in, non-anonymous citizen's name/email/phone are already known from their account —
  // shown read-only instead of asking for them again. Everyone else (guest, or an anonymous
  // account) still needs to type them in.
  const isIdentifiedAccount = isUser && !isAnonymous;
  const locationType = watch("locationType");
  const selectedZoneId = watch("zoneId");
  const districtsInZone = (districtsRes?.data ?? []).filter((d) => d.zoneId === selectedZoneId);

  function handleFileChange(e) {
    const selected = Array.from(e.target.files || []).slice(0, 5);
    setFiles(selected);
  }

  function removeFile(index) {
    setFiles((f) => f.filter((_, i) => i !== index));
  }

  async function onSubmit(values) {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("description", values.description);
    formData.append("location", values.location || "");
    formData.append("categoryId", values.categoryId || "");
    formData.append("officeId", values.officeId || "");
    if (values.locationType === "district") {
      formData.append("districtId", values.districtId || "");
    } else if (values.locationType === "zone") {
      formData.append("zoneId", values.zoneOnlyId || "");
    } else if (values.locationType === "town") {
      formData.append("townAdministrationId", values.townAdministrationId || "");
    }
    // locationType === "office": officeId (appended above) is already the full routing signal —
    // no district/zone/town to add.
    formData.append("isAnonymous", String(Boolean(values.isAnonymous)));
    // Office/Job Position/ID Number are per-complaint context the backend stores regardless of
    // submission type, so they're always sent. Name/Email/Phone are only meaningful when there's
    // no account identity to fall back on — the backend ignores them for an identified submission.
    formData.append("guestOffice", values.guestOffice || "");
    formData.append("guestJobTitle", values.guestJobTitle || "");
    formData.append("guestIdNumber", values.guestIdNumber || "");
    if (!isIdentifiedAccount) {
      formData.append("guestFullName", values.guestFullName || "");
      formData.append("guestEmail", values.guestEmail || "");
      formData.append("guestPhone", values.guestPhone || "");
    }
    files.forEach((file) => formData.append("attachments", file));

    try {
      const res = await submitComplaint(formData).unwrap();
      toast.success(`Complaint submitted! Tracking ID: ${res.data.trackingId}`, { duration: 8000 });
      // Anonymous submissions (even from a logged-in account) are never tied to submitterId,
      // so they'll never show up in "My Complaints" — send those to the tracking page instead,
      // where the tracking ID actually works, rather than a list they'll never appear in.
      const willAppearInMyComplaints = isUser && !isAnonymous;
      navigate(willAppearInMyComplaints ? "/app/complaints" : `/track?id=${res.data.trackingId}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to submit complaint");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Submit a Complaint</h1>
      <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">Provide as much detail as possible to help us route and resolve your complaint quickly.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <Card>
          <h3 className="mb-4 font-semibold">Personal Information</h3>

          {isIdentifiedAccount ? (
            <div className="mb-4 rounded-lg bg-[rgb(var(--bg-alt))] p-3 text-sm">
              <p className="font-medium">{actor?.fullName}</p>
              <p className="text-[rgb(var(--fg-muted))]">{[actor?.email, actor?.phone].filter(Boolean).join(" · ")}</p>
              <p className="mt-1 text-xs text-[rgb(var(--fg-muted))]">Filing as your registered account. Fill in the fields below only if they&apos;re relevant to this complaint.</p>
            </div>
          ) : (
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Full Name</Label>
                <Input {...register("guestFullName", { required: !isAnonymous ? "Full name is required" : false })} />
                <FieldError>{errors.guestFullName?.message}</FieldError>
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input {...register("guestPhone")} />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input type="email" {...register("guestEmail")} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>National ID</Label>
              <Input {...register("guestIdNumber", { required: "National ID is required" })} />
              <FieldError>{errors.guestIdNumber?.message}</FieldError>
            </div>
            <div>
              <Label>Office / Workplace</Label>
              <Input {...register("guestOffice")} />
            </div>
            <div>
              <Label>Job Position</Label>
              <Input {...register("guestJobTitle")} />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold">Complaint Details</h3>
          <div className="space-y-4">
            <div>
              <Label>Complaint Title</Label>
              <Input placeholder="Brief summary of the issue" {...register("title", { required: "Title is required" })} />
              <FieldError>{errors.title?.message}</FieldError>
            </div>
            <div>
              <Label>Complaint Description</Label>
              <Textarea rows={5} placeholder="Describe what happened in detail..." {...register("description", { required: "Description is required" })} />
              <FieldError>{errors.description?.message}</FieldError>
            </div>
            <div>
              <Label>Where did this happen?</Label>
              <div className="mb-3 flex gap-4 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    value="district"
                    checked={locationType === "district"}
                    onChange={() => setValue("locationType", "district")}
                    className="h-4 w-4 accent-primary"
                  />
                  District
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    value="zone"
                    checked={locationType === "zone"}
                    onChange={() => setValue("locationType", "zone")}
                    className="h-4 w-4 accent-primary"
                  />
                  Zone (general)
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    value="town"
                    checked={locationType === "town"}
                    onChange={() => setValue("locationType", "town")}
                    className="h-4 w-4 accent-primary"
                  />
                  Town Administration
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    value="office"
                    checked={locationType === "office"}
                    onChange={() => setValue("locationType", "office")}
                    className="h-4 w-4 accent-primary"
                  />
                  Office (regional level)
                </label>
              </div>

              {locationType === "district" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Zone</Label>
                    <Select {...register("zoneId")} onChange={(e) => { setValue("zoneId", e.target.value); setValue("districtId", ""); }}>
                      <option value="">Select zone</option>
                      {zonesRes?.data?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>District</Label>
                    <Select {...register("districtId", { required: locationType === "district" ? "District is required" : false })} disabled={!selectedZoneId}>
                      <option value="">{selectedZoneId ? "Select district" : "Select a zone first"}</option>
                      {districtsInZone.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </Select>
                    <FieldError>{errors.districtId?.message}</FieldError>
                  </div>
                </div>
              )}

              {locationType === "zone" && (
                <div>
                  <Label>Zone</Label>
                  <Select {...register("zoneOnlyId", { required: locationType === "zone" ? "Zone is required" : false })}>
                    <option value="">Select zone</option>
                    {zonesRes?.data?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </Select>
                  <FieldError>{errors.zoneOnlyId?.message}</FieldError>
                  <p className="mt-1 text-xs text-[rgb(var(--fg-muted))]">Use this only if the issue isn&apos;t specific to one district — it goes straight to the Zone Admin.</p>
                </div>
              )}

              {locationType === "town" && (
                <div>
                  <Label>Town Administration</Label>
                  <Select {...register("townAdministrationId", { required: locationType === "town" ? "Town Administration is required" : false })}>
                    <option value="">Select town administration</option>
                    {townsRes?.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                  <FieldError>{errors.townAdministrationId?.message}</FieldError>
                </div>
              )}

              {locationType === "office" && (
                <div>
                  <Label>Office</Label>
                  <Select {...register("officeId", { required: locationType === "office" ? "Office is required" : false })}>
                    <option value="">Select office</option>
                    {officesRes?.data?.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </Select>
                  <FieldError>{errors.officeId?.message}</FieldError>
                  <p className="mt-1 text-xs text-[rgb(var(--fg-muted))]">
                    Use this for a regional-level office issue with no specific district, zone, or town — it goes straight to that office&apos;s admin, reporting directly to the Super Admin.
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label>Complaint Category</Label>
              <Select {...register("categoryId")}>
                <option value="">Select category</option>
                {categoriesRes?.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Landmark / Exact Address (optional)</Label>
              <Input placeholder="e.g. Near the central market, street name..." {...register("location")} />
            </div>

            <div>
              <Label>Attachments (images, PDF, docs — up to 5 files)</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[rgb(var(--border))] py-8 text-center hover:border-primary/50 transition-colors">
                <UploadCloud className="h-8 w-8 text-[rgb(var(--fg-muted))]" />
                <span className="text-sm text-[rgb(var(--fg-muted))]">Click to select files</span>
                <input type="file" multiple className="hidden" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx" />
              </label>
              {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg bg-[rgb(var(--bg-alt))] px-3 py-2 text-sm">
                      <span className="flex items-center gap-2 truncate"><FileText className="h-4 w-4 shrink-0" /> {f.name}</span>
                      <button type="button" onClick={() => removeFile(i)}>
                        <X className="h-4 w-4 text-red-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {isUser && (
              <label className="flex items-center gap-2 text-sm">
                <Controller
                  name="isAnonymous"
                  control={control}
                  render={({ field }) => (
                    <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} className="h-4 w-4 rounded accent-primary" />
                  )}
                />
                Submit this complaint anonymously
              </label>
            )}
          </div>
        </Card>

        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          <Send className="h-4 w-4" /> Submit Complaint
        </Button>
      </form>
    </div>
  );
}
