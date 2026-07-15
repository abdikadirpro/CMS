import { Settings, Moon, Sun, Info } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { useTheme } from "../../hooks/useTheme";
import Button from "../../components/ui/Button";

export default function SystemSettings() {
  const { mode, toggle } = useTheme();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Settings className="h-6 w-6 text-primary" /> System Settings</h1>
        <p className="text-sm text-[rgb(var(--fg-muted))]">Platform-wide preferences and system information</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Interface Theme</p>
            <p className="text-xs text-[rgb(var(--fg-muted))]">Applies instantly across your session</p>
          </div>
          <Button variant="secondary" size="sm" onClick={toggle}>
            {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Switch to {mode === "dark" ? "Light" : "Dark"}
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>System Information</CardTitle></CardHeader>
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-[rgb(var(--fg-muted))]">Platform</dt>
          <dd className="text-right font-medium">Complaint Management System</dd>
          <dt className="text-[rgb(var(--fg-muted))]">Version</dt>
          <dd className="text-right font-medium">1.0.0</dd>
          <dt className="text-[rgb(var(--fg-muted))]">Admin Tiers</dt>
          <dd className="text-right font-medium">5 (Super, Zone, Town, District, Office)</dd>
        </dl>
      </Card>

      <Card className="flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-[rgb(var(--fg-muted))]">
          Sensitive configuration (database connection, JWT secrets, SMTP/SMS credentials) is managed through
          environment variables on the server for security and is not editable from this dashboard.
        </p>
      </Card>
    </div>
  );
}
