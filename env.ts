import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    DODO_PAYMENTS_API_KEY: z.string().min(1),
    DODO_PAYMENTS_WEBHOOK_KEY: z.string().min(1),
    DODO_PAYMENTS_ENVIRONMENT: z.enum(["test_mode", "live_mode"]),
    DODO_PAYMENTS_RETURN_URL: z.string().url(),
    DODO_PRO_PRODUCT_ID: z.string().min(1),

    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().email(),
    EMAIL_REPLY_TO: z.string().email(),

    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },

  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

    NEXT_PUBLIC_APP_ID: z
      .string()
      .min(1)
      .regex(/^[a-z][a-z0-9_]{1,48}$/, {
        message:
          "APP_ID must be lowercase alphanumeric with underscores e.g. youtube_toolkit",
      }),
    NEXT_PUBLIC_APP_NAME: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_APP_LOGO_URL: z.string().url().optional(),
  },

  runtimeEnv: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DODO_PAYMENTS_API_KEY: process.env.DODO_PAYMENTS_API_KEY,
    DODO_PAYMENTS_WEBHOOK_KEY: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
    DODO_PAYMENTS_ENVIRONMENT: process.env.DODO_PAYMENTS_ENVIRONMENT,
    DODO_PAYMENTS_RETURN_URL: process.env.DODO_PAYMENTS_RETURN_URL,
    DODO_PRO_PRODUCT_ID: process.env.DODO_PRO_PRODUCT_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
    NODE_ENV: process.env.NODE_ENV,

    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_ID: process.env.NEXT_PUBLIC_APP_ID,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_LOGO_URL: process.env.NEXT_PUBLIC_APP_LOGO_URL,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
