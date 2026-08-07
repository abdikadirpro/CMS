import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/Table";
import { SkeletonCard } from "../../components/ui/Skeleton";
import Button from "../../components/ui/Button";
import { ConfirmDialog, ConfirmDialogWarning } from "../../components/ui/ConfirmDialog";
import {
  useGetNotificationsQuery, useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation, useClearReadNotificationsMutation,
} from "../../app/api/notificationApi";
import { formatDateTime } from "../../lib/utils";

export default function Notifications() {
  const { data, isLoading } = useGetNotificationsQuery({ pageSize: 50 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [clearRead, { isLoading: clearing }] = useClearReadNotificationsMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const notifications = data?.data ?? [];
  const readCount = notifications.filter((n) => n.isRead).length;

  async function handleClearRead() {
    try {
      const res = await clearRead().unwrap();
      toast.success(res.message || "Read notifications cleared");
      setConfirmOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to clear notifications");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-[rgb(var(--fg-muted))]">{data?.meta?.unreadCount || 0} unread</p>
        </div>
        {notifications.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markAllRead()}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <SkeletonCard />
      ) : notifications.length === 0 ? (
        <Card><EmptyState message="No notifications yet" icon={Bell} /></Card>
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((n) => (
              <Card key={n.id} className={!n.isRead ? "border-primary/30 bg-primary/5" : ""}>
                <Link to={n.link || "#"} onClick={() => !n.isRead && markRead(n.id)} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{n.title}</p>
                      <p className="mt-0.5 text-sm text-[rgb(var(--fg-muted))]">{n.message}</p>
                    </div>
                    {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-2 text-xs text-[rgb(var(--fg-muted))]">{formatDateTime(n.createdAt)}</p>
                </Link>
              </Card>
            ))}
          </div>

          {readCount > 0 && (
            <div className="mt-4 flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)} className="text-red-400 hover:bg-red-500/10">
                <Trash2 className="h-4 w-4" /> Clear {readCount} read notification{readCount === 1 ? "" : "s"}
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleClearRead}
        loading={clearing}
        title="Clear Read Notifications"
        confirmLabel={`Clear ${readCount} Notification${readCount === 1 ? "" : "s"}`}
      >
        <p className="text-sm text-[rgb(var(--fg-muted))]">You&apos;re about to clear</p>
        <p className="mt-1 text-lg font-semibold">{readCount} read notification{readCount === 1 ? "" : "s"}</p>
        <ConfirmDialogWarning />
      </ConfirmDialog>
    </div>
  );
}
