import { env } from "@/env";

export const EMAIL_CONFIG = {
  appName: env.NEXT_PUBLIC_APP_NAME,
  from: env.EMAIL_FROM,
  replyTo: env.EMAIL_REPLY_TO,
  logoUrl: env.NEXT_PUBLIC_APP_LOGO_URL ?? "",
  dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
  pricingUrl: `${env.NEXT_PUBLIC_APP_URL}/pricing`,
  supportUrl: `${env.NEXT_PUBLIC_APP_URL}/support`,
  privacyUrl: `${env.NEXT_PUBLIC_APP_URL}/privacy`,
  unsubscribeUrl: `${env.NEXT_PUBLIC_APP_URL}/unsubscribe`,
};
