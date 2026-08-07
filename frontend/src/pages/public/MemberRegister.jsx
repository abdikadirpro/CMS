import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  UploadCloud, UserPlus, FileText, X, CheckCircle2,
  User, ShieldCheck, MapPin, Check, ChevronLeft, ChevronRight, LayoutDashboard,
} from "lucide-react";
import { Input, Select, Label, FieldError } from "../../components/ui/Input";
import { PasswordInput } from "../../components/ui/PasswordInput";
import Button from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { cn } from "../../lib/utils";
import { useRegisterMemberMutation } from "../../app/api/memberApi";
import { useGetOfficesQuery, useGetZonesQuery, useGetDistrictsQuery, useGetTownAdministrationsQuery, useGetPartyBranchsQuery } from "../../app/api/hierarchyApi";
import { usePartyAuth } from "../../hooks/usePartyAuth";

const STEPS = [
  { label: "Personal Info", icon: User, fields: ["fullName", "phone", "email", "idNumber"] },
  { label: "Security", icon: ShieldCheck, fields: ["password", "confirmPassword"] },
  { label: "Location", icon: MapPin, fields: [] },
];

function passwordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH_META = [
  { label: "Weak", color: "bg-red-500" },
  { label: "Fair", color: "bg-orange-500" },
  { label: "Good", color: "bg-yellow-500" },
  { label: "Strong", color: "bg-lime-500" },
  { label: "Very Strong", color: "bg-emerald-500" },
];

function Stepper({ current }) {
  return (
    <div className="mb-8 flex items-center">
      {STEPS.map((s, i) => (
        <div key={s.label} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                i < current && "border-primary bg-primary text-white",
                i === current && "border-primary bg-primary/10 text-primary scale-110",
                i > current && "border-[rgb(var(--border))] bg-[rgb(var(--bg-alt))] text-[rgb(var(--fg-muted))]"
              )}
            >
              {i < current ? <Check className="h-5 w-5" /> : <s.icon className="h-4.5 w-4.5" />}
            </div>
            <span className={cn("mt-2 hidden text-xs font-medium sm:block", i <= current ? "text-[rgb(var(--fg))]" : "text-[rgb(var(--fg-muted))]")}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-[rgb(var(--border))]">
              <motion.div
                className="h-full bg-primary"
                initial={false}
                animate={{ width: i < current ? "100%" : "0%" }}
                transition={{ duration: 0.35 }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function MemberRegister() {
  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm({
    defaultValues: { locationType: "district" },
  });
  const [registerMember, { isLoading }] = useRegisterMemberMutation();
  const { data: officesRes } = useGetOfficesQuery();
  const { data: zonesRes } = useGetZonesQuery();
  const { data: districtsRes } = useGetDistrictsQuery();
  const { data: townsRes } = useGetTownAdministrationsQuery();
  const { data: branchesRes } = useGetPartyBranchsQuery();
  const [idDocument, setIdDocument] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(0);
  const { isAuthenticated, actor, isPartyAdmin } = usePartyAuth();

  const values = watch();
  const districtsInZone = (districtsRes?.data ?? []).filter((d) => d.zoneId === values.zoneId);
  const strength = passwordStrength(values.password);

  function locationLabel() {
    if (values.locationType === "district") return districtsInZone.find((d) => d.id === values.districtId)?.name;
    if (values.locationType === "zone") return zonesRes?.data?.find((z) => z.id === values.zoneOnlyId)?.name;
    if (values.locationType === "town") return townsRes?.data?.find((t) => t.id === values.townAdministrationId)?.name;
    if (values.locationType === "office") return officesRes?.data?.find((o) => o.id === values.officeId)?.name;
    return null;
  }

  async function goNext() {
    const valid = await trigger(STEPS[step].fields);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleFile(file) {
    if (file) setIdDocument(file);
  }

  async function onSubmit(vals) {
    const formData = new FormData();
    formData.append("fullName", vals.fullName);
    formData.append("phone", vals.phone);
    formData.append("email", vals.email);
    formData.append("idNumber", vals.idNumber);
    formData.append("password", vals.password);
    if (vals.locationType === "district") formData.append("districtId", vals.districtId || "");
    else if (vals.locationType === "zone") formData.append("zoneId", vals.zoneOnlyId || "");
    else if (vals.locationType === "town") formData.append("townAdministrationId", vals.townAdministrationId || "");
    else if (vals.locationType === "office") formData.append("officeId", vals.officeId || "");
    formData.append("partyBranchId", vals.partyBranchId || "");
    if (idDocument) formData.append("idDocument", idDocument);

    try {
      const res = await registerMember(formData).unwrap();
      setResult(res.data);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to submit registration");
    }
  }

  if (isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="mt-4 text-2xl font-bold">You&apos;re already signed in</h1>
        <p className="mt-2 text-[rgb(var(--fg-muted))]">Signed in as {actor?.fullName || actor?.email}</p>
        <Link to={isPartyAdmin ? "/barwaaqo/app" : "/membership/app"} className="mt-6 inline-block">
          <Button><LayoutDashboard className="h-4 w-4" /> Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-lg px-4 py-16 text-center"
      >
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
        <h1 className="mt-4 text-2xl font-bold">Registration received!</h1>
        <p className="mt-2 text-[rgb(var(--fg-muted))]">
          Your membership number is <span className="font-mono font-semibold text-primary">{result.membershipNumber}</span>.
        </p>
        <p className="mt-2 text-sm text-[rgb(var(--fg-muted))]">
          You&apos;ll be eligible for full membership after 6 months of standing, subject to admin approval. Keep your membership number for your records.
        </p>
        <div className="mt-6 flex flex-col items-center gap-2">
          <Link to="/barwaaqo/login" className="text-sm font-medium text-primary hover:underline">
            Log in to your dashboard
          </Link>
          <Link
            to={`/membership/track?membershipNumber=${result.membershipNumber}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Track your membership status
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <img src="/barwaaqo-logo.jpeg" alt="Xisbiga Barwaaqo" className="h-8 w-8 rounded-full object-cover" /> Join Xisbiga Barwaaqo
      </h1>
      <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">
        Registration is free. New members join as provisional members and become eligible for full membership after 6 months, pending admin approval.
      </p>

      <div className="mt-8">
        <Stepper current={step} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step-0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <Card>
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <User className="h-4 w-4 text-primary" /> Personal Information
                </h3>
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
                    <Label>Email Address</Label>
                    <Input type="email" {...register("email", { required: "Email is required" })} />
                    <FieldError>{errors.email?.message}</FieldError>
                  </div>
                  <div>
                    <Label>National ID</Label>
                    <Input {...register("idNumber", { required: "National ID is required" })} />
                    <FieldError>{errors.idNumber?.message}</FieldError>
                  </div>
                </div>

                <div className="mt-4">
                  <Label>ID Document (optional — image or PDF)</Label>
                  <label
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files?.[0]); }}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 text-center transition-colors",
                      dragActive ? "border-primary bg-primary/5" : "border-[rgb(var(--border))] hover:border-primary/50"
                    )}
                  >
                    <UploadCloud className={cn("h-8 w-8 transition-colors", dragActive ? "text-primary" : "text-[rgb(var(--fg-muted))]")} />
                    <span className="text-sm text-[rgb(var(--fg-muted))]">Click to upload, or drag and drop</span>
                    <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.gif,.pdf" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
                  </label>
                  {idDocument && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-[rgb(var(--bg-alt))] px-3 py-2 text-sm">
                      <span className="flex items-center gap-2 truncate"><FileText className="h-4 w-4 shrink-0" /> {idDocument.name}</span>
                      <button type="button" onClick={() => setIdDocument(null)}>
                        <X className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step-1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <Card>
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Account Security
                </h3>
                <p className="mb-4 text-xs text-[rgb(var(--fg-muted))]">
                  This email and password let you sign in to your Membership Dashboard.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Password</Label>
                    <PasswordInput {...register("password", { required: "Password is required", minLength: { value: 8, message: "Minimum 8 characters" } })} />
                    <FieldError>{errors.password?.message}</FieldError>
                    {values.password && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", i <= strength ? STRENGTH_META[strength].color : "bg-[rgb(var(--border))]")} />
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-[rgb(var(--fg-muted))]">
                          Password strength: <span className="font-medium">{STRENGTH_META[strength].label}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Confirm Password</Label>
                    <PasswordInput
                      {...register("confirmPassword", {
                        required: "Please confirm your password",
                        validate: (value) => value === values.password || "Passwords do not match",
                      })}
                    />
                    <FieldError>{errors.confirmPassword?.message}</FieldError>
                    {values.confirmPassword && values.confirmPassword === values.password && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                        <Check className="h-3.5 w-3.5" /> Passwords match
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step-2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="space-y-6">
              <Card>
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <MapPin className="h-4 w-4 text-primary" /> Location
                </h3>
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
                        checked={values.locationType === value}
                        onChange={() => setValue("locationType", value)}
                        className="h-4 w-4 accent-primary"
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {values.locationType === "district" && (
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
                      <Select {...register("districtId", { required: values.locationType === "district" ? "District is required" : false })} disabled={!values.zoneId}>
                        <option value="">{values.zoneId ? "Select district" : "Select a zone first"}</option>
                        {districtsInZone.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </Select>
                      <FieldError>{errors.districtId?.message}</FieldError>
                    </div>
                  </div>
                )}

                {values.locationType === "zone" && (
                  <div>
                    <Label>Zone</Label>
                    <Select {...register("zoneOnlyId", { required: values.locationType === "zone" ? "Zone is required" : false })}>
                      <option value="">Select zone</option>
                      {zonesRes?.data?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </Select>
                    <FieldError>{errors.zoneOnlyId?.message}</FieldError>
                  </div>
                )}

                {values.locationType === "town" && (
                  <div>
                    <Label>Town Administration</Label>
                    <Select {...register("townAdministrationId", { required: values.locationType === "town" ? "Town Administration is required" : false })}>
                      <option value="">Select town administration</option>
                      {townsRes?.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                    <FieldError>{errors.townAdministrationId?.message}</FieldError>
                  </div>
                )}

                {values.locationType === "office" && (
                  <div>
                    <Label>Office</Label>
                    <Select {...register("officeId", { required: values.locationType === "office" ? "Office is required" : false })}>
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

              <Card className="bg-primary/5">
                <h3 className="mb-3 text-sm font-semibold">Review your details</h3>
                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div className="flex justify-between gap-2 sm:block">
                    <dt className="text-[rgb(var(--fg-muted))]">Full Name</dt>
                    <dd className="font-medium">{values.fullName || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2 sm:block">
                    <dt className="text-[rgb(var(--fg-muted))]">Email</dt>
                    <dd className="font-medium">{values.email || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2 sm:block">
                    <dt className="text-[rgb(var(--fg-muted))]">Phone</dt>
                    <dd className="font-medium">{values.phone || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2 sm:block">
                    <dt className="text-[rgb(var(--fg-muted))]">Location</dt>
                    <dd className="font-medium">{locationLabel() || "—"}</dd>
                  </div>
                </dl>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between pt-2">
          {step > 0 ? (
            <Button type="button" variant="secondary" onClick={goBack}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          ) : <span />}

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" loading={isLoading}>
              <UserPlus className="h-4 w-4" /> Register
            </Button>
          )}
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-[rgb(var(--fg-muted))]">
        Already have an account?{" "}
        <Link to="/barwaaqo/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
