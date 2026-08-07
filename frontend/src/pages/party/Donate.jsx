import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import {
  UploadCloud, HeartHandshake, FileText, X, CheckCircle2, Landmark, Smartphone,
  Mail, Lock, LogIn, UserCheck, CircleUserRound, Copy, Check, Clock, Hourglass, RefreshCw, ChevronDown,
  Phone, MonitorSmartphone, MapPin,
} from "lucide-react";
import { Input, Select, Textarea, Label, FieldError } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { cn } from "../../lib/utils";
import { useRegisterDonationMutation, useLazyGetDonationStatusQuery } from "../../app/api/donationApi";
import { useGetOfficesQuery, useGetZonesQuery, useGetDistrictsQuery, useGetTownAdministrationsQuery, useGetPartyBranchsQuery } from "../../app/api/hierarchyApi";
import { usePartyAuth } from "../../hooks/usePartyAuth";
import { usePartyLoginMutation } from "../../app/api/partyAuthApi";
import { setCredentials } from "../../app/partyAuthSlice";

// Real Xisbiga Barwaaqo giving accounts — update here if an account or branch ever changes. The
// first entry is the primary/recommended method shown by default; the rest sit behind "Other
// ways to give" so the page leads with one clear action instead of a flat list.
const PRIMARY_PAYMENT_METHOD = { icon: Landmark, provider: "Commercial Bank of Ethiopia (CBE)", name: "Xisbiga Barwaaqo Branch 2", number: "1000067535456" };
const OTHER_PAYMENT_METHODS = [
  { icon: Smartphone, provider: "Telebirr", name: "Xisbiga Barwaaqo Branch 2", number: "090137553" },
];

const PRESET_AMOUNTS = [100, 500, 1000, 2500];

function PaymentMethodCard({ method, primary }) {
  const isReal = !method.number.startsWith("[Placeholder");

  async function copy() {
    try {
      await navigator.clipboard.writeText(method.number);
      toast.success("Account number copied");
    } catch {
      toast.error("Couldn't copy — please copy it manually");
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border p-4",
        primary ? "border-primary/40 bg-primary/5" : "border-[rgb(var(--border))] bg-[rgb(var(--bg-alt))]"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <method.icon className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{method.provider}</p>
            {primary && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Recommended</span>}
          </div>
          <p className="text-xs text-[rgb(var(--fg-muted))]">Name: {method.name}</p>
          <p className="font-mono text-sm font-semibold text-primary">Number: {method.number}</p>
        </div>
      </div>
      {isReal && (
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${method.provider} account number`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--fg-muted))] transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Copy className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function LoginToPrefill({ onDone, onSkip }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [login, { isLoading }] = usePartyLoginMutation();
  const dispatch = useDispatch();
  const [serverError, setServerError] = useState("");

  async function onSubmit(values) {
    setServerError("");
    try {
      const res = await login(values).unwrap();
      dispatch(setCredentials({ accessToken: res.data.accessToken, actor: res.data.actor }));
      toast.success(`Welcome back, ${res.data.actor.fullName}!`);
      onDone(res.data.actor);
    } catch (err) {
      setServerError(err?.data?.message || "Login failed");
    }
  }

  return (
    <Card className="mt-6">
      <h3 className="mb-1 flex items-center gap-2 font-semibold"><LogIn className="h-4 w-4 text-primary" /> Log In to Donate</h3>
      <p className="mb-4 text-xs text-[rgb(var(--fg-muted))]">Logging in fills in your name, phone, and email for you.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Email Address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--fg-muted))]" />
              <Input type="email" className="pl-9" {...register("email", { required: "Email is required" })} />
            </div>
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div>
            <Label>Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--fg-muted))]" />
              <Input type="password" className="pl-9" {...register("password", { required: "Password is required" })} />
            </div>
            <FieldError>{errors.password?.message}</FieldError>
          </div>
        </div>
        {serverError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{serverError}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={isLoading}><LogIn className="h-4 w-4" /> Log In</Button>
          <button type="button" onClick={onSkip} className="text-sm font-medium text-[rgb(var(--fg-muted))] hover:text-primary">
            Continue without an account instead
          </button>
        </div>
      </form>
    </Card>
  );
}

function PaymentStatusScreen({ donationId, hasReceipt }) {
  const [fetchStatus, { isFetching }] = useLazyGetDonationStatusQuery();
  const [status, setStatus] = useState("PENDING");

  useEffect(() => {
    fetchStatus(donationId).unwrap().then((res) => setStatus(res.data.status)).catch(() => {});
  }, [donationId, fetchStatus]);

  async function refresh() {
    try {
      const res = await fetchStatus(donationId).unwrap();
      setStatus(res.data.status);
      toast.success(res.data.status === "CONFIRMED" ? "Your donation has been confirmed!" : "Still under review");
    } catch {
      toast.error("Couldn't check status right now");
    }
  }

  const confirmed = status === "CONFIRMED";
  const STEPS = [
    { label: "Submission Received", done: true },
    { label: "Validity Checking", done: confirmed, active: !confirmed },
    { label: "Final Approval", done: confirmed },
  ];

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="text-center">
        {confirmed ? (
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" />
        ) : (
          <Hourglass className="mx-auto h-16 w-16 text-amber-400" />
        )}
        <h1 className="mt-4 text-2xl font-bold">{confirmed ? "Donation Confirmed" : "Under Review"}</h1>
        <p className="mt-2 text-[rgb(var(--fg-muted))]">
          {confirmed
            ? "Thank you — your donation has been confirmed by a party admin."
            : "Your donation is being reviewed by our team."}
        </p>
      </div>

      <Card className="mt-8">
        <div className="mb-4 flex items-center gap-2 text-sm text-[rgb(var(--fg-muted))]">
          <Clock className="h-4 w-4 shrink-0" /> Estimated verification time: typically 1–3 business days
        </div>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.label} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  s.done ? "bg-emerald-500 text-white" : s.active ? "bg-amber-500/20 text-amber-500" : "bg-[rgb(var(--bg-alt))] text-[rgb(var(--fg-muted))]"
                )}
              >
                {s.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={s.done || s.active ? "font-medium" : "text-[rgb(var(--fg-muted))]"}>{s.label}</span>
            </li>
          ))}
        </ol>
      </Card>

      {!hasReceipt && (
        <Card className="mt-4 border-amber-500/30 bg-amber-500/5">
          <p className="text-sm text-amber-500">You submitted without a receipt — a party admin may reach out to confirm your payment.</p>
        </Card>
      )}

      <Card className="mt-4">
        <p className="flex items-start gap-2 text-xs text-[rgb(var(--fg-muted))]">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Your payment receipt is only visible to party admins reviewing donations, and is never shared publicly.
        </p>
      </Card>

      <div className="mt-6 flex flex-col items-center gap-3">
        <Button variant="secondary" onClick={refresh} loading={isFetching}>
          <RefreshCw className="h-4 w-4" /> Refresh Status
        </Button>
        <Link to="/membership/contact" className="text-sm font-medium text-primary hover:underline">Have a question? Contact us</Link>
      </div>
    </div>
  );
}

export default function Donate() {
  const { actor, isAuthenticated } = usePartyAuth();
  const [mode, setMode] = useState(isAuthenticated ? "identified" : null); // null | "identified" | "login" | "guest"

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: { locationType: "district" },
  });
  const [registerDonation, { isLoading }] = useRegisterDonationMutation();
  const { data: officesRes } = useGetOfficesQuery();
  const { data: zonesRes } = useGetZonesQuery();
  const { data: districtsRes } = useGetDistrictsQuery();
  const { data: townsRes } = useGetTownAdministrationsQuery();
  const { data: branchesRes } = useGetPartyBranchsQuery();
  const [receipt, setReceipt] = useState(null);
  const [submitted, setSubmitted] = useState(null); // { id, hasReceipt } once submitted
  const [showOtherMethods, setShowOtherMethods] = useState(false);
  const [customAmount, setCustomAmount] = useState(false);

  const locationType = watch("locationType");
  const selectedZoneId = watch("zoneId");
  const amount = watch("amount");
  const districtsInZone = (districtsRes?.data ?? []).filter((d) => d.zoneId === selectedZoneId);
  const isIdentified = mode === "identified";

  function pickPreset(value) {
    setCustomAmount(false);
    setValue("amount", value, { shouldValidate: true });
  }

  useEffect(() => {
    if (isIdentified && actor) {
      reset((values) => ({ ...values, donorName: actor.fullName, phone: actor.phone || "", email: actor.email || "" }));
      // Members already have a jurisdiction on file — carry it into the submission instead of
      // asking them to pick it again.
      if (actor.districtId) {
        setValue("locationType", "district");
        setValue("districtId", actor.districtId);
        setValue("zoneId", actor.zoneId || "");
      } else if (actor.townAdministrationId) {
        setValue("locationType", "town");
        setValue("townAdministrationId", actor.townAdministrationId);
      } else if (actor.officeId) {
        setValue("locationType", "office");
        setValue("officeId", actor.officeId);
      } else if (actor.zoneId) {
        setValue("locationType", "zone");
        setValue("zoneOnlyId", actor.zoneId);
      }
    }
  }, [isIdentified, actor, reset, setValue]);

  function identifiedLocationLabel() {
    if (!actor) return null;
    if (actor.districtId) {
      const d = (districtsRes?.data ?? []).find((x) => x.id === actor.districtId);
      const z = (zonesRes?.data ?? []).find((x) => x.id === d?.zoneId);
      return d ? [d.name, z?.name].filter(Boolean).join(", ") : null;
    }
    if (actor.townAdministrationId) {
      return (townsRes?.data ?? []).find((x) => x.id === actor.townAdministrationId)?.name ?? null;
    }
    if (actor.officeId) {
      return (officesRes?.data ?? []).find((x) => x.id === actor.officeId)?.name ?? null;
    }
    if (actor.zoneId) {
      return (zonesRes?.data ?? []).find((x) => x.id === actor.zoneId)?.name ?? null;
    }
    return null;
  }

  async function onSubmit(values) {
    const formData = new FormData();
    formData.append("donorName", values.donorName);
    formData.append("phone", values.phone);
    formData.append("email", values.email || "");
    formData.append("amount", values.amount);
    formData.append("note", values.note || "");
    if (values.locationType === "district") formData.append("districtId", values.districtId || "");
    else if (values.locationType === "zone") formData.append("zoneId", values.zoneOnlyId || "");
    else if (values.locationType === "town") formData.append("townAdministrationId", values.townAdministrationId || "");
    else if (values.locationType === "office") formData.append("officeId", values.officeId || "");
    formData.append("partyBranchId", values.partyBranchId || "");
    if (receipt) formData.append("receipt", receipt);

    try {
      const res = await registerDonation(formData).unwrap();
      setSubmitted({ id: res.data.id, hasReceipt: Boolean(receipt) });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to submit donation");
    }
  }

  if (submitted) {
    return <PaymentStatusScreen donationId={submitted.id} hasReceipt={submitted.hasReceipt} />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <img src="/barwaaqo-logo.jpeg" alt="Xisbiga Barwaaqo" className="h-8 w-8 rounded-full object-cover" /> Donate to Xisbiga Barwaaqo
      </h1>
      <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">
        Support the party&apos;s work with a donation. Payments are made directly using the details below, then
        confirmed here with a receipt.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border-2 border-primary bg-primary/5 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <MonitorSmartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Online</p>
            <p className="text-sm text-[rgb(var(--fg-muted))]">You&apos;re donating here now</p>
          </div>
        </div>
        <a href="tel:+252610000001" className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))] p-4 transition-colors hover:border-primary/40">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--fg-muted))]">Phone</p>
            <p className="text-sm text-primary">+252 61 000 0001</p>
          </div>
        </a>
        <Link to="/membership/locations" className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))] p-4 transition-colors hover:border-primary/40">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--fg-muted))]">In Person</p>
            <p className="text-sm text-primary">Visit a local office</p>
          </div>
        </Link>
      </div>

      {mode === null && (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-alt))] p-6 text-center sm:flex-row sm:justify-between sm:gap-6 sm:text-left">
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm font-medium">Are you already a Xisbiga Barwaaqo member?</p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Button size="sm" onClick={() => setMode("login")}>Yes, log in</Button>
            <Button size="sm" variant="secondary" onClick={() => setMode("guest")}>
              <CircleUserRound className="h-4 w-4" /> Continue as guest
            </Button>
          </div>
        </div>
      )}

      {mode === "login" && <LoginToPrefill onDone={() => setMode("identified")} onSkip={() => setMode("guest")} />}

      {(mode === "guest" || isIdentified) && (
        <>
          <Card className="mt-6">
            <h3 className="mb-1 flex items-center gap-2 font-semibold"><Landmark className="h-5 w-5 text-primary" /> Donate</h3>
            <p className="mb-4 text-xs text-[rgb(var(--fg-muted))]">Pay to the account below, then upload your receipt so a party admin can confirm it.</p>

            <PaymentMethodCard method={PRIMARY_PAYMENT_METHOD} primary />

            <button
              type="button"
              onClick={() => setShowOtherMethods((v) => !v)}
              className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Other ways to give <ChevronDown className={cn("h-4 w-4 transition-transform", showOtherMethods && "rotate-180")} />
            </button>

            {showOtherMethods && (
              <div className="mt-3 space-y-3">
                {OTHER_PAYMENT_METHODS.map((m) => <PaymentMethodCard key={m.provider} method={m} />)}
              </div>
            )}
          </Card>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <Card>
              <h3 className="mb-4 font-semibold">Donor Information</h3>
              {isIdentified && (
                <p className="mb-4 rounded-lg bg-primary/5 px-3 py-2 text-xs text-[rgb(var(--fg-muted))]">
                  Logged in as <span className="font-medium text-[rgb(var(--fg))]">{actor?.fullName}</span> — your details are filled in below.
                </p>
              )}

              <div className="mb-4">
                <Label>Amount (ETB)</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => pickPreset(preset)}
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
                        !customAmount && Number(amount) === preset
                          ? "border-primary bg-primary text-white"
                          : "border-[rgb(var(--border))] hover:border-primary/40"
                      )}
                    >
                      {preset.toLocaleString()}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setCustomAmount(true); setValue("amount", ""); }}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
                      customAmount ? "border-primary bg-primary text-white" : "border-[rgb(var(--border))] hover:border-primary/40"
                    )}
                  >
                    Custom
                  </button>
                </div>
                {customAmount && (
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    autoFocus
                    placeholder="Enter an amount"
                    className="mt-2"
                    {...register("amount", { required: "Amount is required", min: { value: 0.01, message: "Enter a valid amount" } })}
                  />
                )}
                <FieldError>{errors.amount?.message}</FieldError>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Full Name</Label>
                  <Input readOnly={isIdentified} {...register("donorName", { required: "Full name is required" })} />
                  <FieldError>{errors.donorName?.message}</FieldError>
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input readOnly={isIdentified} {...register("phone", { required: "Phone number is required" })} />
                  <FieldError>{errors.phone?.message}</FieldError>
                </div>
                <div>
                  <Label>Email Address (optional)</Label>
                  <Input type="email" readOnly={isIdentified} {...register("email")} />
                </div>
              </div>
              <div className="mt-4">
                <Label>Note (optional)</Label>
                <Textarea rows={2} {...register("note")} />
              </div>

              <div className="mt-4">
                <Label>Payment Receipt (optional — image or PDF)</Label>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[rgb(var(--border))] py-8 text-center hover:border-primary/50 transition-colors">
                  <UploadCloud className="h-8 w-8 text-[rgb(var(--fg-muted))]" />
                  <span className="text-sm text-[rgb(var(--fg-muted))]">Click to upload your payment receipt</span>
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.gif,.pdf" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
                </label>
                {receipt && (
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-[rgb(var(--bg-alt))] px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 truncate"><FileText className="h-4 w-4 shrink-0" /> {receipt.name}</span>
                    <button type="button" onClick={() => setReceipt(null)}>
                      <X className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <h3 className="mb-4 font-semibold">Location</h3>
              {isIdentified && identifiedLocationLabel() ? (
                <div className="flex items-center gap-3 rounded-lg bg-primary/5 px-3 py-2.5 text-sm">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span>
                    Recorded from your membership: <span className="font-medium text-[rgb(var(--fg))]">{identifiedLocationLabel()}</span>
                  </span>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex flex-wrap gap-4 text-sm">
                    {[
                      ["district", "District"],
                      ["zone", "Zone (general)"],
                      ["town", "Town Administration"],
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

                </>
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
              <HeartHandshake className="h-4 w-4" /> Confirm Donation
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
