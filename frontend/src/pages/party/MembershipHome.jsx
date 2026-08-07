import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, HeartHandshake, Flag, ArrowRight, MapPin, Building2, HeartPulse, GraduationCap, TrendingUp, Landmark, Leaf, Scale } from "lucide-react";
import Button from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

const FEATURES = [
  { icon: Users, title: "Open Membership", desc: "Any eligible citizen can register as a member, free of charge, from anywhere in the country." },
  { icon: Flag, title: "Local Party Branches", desc: "Members are organized by zone, district, town administration, or office, and by party branch." },
  { icon: HeartHandshake, title: "Get Involved", desc: "Volunteer, donate, or take part in local party activities without needing to be a full member." },
];

// Generic placeholder policy pillars — replace with the party's actual platform positions before launch.
const FOCUS_AREAS = [
  { icon: HeartPulse, title: "Healthcare", desc: "Expanding access to quality, affordable healthcare from local clinics to regional hospitals." },
  { icon: GraduationCap, title: "Education", desc: "Investing in schools, teachers, and vocational training so every young person has a path forward." },
  { icon: TrendingUp, title: "Economy", desc: "Supporting small businesses, job creation, and fair economic opportunity across every district." },
  { icon: Scale, title: "Judicial Reforms", desc: "Advocating for a fair, independent justice system that protects the rights of every citizen." },
  { icon: Leaf, title: "Environment", desc: "Protecting natural resources and building resilience against environmental challenges." },
  { icon: Landmark, title: "Governance", desc: "Promoting transparent, accountable leadership at every level of the party and government." },
];

export default function MembershipHome() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 py-24 sm:px-6">
        <img
          src="/one-background.jpeg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgb(var(--bg))]/55 via-[rgb(var(--bg))]/75 to-[rgb(var(--bg))]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              Xisbiga Barwaaqo Laantiisa DDS
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Join Today. <span className="text-primary">Lead Tomorrow.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-[rgb(var(--fg-muted))]">
              Become a member of the Prosperity Party and contribute to building a stronger, more united future
              through active participation, responsible leadership, and community service.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/membership/register">
                <Button size="lg">
                  Join the Party <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/membership/hub">
                <Button size="lg" variant="secondary">Explore Membership</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold">Our Focus Areas</h2>
          <p className="mt-2 text-[rgb(var(--fg-muted))]">The priorities that guide the party&apos;s work at every level.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FOCUS_AREAS.map((f) => (
            <Card
              key={f.title}
              className="group cursor-default transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-semibold">{f.title}</h3>
              <p className="text-sm text-[rgb(var(--fg-muted))]">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <Card
              key={f.title}
              className="group cursor-default transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-semibold">{f.title}</h3>
              <p className="text-sm text-[rgb(var(--fg-muted))]">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6">
        <div className="glass-panel mx-auto max-w-4xl rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold">Ready to get involved?</h2>
          <p className="mx-auto mt-2 max-w-xl text-[rgb(var(--fg-muted))]">
            Registration is free. New members become eligible for full membership after six months.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/membership/register">
              <Button size="lg">Join Now</Button>
            </Link>
            <Link to="/volunteer">
              <Button size="lg" variant="secondary">
                <MapPin className="h-4 w-4" /> Volunteer Instead
              </Button>
            </Link>
            <Link to="/membership/donate">
              <Button size="lg" variant="secondary">
                <Building2 className="h-4 w-4" /> Donate
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
