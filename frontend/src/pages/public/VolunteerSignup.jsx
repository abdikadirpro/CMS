import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { HeartHandshake, CheckCircle2 } from "lucide-react";
import { Input, Select, Textarea, Label, FieldError } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useRegisterVolunteerMutation } from "../../app/api/volunteerApi";
import { useGetOfficesQuery, useGetZonesQuery, useGetDistrictsQuery, useGetTownAdministrationsQuery, useGetPartyBranchsQuery } from "../../app/api/hierarchyApi";

export default function VolunteerSignup() {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { locationType: "district" },
  });
  const [registerVolunteer, { isLoading }] = useRegisterVolunteerMutation();
  const { data: officesRes } = useGetOfficesQuery();
  const { data: zonesRes } = useGetZonesQuery();
  const { data: districtsRes } = useGetDistrictsQuery();
  const { data: townsRes } = useGetTownAdministrationsQuery();
  const { data: branchesRes } = useGetPartyBranchsQuery();
  const [done, setDone] = useState(false);

  const locationType = watch("locationType");
  const selectedZoneId = watch("zoneId");
  const districtsInZone = (districtsRes?.data ?? []).filter((d) => d.zoneId === selectedZoneId);

  async function onSubmit(values) {
    const body = {
      fullName: values.fullName,
      phone: values.phone,
      email: values.email || undefined,
      interest: values.interest || undefined,
      partyBranchId: values.partyBranchId || undefined,
    };
    if (values.locationType === "district") body.districtId = values.districtId;
    else if (values.locationType === "zone") body.zoneId = values.zoneOnlyId;
    else if (values.locationType === "town") body.townAdministrationId = values.townAdministrationId;
    else if (values.locationType === "office") body.officeId = values.officeId;

    try {
      await registerVolunteer(body).unwrap();
      setDone(true);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to submit sign-up");
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
        <h1 className="mt-4 text-2xl font-bold">Thanks for signing up!</h1>
        <p className="mt-2 text-[rgb(var(--fg-muted))]">
          A party admin in your area will reach out about volunteer opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <img src="/barwaaqo-logo.jpeg" alt="Xisbiga Barwaaqo" className="h-8 w-8 rounded-full object-cover" /> Volunteer with Xisbiga Barwaaqo
      </h1>
      <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">
        Sign up to help with campaigns, events, and outreach in your area. No membership required.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <Card>
          <h3 className="mb-4 font-semibold">Your Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Full Name</Label>
              <Input {...register("fullName", { required: "Full name is required" })} />
              <FieldError>{errors.fullName?.message}</FieldError>
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input {...register("phone", { required: "Phone number is required" })} />
              <FieldError>{errors.phone?.message}</FieldError>
            </div>
            <div>
              <Label>Email Address (optional)</Label>
              <Input type="email" {...register("email")} />
            </div>
          </div>
          <div className="mt-4">
            <Label>How would you like to help? (optional)</Label>
            <Textarea rows={3} placeholder="e.g. canvassing, phone banking, event support..." {...register("interest")} />
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold">Location</h3>
          <div className="mb-3 flex flex-wrap gap-4 text-sm">
            {[
              ["district", "District"],
              ["zone", "Zone (general)"],
              ["town", "Town Administration"],
              ["office", "Office (regional level)"],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  value={value}
                  checked={locationType === value}
                  onChange={() => setValue("locationType", value)}
                  className="h-4 w-4 accent-primary"
                />
                {label}
              </label>
            ))}
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
                {officesRes?.data?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Select>
              <FieldError>{errors.officeId?.message}</FieldError>
            </div>
          )}
        </Card>

        <Card>
          <Label>Party Branch (optional)</Label>
          <Select {...register("partyBranchId")}>
            <option value="">No specific branch</option>
            {branchesRes?.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </Card>

        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          <HeartHandshake className="h-4 w-4" /> Sign Up to Volunteer
        </Button>
      </form>
    </div>
  );
}
