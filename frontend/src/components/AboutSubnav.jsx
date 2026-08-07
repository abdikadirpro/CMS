import { NavLink } from "react-router-dom";
import { History, Users, MapPin } from "lucide-react";
import { cn } from "../lib/utils";

// Mirrors UDA's "About Us" submenu (History & Values / Our Team / Our Locations) — shown at the
// top of each of the three related Membership pages.
const LINKS = [
  { to: "/membership/about", label: "History & Values", icon: History, end: true },
  { to: "/membership/team", label: "Our Team", icon: Users },
  { to: "/membership/locations", label: "Our Locations", icon: MapPin },
];

export default function AboutSubnav() {
  return (
    <nav className="mx-auto mb-12 flex max-w-md flex-wrap justify-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg-alt))] p-1.5">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              isActive ? "bg-primary text-white" : "text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))]"
            )
          }
        >
          <link.icon className="h-4 w-4" /> {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
