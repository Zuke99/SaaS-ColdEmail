"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignStatusBadge";
import { CreateCampaignSheet } from "@/components/campaigns/CreateCampaignSheet";
import { EditCampaignSheet } from "@/components/campaigns/EditCampaignSheet";
import type { Campaign } from "@/lib/types/campaign";

export function CampaignsPageContent() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadCampaigns = useCallback(async () => {
    setFetchError(null);
    const res = await fetch("/api/campaigns");
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setFetchError(
        typeof data.error === "string" ? data.error : "Failed to load campaigns"
      );
      setCampaigns([]);
      return;
    }

    setCampaigns(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    loadCampaigns().finally(() => setLoading(false));
  }, [loadCampaigns]);

  function openCreateSheet() {
    setSheetOpen(true);
  }

  function openEditSheet(campaign: Campaign) {
    setEditCampaign(campaign);
    setEditOpen(true);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h1 className="text-lg font-medium text-foreground">Campaigns</h1>
        <Button size="sm" onClick={openCreateSheet}>
          New Campaign
        </Button>
      </header>

      <div className="flex-1 p-4 sm:p-6">
        {loading ? (
          <p className="text-sm text-muted">Loading campaigns…</p>
        ) : fetchError ? (
          <p className="text-sm text-danger">{fetchError}</p>
        ) : campaigns.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
            <p className="text-base font-medium text-foreground">
              No campaigns yet
            </p>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Create your first campaign to get started
            </p>
            <Button size="sm" className="mt-6" onClick={openCreateSheet}>
              New Campaign
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/80">
                  <th className="px-4 py-3 font-medium text-muted">Name</th>
                  <th className="px-4 py-3 font-medium text-muted">Status</th>
                  <th className="px-4 py-3 font-medium text-muted">Contacts</th>
                  <th className="px-4 py-3 font-medium text-muted">Sent</th>
                  <th className="px-4 py-3 font-medium text-muted">Created</th>
                  <th className="w-12 px-4 py-3 font-medium text-muted">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    onClick={() => router.push(`/campaigns/${campaign.id}`)}
                    className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-surface/60"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {campaign.name}
                    </td>
                    <td className="px-4 py-3">
                      <CampaignStatusBadge status={campaign.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-muted">0</td>
                    <td className="px-4 py-3 font-mono text-muted">0</td>
                    <td className="px-4 py-3 text-muted">
                      {formatDistanceToNow(new Date(campaign.created_at), {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted"
                            aria-label="Campaign actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditSheet(campaign)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-danger focus:text-danger">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateCampaignSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onCreated={() => {
          setLoading(false);
          void loadCampaigns();
        }}
      />

      <EditCampaignSheet
        campaign={editCampaign}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={() => {
          void loadCampaigns();
        }}
      />
    </div>
  );
}
