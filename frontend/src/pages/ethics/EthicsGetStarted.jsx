import { Link } from "react-router-dom";
import { UserPlus, FilePlus, EyeOff, Search, BookOpen, ArrowRight } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../hooks/useAuth";

export default function EthicsGetStarted() {
  const { isAuthenticated } = useAuth();

  const OPTIONS = [
    {
      to: "/ethics/register",
      icon: UserPlus,
      title: "Create an Account",
      desc: "Sign up for a free citizen account to submit, track, and manage all your complaints from one dashboard.",
      cta: "Sign Up",
    },
    {
      // Filing under your own name requires an account — send signed-out visitors to sign up
      // first instead of straight to the form.
      to: isAuthenticated ? "/submit" : "/ethics/register",
      icon: FilePlus,
      title: "Submit a Complaint",
      desc: isAuthenticated
        ? "File a complaint under your name and track it from your dashboard."
        : "Create a free account first, then file a complaint under your name and track it from your dashboard.",
      cta: isAuthenticated ? "Submit Now" : "Sign Up to Submit",
    },
    {
      to: "/submit?anonymous=true",
      icon: EyeOff,
      title: "Submit an Anonymous Complaint",
      desc: "File a complaint without providing your identity. You'll still receive a tracking ID to check on its status.",
      cta: "Submit Anonymously",
    },
    {
      to: "/track",
      icon: Search,
      title: "Track Complaint Status",
      desc: "Already filed a complaint? Enter your tracking ID to see its current status and history.",
      cta: "Track a Complaint",
    },
    {
      to: "/ethics/about#process",
      icon: BookOpen,
      title: "Learn the Complaint Process",
      desc: "Understand how complaints are received, investigated, and resolved before you file one.",
      cta: "Learn More",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">Get Started</h1>
        <p className="mt-2 text-[rgb(var(--fg-muted))]">Choose how you&apos;d like to proceed.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {OPTIONS.map((o) => (
          <Link key={o.title} to={o.to} className="group">
            <Card className="flex h-full flex-col transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                <o.icon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">{o.title}</h2>
              <p className="mt-2 flex-1 text-sm text-[rgb(var(--fg-muted))]">{o.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                {o.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
