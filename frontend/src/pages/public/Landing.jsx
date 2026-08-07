import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Search, BarChart3, Bell, ArrowRight } from "lucide-react";
import Button from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

const FEATURES = [
  { icon: ShieldCheck, title: "Secure & Role-Based", desc: "JWT authentication with fine-grained RBAC across every admin tier, from office to super admin." },
  { icon: Search, title: "Full Transparency", desc: "Track any complaint or membership status in real time with a unique tracking ID." },
  { icon: BarChart3, title: "Live Analytics", desc: "Interactive dashboards break down activity by status, category, zone, and district." },
  { icon: Bell, title: "Real-Time Alerts", desc: "Instant notifications the moment your case or membership status changes." },
];

export default function Landing() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 py-24 sm:px-6">
        <img
          src="/pm.jpg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgb(var(--bg))]/55 via-[rgb(var(--bg))]/75 to-[rgb(var(--bg))]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Welcome to the Official Digital Platform of <span className="text-primary">Xisbiga Barwaaqo Laantiisa DDS.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-[rgb(var(--fg-muted))]">
              File and track complaints, join the Prosperity Party, and access digital services through a secure, transparent system serving regional offices, zones, districts, and town administrations.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/ethics">
                <Button size="lg">
                  Ethics &amp; Investigation <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/membership">
                <Button size="lg" variant="secondary" className="border-[rgb(var(--fg))]/20 bg-[rgb(var(--bg))]/80 backdrop-blur-sm hover:bg-[rgb(var(--bg))]">
                  Membership Portal
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold">Built for scale and accountability</h2>
          <p className="mt-2 text-[rgb(var(--fg-muted))]">A four-tier admin hierarchy keeps every complaint moving to the right desk.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
          <h2 className="text-2xl font-bold">Ready to be heard?</h2>
          <p className="mx-auto mt-2 max-w-xl text-[rgb(var(--fg-muted))]">
            Whether you want to file a complaint or join Xisbiga Barwaaqo as a member, get started in a few minutes.
          </p>
          <Link to="/get-started" className="mt-6 inline-block">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
