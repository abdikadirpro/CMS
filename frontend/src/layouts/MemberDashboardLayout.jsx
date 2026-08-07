import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, X, Moon, Sun, LogOut, ChevronDown, LayoutDashboard } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { usePartyAuth } from "../hooks/usePartyAuth";
import { usePartyLogoutMutation } from "../app/api/partyAuthApi";
import { useDispatch } from "react-redux";
import { logout as logoutAction } from "../app/partyAuthSlice";
import { Dropdown, DropdownItem } from "../components/ui/Dropdown";

export default function MemberDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { mode, toggle } = useTheme();
  const { actor } = usePartyAuth();
  const [logoutMutation] = usePartyLogoutMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logoutMutation();
    } finally {
      dispatch(logoutAction());
      navigate("/barwaaqo/login");
    }
  }

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--bg-alt))] transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[rgb(var(--border))] px-5">
          <div className="flex items-center gap-2 font-bold">
            <img src="/barwaaqo-logo.jpeg" alt="Xisbiga Barwaaqo" className="h-9 w-9 rounded-full object-cover" />
            <span className="truncate text-sm">Barwaaqo</span>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <div className="flex items-center gap-3 rounded-lg bg-primary/15 px-3 py-2.5 text-sm font-medium text-primary">
            <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />
            <span className="truncate">Dashboard</span>
          </div>
        </nav>

        <div className="border-t border-[rgb(var(--border))] p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4.5 w-4.5" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]/80 px-4 backdrop-blur-md sm:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <div className="hidden text-sm text-[rgb(var(--fg-muted))] lg:block">Member Portal</div>

          <div className="flex items-center gap-1.5">
            <button onClick={toggle} className="rounded-lg p-2 hover:bg-[rgb(var(--bg-alt))] transition-colors" aria-label="Toggle theme">
              {mode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[rgb(var(--bg-alt))] transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {actor?.fullName?.[0]?.toUpperCase() || "M"}
                  </div>
                  <ChevronDown className="h-4 w-4 hidden sm:block" />
                </button>
              }
            >
              <div className="px-3 py-2">
                <p className="truncate text-sm font-semibold">{actor?.fullName}</p>
                <p className="truncate text-xs text-[rgb(var(--fg-muted))]">{actor?.membershipNumber}</p>
              </div>
              <DropdownItem onClick={handleLogout} className="text-red-400">
                <LogOut className="h-4 w-4" /> Logout
              </DropdownItem>
            </Dropdown>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
