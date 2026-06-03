import { FEATURES } from "@/config/features";
import { env } from "@/env";

export type EmailConfig = {
  appName: string;
  from: string;
  replyTo: string;
  logoUrl: string;
  dashboardUrl: string;
  pricingUrl: string;
  supportUrl: string;
  privacyUrl: string;
  unsubscribeUrl: string;
};

export const EMAIL_CONFIG: EmailConfig | null = FEATURES.email
  ? {
      appName: env.NEXT_PUBLIC_APP_NAME,
      from: env.EMAIL_FROM!,
      replyTo: env.EMAIL_REPLY_TO!,
      logoUrl: env.NEXT_PUBLIC_APP_LOGO_URL ?? "",
      dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
      pricingUrl: `${env.NEXT_PUBLIC_APP_URL}/pricing`,
      supportUrl: `${env.NEXT_PUBLIC_APP_URL}/support`,
      privacyUrl: `${env.NEXT_PUBLIC_APP_URL}/privacy`,
      unsubscribeUrl: `${env.NEXT_PUBLIC_APP_URL}/unsubscribe`,
    }
  : null;

export function getEmailConfig(): EmailConfig {
  if (!EMAIL_CONFIG) {
    throw new Error("Email feature is disabled");
  }
  return EMAIL_CONFIG;
}
