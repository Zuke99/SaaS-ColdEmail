export type ContactStatus =
  | "not_started"
  | "sent"
  | "opened"
  | "replied"
  | "bounced"
  | "unsubscribed";

export type Contact = {
  id: string;
  campaign_id: string;
  name: string | null;
  email: string;
  status: ContactStatus;
  created_at: string;
  updated_at: string;
};

import type { CampaignStatus } from "@/lib/types/campaign";

export type CampaignWithCounts = {
  id: string;
  name: string;
  status: CampaignStatus;
  daily_limit: number;
  sender_name: string;
  sender_email: string;
  follow_up_count: number;
  created_at: string;
  updated_at: string;
  contacts_count: number;
};
