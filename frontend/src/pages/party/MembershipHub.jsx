import { Link } from "react-router-dom";
import { UserPlus, Search, RefreshCw, IdCard, UserCog, ArrowRight } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { usePartyAuth } from "../../hooks/usePartyAuth";

export default function MembershipHub() {
  const { isAuthenticated, isMember } = usePartyAuth();
  const loggedInAsMember = isAuthenticated && isMember;

  const OPTIONS = [
    {
      to: "/membership/register",
      icon: UserPlus,
      title: "Register",
      desc: "Not a member yet? Sign up for free.",
      cta: "Register Now",
      always: true,
    },
    {
      to: "/membership/track",
      icon: Search,
      title: "Verify Status",
      desc: "Look up any membership by its membership number.",
      cta: "Verify Status",
      always: true,
    },
    {
      to: loggedInAsMember ? "/membership/app" : "/barwaaqo/login",
      icon: RefreshCw,
      title: "Renew Membership",
      desc: loggedInAsMember ? "Renew your membership for another year from your dashboard." : "Log in to renew your membership.",
      cta: loggedInAsMember ? "Go to Dashboard" : "Log In to Renew",
    },
    {
      to: loggedInAsMember ? "/membership/app" : "/barwaaqo/login",
      icon: IdCard,
      title: "Digital Membership Card",
      desc: loggedInAsMember ? "View and print your digital membership card." : "Log in to view your membership card.",
      cta: loggedInAsMember ? "View My Card" : "Log In to View Card",
    },
    {
      to: loggedInAsMember ? "/membership/app" : "/barwaaqo/login",
      icon: UserCog,
      title: "Update Your Information",
      desc: loggedInAsMember ? "Keep your name, phone, and email up to date." : "Log in to update your personal information.",
      cta: loggedInAsMember ? "Update Info" : "Log In to Update",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">Membership</h1>
        <p className="mt-2 text-[rgb(var(--fg-muted))]">Everything you need to manage your Xisbiga Barwaaqo membership.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
