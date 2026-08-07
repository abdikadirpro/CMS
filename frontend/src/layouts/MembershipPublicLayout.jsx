import { Link, NavLink, Outlet } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { usePartyAuth } from "../hooks/usePartyAuth";
import Button from "../components/ui/Button";

const NAV_LINKS = [
  { to: "/membership", label: "Home" },
  { to: "/membership/about", label: "About" },
  { to: "/membership/contact", label: "Contact" },
  { to: "/membership/hub", label: "Membership" },
  { to: "/membership/principles", label: "Principles" },
  { to: "/membership/donate", label: "Donate" },
];

export default function MembershipPublicLayout() {
  const [open, setOpen] = useState(false);
  const { mode, toggle } = useTheme();
  const { isAuthenticated, isMember } = usePartyAuth();

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <header className="sticky top-0 z-30 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <img src="/barwaaqo-logo.jpeg" alt="Xisbiga Barwaaqo Laantiisa DDS" className="h-10 w-10 rounded-full object-cover" />
            <span className="hidden sm:inline">Xisbiga Barwaaqo Laantiisa DDS</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/membership"}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "text-primary" : "text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))]"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <button onClick={toggle} className="rounded-lg p-2 hover:bg-[rgb(var(--bg-alt))] transition-colors" aria-label="Toggle theme">
              {mode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {isAuthenticated && isMember ? (
              <Link to="/membership/app">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/barwaaqo/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/membership/register">
                  <Button size="sm">Join</Button>
                </Link>
              </>
            )}
          </div>

          <button className="p-2 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-[rgb(var(--border))] px-4 py-3 lg:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/membership"}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-[rgb(var(--bg-alt))]"
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="mt-2 flex gap-2">
                {isAuthenticated && isMember ? (
                  <Link to="/membership/app" className="w-full">
                    <Button size="sm" className="w-full">Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/barwaaqo/login" className="w-full">
                      <Button variant="secondary" size="sm" className="w-full">Login</Button>
                    </Link>
                    <Link to="/membership/register" className="w-full">
                      <Button size="sm" className="w-full">Join</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-[rgb(var(--border))] py-10">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-[rgb(var(--fg-muted))] sm:px-6">
          <p>&copy; {new Date().getFullYear()} Xisbiga Barwaaqo Laantiisa DDS. All rights reserved.</p>
          <Link to="/" className="mt-2 inline-block text-xs text-[rgb(var(--fg-muted))] hover:text-primary hover:underline">
            Back to Xisbiga Barwaaqo Laantiisa DDS
          </Link>
        </div>
      </footer>
    </div>
  );
}
