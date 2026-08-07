import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, Target, HeartHandshake, ShieldCheck, Flag, ArrowRight } from "lucide-react";
import { Card } from "../../components/ui/Card";
import AboutSubnav from "../../components/AboutSubnav";

// Vision, Mission, Values, and the symbol's meaning are drawn directly from Article 4 and
// Article 8 of the Prosperity Party By-Laws. Party History is still placeholder — replace with
// the branch's actual founding story and milestones before launch.
const WHO_WE_ARE = [
  {
    icon: Eye,
    heading: "Our Vision",
    body: "Building a country with a strong government, democracy, and broad acceptance; inclusive economic development that ensures equal benefit for all; social development that secures general prosperity; and a foreign policy rooted in the nation's interest and sovereignty.",
  },
  {
    icon: Target,
    heading: "Our Mission",
    body: "Appealing to the people's interest; upholding democracy and the rule of law; driving development with equal benefit for all; and strengthening national unity and multi-nationalism.",
  },
  {
    icon: HeartHandshake,
    heading: "Our Values",
    body: "Respect for citizens and peoples, truth, fraternity, mutual respect and tolerance, and unity in diversity.",
  },
  {
    icon: Flag,
    heading: "Our Symbol",
    body: "The party's logo depicts the idea of multi-nationalism, national unity, national pride, peace, democracy, and prosperity.",
  },
];

const HISTORY = [
  { date: "[Placeholder — date]", title: "[Placeholder — founding of the branch]", body: "[Placeholder — insert the founding story of Xisbiga Barwaaqo Laantiisa DDS here.]" },
  { date: "[Placeholder — date]", title: "[Placeholder — a major milestone]", body: "[Placeholder — insert a key milestone, e.g. a coalition, expansion, or election result.]" },
  { date: "[Placeholder — date]", title: "[Placeholder — a recent milestone]", body: "[Placeholder — insert the branch's most recent achievement or milestone.]" },
];

function Timeline() {
  return (
    <div className="relative">
      <div className="absolute bottom-0 left-4 top-0 w-px bg-[rgb(var(--border))] sm:left-1/2" />
      <div className="space-y-10">
        {HISTORY.map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4 }}
            className={`relative flex items-start gap-5 sm:w-1/2 ${i % 2 === 1 ? "sm:ml-auto sm:flex-row-reverse sm:text-right" : ""}`}
          >
            <span className="absolute left-4 top-1 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-primary bg-[rgb(var(--bg))] sm:left-0 sm:right-0 sm:mx-auto" />
            <div className="ml-10 sm:ml-0 sm:w-full sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{h.date}</p>
              <h3 className="mt-1 font-semibold">{h.title}</h3>
              <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">{h.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function MembershipAbout() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold">About Xisbiga Barwaaqo Laantiisa DDS</h1>
        <p className="mt-3 text-[rgb(var(--fg-muted))]">
          Xisbiga Barwaaqo Laantiisa DDS is a political party organized around local membership, community engagement, and accountable leadership.
        </p>
      </div>

      <div className="mt-8">
        <AboutSubnav />
      </div>

      <div className="mt-14">
        <h2 className="mb-6 text-center text-2xl font-bold">Who We Are</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {WHO_WE_ARE.map((w) => (
            <Card
              key={w.heading}
              className="group flex cursor-default gap-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                <w.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold">{w.heading}</h3>
                <p className="text-sm text-[rgb(var(--fg-muted))]">{w.body}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <h2 className="mb-10 text-center text-2xl font-bold">Party History</h2>
        <Timeline />
      </div>

      <div className="mt-16 flex flex-col items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-alt))] p-8 text-center sm:flex-row sm:justify-center sm:gap-6">
        <ShieldCheck className="h-6 w-6 shrink-0 text-primary" />
        <p className="text-sm text-[rgb(var(--fg-muted))]">Want to know what the party stands for, and what it expects from its members?</p>
        <div className="flex shrink-0 gap-3">
          <Link to="/membership/principles" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Our Principles <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/membership/contact" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Contact Us <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
