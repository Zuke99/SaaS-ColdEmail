"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignStatusBadge";
import { Button } from "@/components/ui/button";
import type { Campaign, CampaignStatus } from "@/lib/types/campaign";

type CampaignStatusControlsProps = {
  campaign: Campaign;
  onUpdated: (campaign: Campaign) => void;
};

export function CampaignStatusControls({
  campaign,
  onUpdated,
}: CampaignStatusControlsProps) {
  const [updating, setUpdating] = useState(false);

  async function setStatus(status: CampaignStatus) {
    setUpdating(true);
    const res = await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    setUpdating(false);

    if (!res.ok) {
      toast.error(
        typeof data.error === "string" ? data.error : "Failed to update status"
      );
      return;
    }

    if (status === "active") {
      toast.success("Campaign activated");
    } else if (status === "paused") {
      toast.success("Campaign paused");
    }

    onUpdated(data as Campaign);
  }

  const showActivate =
    campaign.status === "draft" || campaign.status === "paused";

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <CampaignStatusBadge status={campaign.status} />
        {showActivate ? (
          <Button
            size="sm"
            disabled={updating}
            className="bg-success text-background hover:bg-success/90"
            onClick={() => setStatus("active")}
          >
            Activate Campaign
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={updating}
            className="border-pending/50 text-pending hover:bg-pending/10"
            onClick={() => setStatus("paused")}
          >
            Pause
          </Button>
        )}
      </div>
      {campaign.status === "paused" ? (
        <p className="max-w-xs text-right text-xs text-muted">
          Pausing stops future scheduling. Emails already queued for today will
          still send.
        </p>
      ) : null}
    </div>
  );
}
