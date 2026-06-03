export type SequenceStep = {
  id: string;
  campaign_id: string;
  step_number: number;
  subject: string;
  body: string;
  delay_days: number;
  custom_vars: Record<string, string> | null;
  created_at: string;
};

export type CreateSequenceStepInput = {
  step_number: number;
  subject: string;
  body: string;
  delay_days: number;
  custom_vars?: Record<string, string>;
};

export type UpdateSequenceStepInput = {
  subject: string;
  body: string;
  delay_days: number;
  custom_vars?: Record<string, string>;
};
