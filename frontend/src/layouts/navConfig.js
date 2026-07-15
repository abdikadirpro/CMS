import {
  LayoutDashboard, FilePlus, ClipboardList, Bell, UserCog, ArrowLeftRight,
  BarChart3, Users, MapPin, Globe, Building2, Landmark, Tag, Shield, Key,
  FileClock, Lock, DatabaseBackup, Settings,
} from "lucide-react";

export function getNavItems(actor) {
  if (!actor) return [];

  if (actor.type === "USER") {
    return [
      { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/app/submit", label: "Submit Complaint", icon: FilePlus },
      { to: "/app/complaints", label: "My Complaints", icon: ClipboardList },
      { to: "/app/notifications", label: "Notifications", icon: Bell },
      { to: "/app/profile", label: "Profile Settings", icon: UserCog },
    ];
  }

  const base = [
    { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/app/complaints", label: "Complaint Management", icon: ClipboardList },
    { to: "/app/transfers", label: "Transfer Management", icon: ArrowLeftRight },
    { to: "/app/reports", label: "Reports & Analytics", icon: BarChart3 },
    { to: "/app/users", label: "User Management", icon: Users },
  ];

  if (actor.adminType === "ZONE_ADMIN") {
    base.push({ to: "/app/districts", label: "District Management", icon: MapPin });
  }

  if (actor.adminType === "SUPER_ADMIN") {
    base.push(
      { to: "/app/zones", label: "Zone Management", icon: Globe },
      { to: "/app/districts", label: "District Management", icon: MapPin },
      { to: "/app/town-administrations", label: "Town Administration", icon: Building2 },
      { to: "/app/offices", label: "Office Management", icon: Landmark },
      { to: "/app/categories", label: "Categories", icon: Tag },
      { to: "/app/admins", label: "Admin Control Center", icon: Shield },
      { to: "/app/permissions", label: "Permission Management", icon: Key },
      { to: "/app/audit-logs", label: "Audit Logs", icon: FileClock },
      { to: "/app/security-logs", label: "Security Logs", icon: Lock },
      { to: "/app/backup", label: "Backup & Recovery", icon: DatabaseBackup },
      { to: "/app/settings", label: "System Settings", icon: Settings }
    );
  }

  base.push({ to: "/app/notifications", label: "Notifications", icon: Bell }, { to: "/app/profile", label: "Profile Settings", icon: UserCog });

  return base;
}
