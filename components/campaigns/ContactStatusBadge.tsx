import { cn } from "@/lib/utils";
import type { ContactStatus } from "@/lib/types/contact";

const statusStyles: Record<ContactStatus, string> = {
  not_started: "bg-zinc-500/15 text-zinc-400",
  queued: "bg-amber-500/15 text-amber-400",
  sent: "bg-pending/15 text-pending",
  opened: "bg-blue-500/15 text-blue-400",
  replied: "bg-success/15 text-success",
  bounced: "bg-danger/15 text-danger",
  unsubscribed: "bg-zinc-500/10 text-muted",
};

const statusLabels: Record<ContactStatus, string> = {
  not_started: "Not started",
  queued: "Queued",
  sent: "Sent",
  opened: "Opened",
  replied: "Replied",
  bounced: "Bounced",
  unsubscribed: "Unsubscribed",
};

export function ContactStatusBadge({ status }: { status: ContactStatus }) {
  const normalized = status in statusStyles ? status : "not_started";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        statusStyles[normalized]
      )}
    >
      {statusLabels[normalized]}
    </span>
  );
}
