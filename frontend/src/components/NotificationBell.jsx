import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Dropdown } from "./ui/Dropdown";
import { useGetNotificationsQuery, useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation } from "../app/api/notificationApi";
import { formatDateTime } from "../lib/utils";

export default function NotificationBell() {
  const { data } = useGetNotificationsQuery({ pageSize: 8 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const notifications = data?.data ?? [];
  const unreadCount = data?.meta?.unreadCount ?? 0;

  return (
    <Dropdown
      trigger={
        <button className="relative rounded-lg p-2 hover:bg-[rgb(var(--bg-alt))] transition-colors" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      }
      className="w-80 max-h-96 overflow-y-auto"
    >
      <div className="flex items-center justify-between px-2 py-1.5">
        <p className="text-sm font-semibold">Notifications</p>
        {unreadCount > 0 && (
          <button onClick={() => markAllRead()} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-[rgb(var(--fg-muted))]">You&apos;re all caught up</p>
      ) : (
        notifications.map((n) => (
          <Link
            key={n.id}
            to={n.link || "#"}
            onClick={() => !n.isRead && markRead(n.id)}
            className={`block rounded-lg px-3 py-2 text-sm hover:bg-[rgb(var(--bg-alt))] transition-colors ${!n.isRead ? "bg-primary/5" : ""}`}
          >
            <p className="font-medium">{n.title}</p>
            <p className="text-xs text-[rgb(var(--fg-muted))] line-clamp-2">{n.message}</p>
            <p className="mt-0.5 text-[10px] text-[rgb(var(--fg-muted))]">{formatDateTime(n.createdAt)}</p>
          </Link>
        ))
      )}
    </Dropdown>
  );
}
