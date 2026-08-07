import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, HeartHandshake } from "lucide-react";

const PLATFORMS = [
  {
    to: "/ethics",
    logo: "/cms-logo.jpeg",
    title: "Xafiiska Koomishinka Anshaxa",
    subtitle: "Ethics & Investigation",
    desc: "Submit complaints, upload evidence, and track resolution across zones, districts, town administrations, and offices — including anonymous complaints.",
    cta: "Continue to Ethics Office",
  },
  {
    to: "/membership",
    logo: "/barwaaqo-logo.jpeg",
    title: "Xisbiga Barwaaqo",
    subtitle: "Party Membership",
    desc: "Register for free as a party member, verify your status, renew your membership, and explore the party's principles and programs.",
    cta: "Continue to Membership Portal",
  },
];

export default function GetStarted() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">Choose a platform</h1>
        <p className="mt-2 text-[rgb(var(--fg-muted))]">Each platform has its own registration and its own hierarchy. Pick the one you want to get started with.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {PLATFORMS.map((p, i) => (
          <motion.div
            key={p.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Link
              to={p.to}
              className="group relative flex h-full min-h-[19rem] flex-col overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-8 shadow-md shadow-black/5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10"
            >
              {/* Logo fills the entire card as a full-bleed background, aligned to the top so the
                  emblem sits in the clear zone and its lower wordmark falls under the scrim */}
              <img
                src={p.logo}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover object-top opacity-40 transition-all duration-500 ease-out group-hover:scale-110 group-hover:opacity-60"
              />
              {/* Gradient scrim: near-clear at the top so the symbol reads, mostly solid by the bottom to hide the logo's own text — capped below full opacity so it never reads as black */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-10% via-[rgb(var(--card))]/55 via-45% to-[rgb(var(--card))]/85 to-75%" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/[0.08] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              {/* Content */}
              <div className="relative flex h-full flex-col">
                <div className="mb-5 h-14 w-14 overflow-hidden rounded-full border border-primary/20 shadow-sm ring-4 ring-[rgb(var(--bg))] transition-transform duration-300 group-hover:scale-105">
                  <img src={p.logo} alt={p.title} className="h-full w-full object-cover" />
                </div>
                <h2 className="text-lg font-semibold">{p.title}</h2>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">{p.subtitle}</p>
                <p className="flex-1 text-sm text-[rgb(var(--fg-muted))]">{p.desc}</p>

                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary">
                  {p.cta}
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 transition-all duration-300 group-hover:bg-primary group-hover:text-white">
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-[rgb(var(--fg-muted))]">
          Not ready to join as a member, but want to help out?{" "}
          <Link to="/volunteer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            <HeartHandshake className="h-4 w-4" /> Sign up to volunteer
          </Link>
        </p>
      </div>
    </div>
  );
}
