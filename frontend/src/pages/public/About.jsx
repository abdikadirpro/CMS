import { Target, Eye, Layers } from "lucide-react";
import { Card } from "../../components/ui/Card";

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold">About the Complaint Management System</h1>
      <p className="mt-4 text-[rgb(var(--fg-muted))]">
        The Complaint Management System (CMS) is an enterprise platform that connects citizens directly to the
        administrative structures responsible for resolving their concerns — from local offices up through
        district, town administration, zone, and national oversight.
      </p>
      <p className="mt-4 text-[rgb(var(--fg-muted))]">
        Every complaint submitted through CMS is assigned a unique tracking ID, routed to the correct jurisdiction,
        and monitored through a transparent status pipeline until it is resolved — with a full audit trail at every step.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card>
          <Target className="mb-3 h-8 w-8 text-primary" />
          <h3 className="mb-1.5 font-semibold">Our Mission</h3>
          <p className="text-sm text-[rgb(var(--fg-muted))]">Give every citizen a direct, trackable channel to raise concerns and see them resolved.</p>
        </Card>
        <Card>
          <Eye className="mb-3 h-8 w-8 text-primary" />
          <h3 className="mb-1.5 font-semibold">Transparency</h3>
          <p className="text-sm text-[rgb(var(--fg-muted))]">Full visibility into complaint status, transfers, and resolution history at every stage.</p>
        </Card>
        <Card>
          <Layers className="mb-3 h-8 w-8 text-primary" />
          <h3 className="mb-1.5 font-semibold">Structured Hierarchy</h3>
          <p className="text-sm text-[rgb(var(--fg-muted))]">Super Admins, Zone, Town, District, and Office Admins each manage their own jurisdiction.</p>
        </Card>
      </div>
    </div>
  );
}
