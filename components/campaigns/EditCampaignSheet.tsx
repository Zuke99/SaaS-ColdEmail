"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Campaign } from "@/lib/types/campaign";
import {
  campaignFormSchema,
  type CampaignFormValues,
} from "@/lib/validators/campaign";

type EditCampaignSheetProps = {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (campaign: Campaign) => void;
};

export function EditCampaignSheet({
  campaign,
  open,
  onOpenChange,
  onUpdated,
}: EditCampaignSheetProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      sender_name: "",
      sender_email: "",
      daily_limit: 30,
    },
  });

  useEffect(() => {
    if (campaign) {
      reset({
        name: campaign.name,
        sender_name: campaign.sender_name,
        sender_email: campaign.sender_email,
        daily_limit: campaign.daily_limit,
      });
    }
  }, [campaign, reset]);

  async function onSubmit(values: CampaignFormValues) {
    if (!campaign) return;

    setSubmitError(null);

    const res = await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setSubmitError(
        typeof data.error === "string" ? data.error : "Failed to update campaign"
      );
      return;
    }

    toast.success("Campaign updated");
    onOpenChange(false);
    onUpdated(data as Campaign);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSubmitError(null);
      if (campaign) {
        reset({
          name: campaign.name,
          sender_name: campaign.sender_name,
          sender_email: campaign.sender_email,
          daily_limit: campaign.daily_limit,
        });
      }
    }
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit Campaign</SheetTitle>
          <SheetDescription>
            Update campaign name, sender details, and daily limit
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6"
        >
          <div className="space-y-2">
            <Label htmlFor="edit-name">Campaign name</Label>
            <Input
              id="edit-name"
              placeholder="e.g. YC Founders - Nov"
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-xs text-danger">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-sender_name">Sender name</Label>
            <Input
              id="edit-sender_name"
              placeholder="Your name"
              {...register("sender_name")}
            />
            {errors.sender_name ? (
              <p className="text-xs text-danger">{errors.sender_name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-sender_email">Sender email</Label>
            <Input
              id="edit-sender_email"
              type="email"
              placeholder="onboarding@resend.dev"
              {...register("sender_email")}
            />
            {errors.sender_email ? (
              <p className="text-xs text-danger">
                {errors.sender_email.message}
              </p>
            ) : null}
            <p className="text-xs text-muted">
              Use a verified domain in Resend, or{" "}
              <span className="font-mono text-foreground/80">
                onboarding@resend.dev
              </span>{" "}
              for testing
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-daily_limit">Daily send limit</Label>
            <Input
              id="edit-daily_limit"
              type="number"
              min={1}
              max={100}
              {...register("daily_limit", { valueAsNumber: true })}
            />
            {errors.daily_limit ? (
              <p className="text-xs text-danger">{errors.daily_limit.message}</p>
            ) : null}
          </div>

          {submitError ? (
            <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {submitError}
            </p>
          ) : null}

          <SheetFooter className="mt-auto border-0 p-0">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
