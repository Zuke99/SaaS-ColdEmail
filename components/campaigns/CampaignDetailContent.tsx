"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { CampaignCronDevTools } from "@/components/campaigns/CampaignCronDevTools";
import { CampaignStatsStrip } from "@/components/campaigns/CampaignStatsStrip";
import { CampaignStatusControls } from "@/components/campaigns/CampaignStatusControls";
import { ContactsTab } from "@/components/campaigns/ContactsTab";
import { EditCampaignSheet } from "@/components/campaigns/EditCampaignSheet";
import { SentLogTab } from "@/components/campaigns/SentLogTab";
import { SequenceTab } from "@/components/campaigns/SequenceTab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CampaignWithCounts } from "@/lib/types/contact";

type CampaignDetailContentProps = {
  campaignId: string;
};

export function CampaignDetailContent({
  campaignId,
}: CampaignDetailContentProps) {
  const [campaign, setCampaign] = useState<CampaignWithCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadCampaign = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/campaigns/${campaignId}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(
        typeof data.error === "string" ? data.error : "Failed to load campaign"
      );
      setCampaign(null);
      return;
    }

    setCampaign(data as CampaignWithCounts);
  }, [campaignId]);

  useEffect(() => {
    loadCampaign().finally(() => setLoading(false));
  }, [loadCampaign]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <p className="px-4 py-6 text-sm text-muted sm:px-6">
          Loading campaign…
        </p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-screen flex-col px-4 py-6 sm:px-6">
        <Link
          href="/campaigns"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to campaigns
        </Link>
        <p className="text-sm text-danger">{error ?? "Campaign not found"}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/campaigns"
            className="shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-border/50 hover:text-foreground"
            aria-label="Back to campaigns"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="truncate text-lg font-medium text-foreground">
            {campaign.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <CampaignStatusControls
            campaign={campaign}
            onUpdated={(updated) => {
              setCampaign((prev) =>
                prev ? { ...prev, ...updated } : prev
              );
            }}
          />
        </div>
      </header>

      <EditCampaignSheet
        campaign={campaign}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={() => {
          void loadCampaign();
        }}
      />

      {campaign.stats ? <CampaignStatsStrip stats={campaign.stats} /> : null}

      <div className="flex-1 px-4 py-4 sm:px-6 sm:py-6">
        <Tabs defaultValue="contacts" className="w-full">
          <TabsList>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="sequence">Sequence</TabsTrigger>
            <TabsTrigger value="sent-log">Sent Log</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts">
            <ContactsTab campaignId={campaignId} />
          </TabsContent>

          <TabsContent value="sequence">
            <SequenceTab campaignId={campaignId} />
          </TabsContent>

          <TabsContent value="sent-log">
            <SentLogTab campaignId={campaignId} />
          </TabsContent>
        </Tabs>

        {process.env.NODE_ENV === "development" ? (
          <CampaignCronDevTools />
        ) : null}
      </div>
    </div>
  );
}
