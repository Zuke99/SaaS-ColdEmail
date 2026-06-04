import { z } from "zod";

export const campaignFormSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required"),
  sender_name: z.string().trim().min(1, "Sender name is required"),
  sender_email: z
    .string()
    .trim()
    .min(1, "Sender email is required")
    .email("Enter a valid email address"),
  daily_limit: z.number().int().min(1).max(100),
});

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export const updateCampaignStatusSchema = z.object({
  status: z.enum(["draft", "active", "paused"]),
});

export const updateCampaignSchema = campaignFormSchema.extend({
  status: z.enum(["draft", "active", "paused"]).optional(),
});

export const patchCampaignSchema = z.union([
  updateCampaignStatusSchema,
  updateCampaignSchema,
]);

export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
