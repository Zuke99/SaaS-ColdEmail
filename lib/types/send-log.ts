export type SendLogStatus = "pending" | "sent" | "failed" | "cancelled";

export type SendLogEntry = {
  id: string;
  campaign_id: string;
  contact_id: string;
  step_number: number;
  subject: string;
  body: string;
  status: SendLogStatus;
  scheduled_for: string;
  sent_at: string | null;
  error_message: string | null;
  tracking_pixel_id: string | null;
  opened_at: string | null;
  sent_by_cron: boolean;
  created_at: string;
  name: string | null;
  email: string;
};
