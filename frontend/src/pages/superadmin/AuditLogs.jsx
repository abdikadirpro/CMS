import { FileClock } from "lucide-react";
import ActivityLogTable from "./ActivityLogTable";

export default function AuditLogs() {
  return <ActivityLogTable title="Audit Logs" description="Full system activity trail across all admins and actions" icon={FileClock} />;
}
