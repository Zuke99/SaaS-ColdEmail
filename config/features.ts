export const FEATURES = {
  auth: true,
  database: true,

  payments: process.env.ENABLE_PAYMENTS === "true",
  email: process.env.ENABLE_EMAIL === "true",
  blog: process.env.ENABLE_BLOG !== "false",
  analytics: process.env.ENABLE_ANALYTICS === "true",
} as const;

export type Feature = keyof typeof FEATURES;

export function isEnabled(feature: Feature): boolean {
  return FEATURES[feature];
}
