export type CampaignStatus = "draft" | "active" | "paused";

export type Campaign = {
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
};

export type CreateCampaignInput = {
  name: string;
  sender_name: string;
  sender_email: string;
  daily_limit: number;
};
