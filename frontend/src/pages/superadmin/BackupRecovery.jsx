import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { DatabaseBackup, Download, PlusCircle, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Table, THead, TH, TBody, TR, TD, EmptyState } from "../../components/ui/Table";
import { SkeletonTable } from "../../components/ui/Skeleton";
import Button from "../../components/ui/Button";
import { useGetBackupsQuery, useCreateBackupMutation } from "../../app/api/adminApi";
import { selectAccessToken } from "../../app/authSlice";
import { formatDateTime } from "../../lib/utils";

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function BackupRecovery() {
  const { data, isLoading } = useGetBackupsQuery();
  const [createBackup, { isLoading: creating }] = useCreateBackupMutation();
  const accessToken = useSelector(selectAccessToken);
  const backups = data?.data ?? [];

  async function handleCreate() {
    try {
      await createBackup().unwrap();
      toast.success("Backup created successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Backup failed — ensure pg_dump is installed and on PATH");
    }
  }

  async function handleDownload(fileName) {
    try {
      const apiBase = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiBase}/api/backup/${encodeURIComponent(fileName)}/download`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download backup file");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><DatabaseBackup className="h-6 w-6 text-primary" /> Backup & Recovery</h1>
          <p className="text-sm text-[rgb(var(--fg-muted))]">Create and download full database backups (pg_dump)</p>
        </div>
        <Button onClick={handleCreate} loading={creating}><PlusCircle className="h-4 w-4" /> Create Backup Now</Button>
      </div>

      <Card className="mb-4 flex items-start gap-3 border-amber-500/30 bg-amber-500/5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <p className="text-sm text-[rgb(var(--fg-muted))]">
          Restoring a backup overwrites live data and cannot be undone automatically. Download the backup file and restore it
          manually with <code className="rounded bg-[rgb(var(--bg-alt))] px-1">psql</code> or <code className="rounded bg-[rgb(var(--bg-alt))] px-1">pg_restore</code> after
          confirming with your team — this system intentionally does not run restores with one click.
        </p>
      </Card>

      <Card className="p-0">
        <div className="p-5"><CardHeader className="mb-0"><CardTitle>Available Backups</CardTitle></CardHeader></div>
        {isLoading ? (
          <div className="p-5"><SkeletonTable /></div>
        ) : backups.length === 0 ? (
          <EmptyState message="No backups yet — create one above" icon={DatabaseBackup} />
        ) : (
          <Table>
            <THead>
              <tr><TH>File Name</TH><TH>Size</TH><TH>Created</TH><TH></TH></tr>
            </THead>
            <TBody>
              {backups.map((b) => (
                <TR key={b.fileName}>
                  <TD className="font-mono text-xs">{b.fileName}</TD>
                  <TD>{formatBytes(b.sizeBytes)}</TD>
                  <TD className="text-[rgb(var(--fg-muted))]">{formatDateTime(b.createdAt)}</TD>
                  <TD>
                    <button onClick={() => handleDownload(b.fileName)} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                      <Download className="h-4 w-4" /> Download
                    </button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
