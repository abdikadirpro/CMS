import { Link } from "react-router-dom";
import { Scale, Users, FileEdit, ShieldCheck, ClipboardList, BookOpenText, ArrowRight, Info } from "lucide-react";
import { Card } from "../../components/ui/Card";

// Drawn directly from the Prosperity Party By-Laws: Rules & Principles (Article 8, paragraph 4),
// Membership (Article 10), Applying for Membership (Article 11), Rights of Members (Article 12),
// and Duties of Members (Article 13).
const SECTIONS = [
  {
    icon: Scale,
    heading: "Rules & Principles",
    article: "Article 8",
    body: "The party operates under the laws of the country and its own by-law, which every member has a duty to implement, respect, and uphold. Every member has an equal say and a single vote, and decisions are reached collectively through democratic deliberation and consensus wherever possible, falling back to a majority vote (more than 50%) when they cannot be.",
  },
  {
    icon: Users,
    heading: "Membership",
    article: "Article 10",
    body: "Any Ethiopian citizen may become a member who is willing to accept and uphold the party's by-law, has good discipline and standing among the public, believes in national unity and unity in diversity, serves the public interest impartially, is 18 years of age or older, and is not a member of another party.",
  },
  {
    icon: FileEdit,
    heading: "Applying for Membership",
    article: "Article 11",
    body: "A citizen who wishes to join submits a membership application letter to their nearest party office. Approved applicants remain a candidate for up to six months while the party cell reviews their performance before confirming full membership.",
  },
  {
    icon: ShieldCheck,
    heading: "Rights of Members",
    article: "Article 12",
    body: "Full members have the right to elect and be elected at every level of the party, participate in and vote at party assemblies, raise evidence-based critiques, bring concerns to the appropriate party body, and resign at any time by returning party property.",
  },
  {
    icon: ClipboardList,
    heading: "Duties of Members",
    article: "Article 13",
    body: "Members are expected to know, respect, and help implement the party's by-law and decisions; uphold party rules, values, and discipline; respect the country's laws; pay membership fees; and protect party property.",
  },
];

export default function Principles() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          <BookOpenText className="h-3.5 w-3.5" /> Prosperity Party By-Laws
        </span>
        <h1 className="text-3xl font-bold">Principles</h1>
        <p className="mt-3 text-[rgb(var(--fg-muted))]">
          What Xisbiga Barwaaqo Laantiisa DDS stands for, and what it expects from its members.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Card
            key={s.heading}
            className="group flex cursor-default gap-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{s.heading}</h3>
                <span className="text-xs font-medium uppercase tracking-wide text-primary/70">{s.article}</span>
              </div>
              <p className="mt-1 text-sm text-[rgb(var(--fg-muted))]">{s.body}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-alt))] p-8 text-center sm:flex-row sm:justify-center sm:gap-6">
        <Info className="h-6 w-6 shrink-0 text-primary" />
        <p className="text-sm text-[rgb(var(--fg-muted))]">Want the full story behind the party?</p>
        <div className="flex shrink-0 gap-3">
          <Link to="/membership/about" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            About the Party <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/membership/contact" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            Contact Us <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
