import { Lock } from "lucide-react";
import ActivityLogTable from "./ActivityLogTable";

export default function SecurityLogs() {
  return (
    <ActivityLogTable
      title="Security Logs"
      description="Login events and account security actions across the system"
      icon={Lock}
      actionFilter="LOGIN"
    />
  );
}
