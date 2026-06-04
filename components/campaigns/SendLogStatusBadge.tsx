import { cn } from "@/lib/utils";
import type { SendLogStatus } from "@/lib/types/send-log";

const statusStyles: Record<SendLogStatus, string> = {
  sent: "bg-pending/15 text-pending",
  failed: "bg-danger/15 text-danger",
  cancelled: "bg-zinc-500/15 text-zinc-400",
  pending: "bg-zinc-500/10 text-muted",
};

const statusLabels: Record<SendLogStatus, string> = {
  sent: "Sent",
  failed: "Failed",
  cancelled: "Cancelled",
  pending: "Pending",
};

export function SendLogStatusBadge({ status }: { status: SendLogStatus }) {
  const normalized = status in statusStyles ? status : "pending";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        statusStyles[normalized]
      )}
    >
      {statusLabels[normalized]}
    </span>
  );
}
