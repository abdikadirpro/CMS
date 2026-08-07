import { Printer } from "lucide-react";
import Button from "./ui/Button";
import { formatDate } from "../lib/utils";

function LocationCell({ member }) {
  return member.zone?.name || member.district?.name || member.townAdministration?.name || member.office?.name || "—";
}

/** Digital membership card for a Full Member — on-screen, with a browser-print button. The
 * .printable-card class is targeted by the global @media print rule so only the card shows up
 * when printed (or saved as PDF via the browser's print dialog). */
export default function MembershipCard({ member }) {
  return (
    <div>
      <div className="printable-card mx-auto max-w-md overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-[rgb(var(--bg-alt))] to-[rgb(var(--bg-alt))] p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <img src="/barwaaqo-logo.jpeg" alt="Xisbiga Barwaaqo" className="h-12 w-12 rounded-full border border-primary/30 object-cover" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Xisbiga Barwaaqo Laantiisa DDS</p>
            <p className="text-sm font-semibold">Digital Membership Card</p>
          </div>
        </div>

        <div className="mt-5 space-y-1">
          <p className="text-xl font-bold">{member.fullName}</p>
          <p className="font-mono text-sm text-[rgb(var(--fg-muted))]">{member.membershipNumber}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-primary/20 pt-4 text-sm">
          <div>
            <p className="text-xs text-[rgb(var(--fg-muted))]">Location</p>
            <p className="font-medium"><LocationCell member={member} /></p>
          </div>
          <div>
            <p className="text-xs text-[rgb(var(--fg-muted))]">Status</p>
            <p className="font-medium">Full Member</p>
          </div>
          <div>
            <p className="text-xs text-[rgb(var(--fg-muted))]">Member Since</p>
            <p className="font-medium">{formatDate(member.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-[rgb(var(--fg-muted))]">Valid Until</p>
            <p className="font-medium">{formatDate(member.membershipExpiresAt)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </Button>
      </div>
    </div>
  );
}
