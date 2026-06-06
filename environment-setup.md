# ENV Reference — Where to Find Each Value

---

## NEXT_PUBLIC_APP_ID
**What:** Unique identifier for your SaaS. Becomes the Postgres schema name.
**Value:** You choose this. Lowercase, underscores only.
**Example:** `youtube_toolkit`

---

## NEXT_PUBLIC_APP_NAME
**What:** Human-readable app name. Used in emails and UI.
**Value:** You choose this.
**Example:** `YouTube Toolkit`

---

## App base URL (`NEXT_PUBLIC_APP_URL`)

One variable drives every absolute URL in the app. Use `getAppBaseUrl()` / `appUrl()` from `@/lib/app-url` in code — do not concatenate `env.NEXT_PUBLIC_APP_URL` manually.

| Use case | Example |
|----------|---------|
| Production deploy | `https://your-app.vercel.app` |
| Local dev (default) | `http://localhost:3000` |
| Local dev + real email opens | Set to your ngrok URL, e.g. `https://abc.ngrok-free.app` |

Gmail loads tracking images from **Google’s servers**, not your laptop — `localhost` in emails will not record opens unless you use a public URL (tunnel or deploy).

In development, manual sends from the UI can use the request `Host` port when still on localhost (e.g. 3001 if 3000 is busy).

**What:** Full URL of your app. No trailing slash.
**Local:** `http://localhost:3000`
**Production:** `https://your-app.vercel.app` (or your host)

---

## NEXT_PUBLIC_APP_LOGO_URL
**What:** Public URL to your logo image. Used in emails.
**Value:** Upload your logo to `/public/images/logo.png` and set to `https://your-app.com/images/logo.png`
**Optional:** Leave blank if not ready.

---

## NEXT_PUBLIC_SUPABASE_URL
**Where:** Supabase Dashboard → Your Project → Settings → API
**Field:** Project URL
**Looks like:** `https://xyzxyzxyz.supabase.co`

---

## NEXT_PUBLIC_SUPABASE_ANON_KEY
**Where:** Supabase Dashboard → Your Project → Settings → API
**Field:** Project API Keys → `anon` `public`
**Looks like:** `eyJhbGciOiJIUzI1NiIsInR5cCI6...` (long JWT string)

---

## SUPABASE_SERVICE_ROLE_KEY
**Where:** Supabase Dashboard → Your Project → Settings → API
**Field:** Project API Keys → `service_role` `secret`
**Looks like:** `eyJhbGciOiJIUzI1NiIsInR5cCI6...` (different long JWT)
**Warning:** Never prefix with NEXT_PUBLIC_. Server only.

---

## DODO_PAYMENTS_API_KEY
**Where:** Dodo Dashboard → Developer → API Keys → Create API Key
**Looks like:** `dodo_sk_test_...` or `dodo_sk_live_...`

---

## DODO_PAYMENTS_WEBHOOK_KEY
**Where:** Dodo Dashboard → Developer → Webhooks → your endpoint → Signing Secret
**Note:** Create the webhook endpoint first, then the secret appears.
**Looks like:** `whsec_...`

---

## DODO_PAYMENTS_ENVIRONMENT
**What:** Controls test vs live mode.
**Local dev:** `test_mode`
**Production:** `live_mode`

---

## DODO_PAYMENTS_RETURN_URL
**What:** URL Dodo redirects to after successful payment.
**Local:** `http://localhost:3000/checkout/success`
**Production:** `https://your-app.onrender.com/checkout/success`

---

## DODO_PRO_PRODUCT_ID
**Where:** Dodo Dashboard → Products → click your Pro product → copy ID from URL or product detail
**Looks like:** `pdt_xxxxxxxxxxxxxx`

---

## RESEND_API_KEY
**Where:** Resend Dashboard → API Keys → Create API Key
**Looks like:** `re_xxxxxxxxxxxxxxxxx`

---

## EMAIL_FROM
**What:** The from address on all outgoing emails.
**Before domain verified:** `onboarding@resend.dev` (Resend's test address)
**After domain verified:** `noreply@yourdomain.com`
**Where to verify domain:** Resend Dashboard → Domains → Add Domain

---

## EMAIL_REPLY_TO
**What:** Address users reply to when they hit reply on an email.
**Value:** Your support email.
**Example:** `support@yourdomain.com`