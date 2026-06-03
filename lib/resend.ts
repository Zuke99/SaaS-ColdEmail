import { FEATURES } from "@/config/features";
import { env } from "@/env";
import { Resend } from "resend";

export const resend = FEATURES.email
  ? new Resend(env.RESEND_API_KEY!)
  : null;

let resendClient: Resend | null = resend;

export function getResend(): Resend {
  if (!FEATURES.email || !resendClient) {
    throw new Error("Email feature is disabled");
  }
  return resendClient;
}
