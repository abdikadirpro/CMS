import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { Search, UserCheck } from "lucide-react";
import { Input, FieldError } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useLazyTrackMemberQuery } from "../../app/api/memberApi";
import MembershipStatusPanel from "../../components/MembershipStatusPanel";
import { formatDate, MEMBER_STATUS_LABELS, MEMBER_STATUS_VARIANT } from "../../lib/utils";

function LocationCell({ member }) {
  return member.zone?.name || member.district?.name || member.townAdministration?.name || member.office?.name || "—";
}

export default function TrackMembershipPublic() {
  const [searchParams] = useSearchParams();
  const prefilledNumber = searchParams.get("membershipNumber") || "";
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { membershipNumber: prefilledNumber } });
  const [trackMember, { data, isFetching, isError, error }] = useLazyTrackMemberQuery();
  const [searched, setSearched] = useState(false);

  function onSubmit(values) {
    setSearched(true);
    trackMember(values.membershipNumber.trim());
  }

  useEffect(() => {
    if (prefilledNumber) {
      setSearched(true);
      trackMember(prefilledNumber.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledNumber]);

  const member = data?.data;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <UserCheck className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold">Track Your Membership</h1>
        <p className="mt-2 text-[rgb(var(--fg-muted))]">Enter your membership number to see your registration status.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto mt-8 flex max-w-md gap-2">
        <div className="flex-1">
          <Input placeholder="e.g. XB-2026-AB12CD34" {...register("membershipNumber", { required: "Membership number is required" })} />
          <FieldError>{errors.membershipNumber?.message}</FieldError>
        </div>
        <Button type="submit" loading={isFetching}>
          <Search className="h-4 w-4" /> Track
        </Button>
      </form>

      {searched && isError && (
        <p className="mt-6 text-center text-sm text-red-400">{error?.data?.message || "No membership found with that number"}</p>
      )}

      {member && (
        <Card className="mt-8">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-[rgb(var(--fg-muted))]">{member.membershipNumber}</p>
              <h3 className="text-lg font-semibold">{member.fullName}</h3>
            </div>
            <Badge variant={MEMBER_STATUS_VARIANT[member.status]}>{MEMBER_STATUS_LABELS[member.status]}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-[rgb(var(--fg-muted))]">
            <p>Registered: <span className="font-medium text-[rgb(var(--fg))]">{formatDate(member.createdAt)}</span></p>
            <p>Location: <span className="font-medium text-[rgb(var(--fg))]"><LocationCell member={member} /></span></p>
            {member.partyBranch?.name && <p>Party Branch: <span className="font-medium text-[rgb(var(--fg))]">{member.partyBranch.name}</span></p>}
          </div>

          <div className="mt-6 border-t border-[rgb(var(--border))] pt-6">
            <MembershipStatusPanel member={member} />
          </div>
        </Card>
      )}
    </div>
  );
}
