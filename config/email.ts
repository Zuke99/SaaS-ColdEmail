const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const EMAIL_CONFIG = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "My App",
  from: process.env.EMAIL_FROM ?? "noreply@example.com",
  replyTo: process.env.EMAIL_REPLY_TO ?? "support@example.com",
  logoUrl: process.env.NEXT_PUBLIC_APP_LOGO_URL ?? "",
  dashboardUrl: `${appUrl}/dashboard`,
  pricingUrl: `${appUrl}/pricing`,
  supportUrl: `${appUrl}/support`,
  privacyUrl: `${appUrl}/privacy`,
  unsubscribeUrl: `${appUrl}/unsubscribe`,
};
