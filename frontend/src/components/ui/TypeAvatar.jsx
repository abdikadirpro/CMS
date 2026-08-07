export function initials(name) {
  return (name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

/** Circular initials avatar, colored by a per-type style ({ className }) supplied by the caller. */
export function TypeAvatar({ name, style }) {
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${style.className}`}>
      {initials(name)}
    </span>
  );
}

/** Icon + label pill, colored by a per-type style ({ icon, className }) supplied by the caller. */
export function TypeBadge({ label, style }) {
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.className}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}
