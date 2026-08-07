import { Link, NavLink, Outlet } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";

const NAV_LINKS = [
  { to: "/ethics", label: "Home" },
  { to: "/ethics/about", label: "About" },
  { to: "/ethics/contact", label: "Contact" },
];

export default function EthicsPublicLayout() {
  const [open, setOpen] = useState(false);
  const { mode, toggle } = useTheme();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <header className="sticky top-0 z-30 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <img src="/cms-logo.jpeg" alt="Xafiiska Koomishinka Anshaxa & Baadhista" className="h-10 w-10 rounded-full object-cover" />
            <span className="hidden sm:inline">Xafiiska Koomishinka Anshaxa</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/ethics"}
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

          <div className="hidden items-center gap-2 md:flex">
            <button onClick={toggle} className="rounded-lg p-2 hover:bg-[rgb(var(--bg-alt))] transition-colors" aria-label="Toggle theme">
              {mode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {isAuthenticated ? (
              <Link to="/app">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/ethics/get-started">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          <button className="p-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-[rgb(var(--border))] px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/ethics"}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-[rgb(var(--bg-alt))]"
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="mt-2 flex gap-2">
                {isAuthenticated ? (
                  <Link to="/app" className="w-full">
                    <Button size="sm" className="w-full">Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="w-full">
                      <Button variant="secondary" size="sm" className="w-full">Login</Button>
                    </Link>
                    <Link to="/ethics/get-started" className="w-full">
                      <Button size="sm" className="w-full">Get Started</Button>
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
          <p>&copy; {new Date().getFullYear()} Xafiiska Koomishinka Anshaxa & Baadhista Xisbiga Barwaaqo Laantiisa DDS. All rights reserved.</p>
          <Link to="/" className="mt-2 inline-block text-xs text-[rgb(var(--fg-muted))] hover:text-primary hover:underline">
            Back to Xisbiga Barwaaqo Laantiisa DDS
          </Link>
        </div>
      </footer>
    </div>
  );
}
