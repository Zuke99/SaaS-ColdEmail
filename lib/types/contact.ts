export type ContactStatus =
  | "not_started"
  | "queued"
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
  company: string | null;
  status: ContactStatus;
  created_at: string;
  updated_at: string;
};

import type { CampaignStatus } from "@/lib/types/campaign";

export type CampaignStats = {
  total_contacts: number;
  sent: number;
  opened: number;
  replied: number;
};

export type CampaignWithCounts = {
  id: string;
  user_id: string;
  name: string;
  status: CampaignStatus;
  daily_limit: number;
  sender_name: string;
  sender_email: string;
  follow_up_count: number;
  created_at: string;
  updated_at: string;
  contacts_count: number;
  stats: CampaignStats;
};
