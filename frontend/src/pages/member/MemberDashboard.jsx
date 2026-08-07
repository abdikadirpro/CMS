import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { Bell, AlertTriangle, RefreshCw, Save } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Input, Label, FieldError } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { SkeletonCard } from "../../components/ui/Skeleton";
import { usePartyAuth } from "../../hooks/usePartyAuth";
import { useGetOwnProfileQuery, useUpdateOwnProfileMutation, useRenewMembershipMutation } from "../../app/api/memberSelfApi";
import { setCredentials } from "../../app/partyAuthSlice";
import MembershipStatusPanel from "../../components/MembershipStatusPanel";
import MembershipCard from "../../components/MembershipCard";
import { MEMBER_STATUS_LABELS, MEMBER_STATUS_VARIANT, formatDate } from "../../lib/utils";

function LocationCell({ member }) {
  return member.zone?.name || member.district?.name || member.townAdministration?.name || member.office?.name || "—";
}

export default function MemberDashboard() {
  const { actor } = usePartyAuth();
  const dispatch = useDispatch();
  const { data, isLoading, refetch } = useGetOwnProfileQuery(undefined, { skip: !actor });
  const member = data?.data;

  const [renewMembership, { isLoading: isRenewing }] = useRenewMembershipMutation();
  const [updateOwnProfile, { isLoading: isSaving }] = useUpdateOwnProfileMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (member) reset({ fullName: member.fullName, phone: member.phone, email: member.email || "" });
  }, [member, reset]);

  if (isLoading || !member) return <SkeletonCard />;

  const isExpired = member.status === "FULL" && member.membershipExpiresAt && new Date(member.membershipExpiresAt) < new Date();

  async function handleRenew() {
    try {
      await renewMembership().unwrap();
      toast.success("Membership renewed for another year");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to renew membership");
    }
  }

  async function onProfileSubmit(values) {
    try {
      const res = await updateOwnProfile(values).unwrap();
      dispatch(setCredentials({ actor: { ...actor, ...res.data } }));
      toast.success("Profile updated");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update profile");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {member.fullName}</h1>
        <p className="text-sm text-[rgb(var(--fg-muted))]">Membership #{member.membershipNumber}</p>
      </div>

      {isExpired && (
        <Card className="border-rose-500/40 bg-rose-500/10">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-rose-400" />
              <div>
                <p className="text-sm font-semibold text-rose-400">Your membership has expired</p>
                <p className="text-xs text-[rgb(var(--fg-muted))]">It expired on {formatDate(member.membershipExpiresAt)}. Renew to stay in good standing.</p>
              </div>
            </div>
            <Button size="sm" loading={isRenewing} onClick={handleRenew}>
              <RefreshCw className="h-4 w-4" /> Renew Now
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex items-start justify-between gap-3">
          <CardTitle>Membership Status</CardTitle>
          <Badge variant={MEMBER_STATUS_VARIANT[member.status]}>{MEMBER_STATUS_LABELS[member.status]}</Badge>
        </div>
        <MembershipStatusPanel member={member} />

        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-[rgb(var(--fg-muted))] sm:grid-cols-2">
          <p>Registered: <span className="font-medium text-[rgb(var(--fg))]">{formatDate(member.createdAt)}</span></p>
          <p>Location: <span className="font-medium text-[rgb(var(--fg))]"><LocationCell member={member} /></span></p>
          {member.partyBranch?.name && (
            <p>Party Branch: <span className="font-medium text-[rgb(var(--fg))]">{member.partyBranch.name}</span></p>
          )}
          {member.status === "FULL" && !isExpired && (
            <p>Valid Until: <span className="font-medium text-[rgb(var(--fg))]">{formatDate(member.membershipExpiresAt)}</span></p>
          )}
        </div>

        {member.status === "FULL" && !isExpired && (
          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="ghost" loading={isRenewing} onClick={handleRenew}>
              <RefreshCw className="h-4 w-4" /> Renew Early
            </Button>
          </div>
        )}
      </Card>

      {member.status === "FULL" && (
        <Card>
          <CardHeader><CardTitle>Digital Membership Card</CardTitle></CardHeader>
          <MembershipCard member={member} />
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Update My Information</CardTitle></CardHeader>
        <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
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
            <div className="sm:col-span-2">
              <Label>Email Address</Label>
              <Input type="email" {...register("email", { required: "Email is required" })} />
              <FieldError>{errors.email?.message}</FieldError>
            </div>
          </div>
          <Button type="submit" loading={isSaving}>
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <div className="flex flex-col items-center gap-2 py-8 text-center text-[rgb(var(--fg-muted))]">
          <Bell className="h-8 w-8" />
          <p className="text-sm">No notifications yet</p>
        </div>
      </Card>
    </div>
  );
}
