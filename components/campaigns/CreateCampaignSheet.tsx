"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const createCampaignFormSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required"),
  sender_name: z.string().trim().min(1, "Sender name is required"),
  sender_email: z
    .string()
    .trim()
    .min(1, "Sender email is required")
    .email("Enter a valid email address"),
  daily_limit: z.number().int().min(1).max(100),
});

type CreateCampaignFormValues = z.infer<typeof createCampaignFormSchema>;

type CreateCampaignSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

export function CreateCampaignSheet({
  open,
  onOpenChange,
  onCreated,
}: CreateCampaignSheetProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCampaignFormValues>({
    resolver: zodResolver(createCampaignFormSchema),
    defaultValues: {
      name: "",
      sender_name: "",
      sender_email: "",
      daily_limit: 30,
    },
  });

  async function onSubmit(values: CreateCampaignFormValues) {
    setSubmitError(null);

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setSubmitError(
        typeof data.error === "string" ? data.error : "Failed to create campaign"
      );
      return;
    }

    toast.success("Campaign created");
    reset();
    onOpenChange(false);
    onCreated();
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSubmitError(null);
      reset();
    }
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>New Campaign</SheetTitle>
          <SheetDescription>
            Set up your campaign details
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Campaign name</Label>
            <Input
              id="name"
              placeholder="e.g. YC Founders - Nov"
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-xs text-danger">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender_name">Sender name</Label>
            <Input
              id="sender_name"
              placeholder="Your name"
              {...register("sender_name")}
            />
            {errors.sender_name ? (
              <p className="text-xs text-danger">{errors.sender_name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender_email">Sender email</Label>
            <Input
              id="sender_email"
              type="email"
              placeholder="you@yourdomain.com"
              {...register("sender_email")}
            />
            {errors.sender_email ? (
              <p className="text-xs text-danger">
                {errors.sender_email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily_limit">Daily send limit</Label>
            <Input
              id="daily_limit"
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
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating…" : "Create Campaign"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
