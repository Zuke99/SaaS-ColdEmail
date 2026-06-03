import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/lib/types/campaign";

const statusStyles: Record<CampaignStatus, string> = {
  draft: "bg-zinc-500/15 text-zinc-400",
  active: "bg-success/15 text-success",
  paused: "bg-pending/15 text-pending",
};

const statusLabels: Record<CampaignStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const normalized = status in statusStyles ? status : "draft";

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
