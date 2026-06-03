# SaaS Boilerplate — Complete Setup Guide

> Follow this document top to bottom and your SaaS will be fully running. Every section is numbered. Do not skip steps.

---

## Table of Contents

1. [Stack Overview](#1-stack-overview)
2. [Prerequisites](#2-prerequisites)
3. [Clone and Install](#3-clone-and-install)
4. [Supabase Setup](#4-supabase-setup)
5. [Dodo Payments Setup](#5-dodo-payments-setup)
6. [Resend Setup](#6-resend-setup)
7. [Environment Variables](#7-environment-variables)
8. [Run Locally](#8-run-locally)
9. [Deploy to Render](#9-deploy-to-render)
10. [Spinning Up a New SaaS](#10-spinning-up-a-new-saas)
11. [Writing a Blog Post](#11-writing-a-blog-post)
12. [Project Structure](#12-project-structure)
13. [How Each Module Works](#13-how-each-module-works)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Stack Overview

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Fullstack, static generation, server actions |
| Database | Supabase (Postgres) | Auth + DB + Storage in one, free tier |
| Auth | Supabase Auth | Google OAuth + email, built-in |
| Payments | Dodo Payments | Merchant of Record, handles VAT/tax globally |
| Email | Resend + React Email | Developer-first, React component templates |
| Env Validation | t3-env + Zod | Type-safe, validated at startup |
| Blog | MDX + next-mdx-remote | Static, SEO-optimised, no CMS needed |
| Hosting | Render | No cold starts (kept warm by cron), cheaper than Vercel |
| ORM | Supabase Client (direct) | Works with RLS and dynamic schemas natively |

**Multi-SaaS Architecture:**
- One Supabase project hosts all SaaS products
- Each SaaS gets its own Postgres schema (e.g. `youtube_toolkit`, `saas_two`)
- Schema auto-provisions on first app start — you do nothing
- When a SaaS generates revenue, migrate it to its own Supabase project

---

## 2. Prerequisites

Install these on your machine before anything else.

```bash
# Node.js 18+
node --version   # must be 18.x or higher

# npm 9+
npm --version

# Git
git --version

# Supabase CLI (for local dev and migrations)
npm install -g supabase

# ngrok (for local webhook testing)
# Download from https://ngrok.com/download
ngrok --version
```

Accounts you need to create (all free to start):

- [supabase.com](https://supabase.com) — create an account and one project
- [dodopayments.com](https://dodopayments.com) — create an account
- [resend.com](https://resend.com) — create an account

---

## 3. Clone and Install

```bash
# Clone the boilerplate
git clone https://github.com/your-username/saas-boilerplate.git
cd saas-boilerplate

# Install dependencies
npm install

# Copy the environment variable template
cp .env.local.example .env.local
```

Now open `.env.local` in your editor. You will fill in each value as you complete the sections below.

---

## 4. Supabase Setup

### 4.1 Create a Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Give it a name (e.g. `saas-boilerplate`)
4. Choose a region close to your users
5. Set a strong database password — save it somewhere safe
6. Click **Create new project** and wait ~2 minutes

### 4.2 Get Your API Keys

1. In your project dashboard, go to **Settings → API**
2. Copy the following values into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=         # "Project URL" — looks like https://xyzxyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # "anon public" key
SUPABASE_SERVICE_ROLE_KEY=        # "service_role" key — keep this secret, never expose to client
```

### 4.3 Run the Database Migration

This creates the `provision_app_schema` Postgres function that auto-creates schemas on startup.

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Open `supabase/migrations/001_schema_provisioning.sql` from your project
4. Paste the entire contents into the editor
5. Click **Run**
6. You should see: `Success. No rows returned`

Then run the payments migration:

1. Open `supabase/migrations/002_payments.sql`
2. Paste into a new SQL Editor query
3. Click **Run**

### 4.4 Enable Google OAuth

1. Go to **Authentication → Providers**
2. Find **Google** and click to expand
3. Toggle **Enable Sign in with Google** to ON
4. You need a Google OAuth Client ID and Secret — get them in the next step

**Getting Google OAuth credentials:**

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Add Authorized redirect URIs:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   Replace `your-project-ref` with your actual Supabase project reference (found in project URL)
7. Copy the **Client ID** and **Client Secret**
8. Paste them into the Supabase Google provider settings
9. Click **Save**

### 4.5 Configure Auth Redirect URLs

1. In Supabase, go to **Authentication → URL Configuration**
2. Set **Site URL** to: `http://localhost:3000` (change to your Render URL in production)
3. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/auth/callback
   https://your-render-app.onrender.com/auth/callback
   ```

---

## 5. Dodo Payments Setup

### 5.1 Create an Account

1. Go to [dodopayments.com](https://dodopayments.com) and sign up
2. Complete onboarding (takes ~5 minutes)
3. You start in **test mode** — you can make test payments without real money

### 5.2 Get Your API Key

1. Go to **Dashboard → API Keys**
2. Click **Create API Key**
3. Copy the key into `.env.local`:
   ```
   DODO_PAYMENTS_API_KEY=your_api_key
   ```

### 5.3 Create a Product

1. Go to **Dashboard → Products**
2. Click **Create Product**
3. Fill in:
   - Name: `Pro Plan`
   - Price: your monthly price (e.g. `$19.00`)
   - Billing: `Monthly recurring`
4. Click **Save**
5. Copy the **Product ID** (looks like `pdt_xxxxxx`) into `.env.local`:
   ```
   DODO_PRO_PRODUCT_ID=pdt_xxxxxx
   ```

### 5.4 Set Up Webhook

The webhook tells your app when a payment succeeds or a subscription changes.

**For local development:**

1. Start ngrok in a terminal:
   ```bash
   ngrok http 3000
   ```
2. Copy the `https://` URL ngrok gives you (e.g. `https://abc123.ngrok.io`)

**In Dodo Dashboard:**

1. Go to **Dashboard → Webhooks**
2. Click **Add Endpoint**
3. URL: `https://your-ngrok-url.ngrok.io/api/webhooks/dodo`
4. Select events:
   - `subscription.created`
   - `subscription.renewed`
   - `subscription.cancelled`
   - `payment.succeeded`
5. Click **Save**
6. Click on the webhook you just created
7. Copy the **Signing Secret** into `.env.local`:
   ```
   DODO_PAYMENTS_WEBHOOK_KEY=your_webhook_secret
   ```

**For production on Render:**

Repeat the webhook setup with your Render URL instead of ngrok:
```
https://your-app.onrender.com/api/webhooks/dodo
```

---

## 6. Resend Setup

### 6.1 Create an Account

1. Go to [resend.com](https://resend.com) and sign up

### 6.2 Get Your API Key

1. Go to **Dashboard → API Keys**
2. Click **Create API Key**
3. Give it a name (e.g. `saas-boilerplate`)
4. Copy the key into `.env.local`:
   ```
   RESEND_API_KEY=your_resend_api_key
   ```

### 6.3 Verify Your Domain

Without a verified domain, Resend can only send to your own email address.

1. Go to **Dashboard → Domains**
2. Click **Add Domain**
3. Enter your domain (e.g. `yourdomain.com`)
4. Resend will show you DNS records to add
5. Add those records in your domain registrar (Namecheap, GoDaddy, Cloudflare etc.)
6. Click **Verify** — takes 5–30 minutes

Until verified, set:
```
EMAIL_FROM=onboarding@resend.dev    # Resend's test address, works immediately
```

After verified, change to:
```
EMAIL_FROM=noreply@yourdomain.com
```

---

## 7. Environment Variables

Open `.env.local` and fill in every value. This is the complete reference.

```bash
# ============================================
# APP IDENTITY — change these for each SaaS
# ============================================

# Unique ID for this SaaS — lowercase letters, numbers, underscores only
# This becomes your Postgres schema name
# Examples: youtube_toolkit, invoice_app, churn_predictor
NEXT_PUBLIC_APP_ID=youtube_toolkit

# Human-readable name shown in emails, UI, and blog
NEXT_PUBLIC_APP_NAME=YouTube Toolkit

# Full URL of the app — no trailing slash
# Local dev: http://localhost:3000
# Production: https://your-app.onrender.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: URL to your app logo image (used in emails)
NEXT_PUBLIC_APP_LOGO_URL=

# ============================================
# SUPABASE
# ============================================

# Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Settings → API → anon/public key (safe to expose)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Settings → API → service_role key
# WARNING: Never prefix with NEXT_PUBLIC_ — server only, never expose
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ============================================
# DODO PAYMENTS
# ============================================

# Dashboard → API Keys
DODO_PAYMENTS_API_KEY=your_api_key

# Dashboard → Webhooks → your endpoint → Signing Secret
DODO_PAYMENTS_WEBHOOK_KEY=your_webhook_secret

# Use test_mode locally, live_mode in production
DODO_PAYMENTS_ENVIRONMENT=test_mode

# The URL Dodo redirects to after a successful payment
DODO_PAYMENTS_RETURN_URL=http://localhost:3000/checkout/success

# Dashboard → Products → your Pro product → Product ID
DODO_PRO_PRODUCT_ID=pdt_xxxxxx

# ============================================
# RESEND (EMAIL)
# ============================================

# Dashboard → API Keys
RESEND_API_KEY=your_resend_api_key

# Must match a verified domain in Resend
# Use onboarding@resend.dev while domain is unverified
EMAIL_FROM=noreply@yourdomain.com

# Reply-to address for support
EMAIL_REPLY_TO=support@yourdomain.com
```

### Validate Your Environment

Run this before starting the app to catch any missing variables:

```bash
npm run env:validate
```

If any variable is missing or in the wrong format, you will see a clear error like:

```
❌ Invalid environment variables:
   DODO_PAYMENTS_ENVIRONMENT: Invalid enum value.
   Expected 'test_mode' | 'live_mode', received 'live'
```

Fix the error and run again until it passes silently.

---

## 8. Run Locally

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**What happens on first start:**

1. `instrumentation.ts` runs before the app boots
2. It calls `provisionAppSchema()` with your `NEXT_PUBLIC_APP_ID`
3. Supabase creates a new Postgres schema (e.g. `youtube_toolkit`) with all required tables
4. You will see in your terminal:
   ```
   [Schema Provisioning] Schema "youtube_toolkit" is ready
   ```
5. App starts normally

**Verify the schema was created:**

1. Go to your Supabase dashboard
2. Go to **Table Editor**
3. You should see a schema named `youtube_toolkit` in the left sidebar
4. Inside it: a `profiles` table with all columns

### Testing Payments Locally

1. Start ngrok: `ngrok http 3000`
2. Update your Dodo webhook endpoint URL to the ngrok URL
3. Go to `http://localhost:3000/pricing`
4. Click upgrade — use Dodo's test card:
   ```
   Card number: 4242 4242 4242 4242
   Expiry: any future date
   CVV: any 3 digits
   ```
5. After payment, check your Supabase `profiles` table — `plan` column should show `pro`

### Testing Emails Locally

1. Go to `http://localhost:3000/email-preview`
2. All email templates render here in the browser
3. No emails are actually sent — purely visual preview
4. To test actual sending, sign up with a real email and check your inbox

---

## 9. Deploy to Render

### 9.1 Create a Web Service

1. Go to [render.com](https://render.com) and sign in
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: your-saas-name
   - **Region**: closest to your users
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Free (kept warm by your Supabase cron job)

### 9.2 Add Environment Variables

In your Render service, go to **Environment** and add every variable from your `.env.local`, with these changes:

```
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com   # your actual Render URL
DODO_PAYMENTS_ENVIRONMENT=live_mode                  # switch to live payments
DODO_PAYMENTS_RETURN_URL=https://your-app.onrender.com/checkout/success
EMAIL_FROM=noreply@yourdomain.com                    # your verified domain
```

### 9.3 Keep Render Warm (No Cold Starts)

The free Render tier spins down after 15 minutes of inactivity. Fix this with a Supabase cron job that pings your app.

In Supabase **SQL Editor**, run:

```sql
-- Runs every 10 minutes, keeps Render warm
select cron.schedule(
  'keep-render-warm',
  '*/10 * * * *',
  $$
  select net.http_get(
    url := 'https://your-app.onrender.com/api/health'
  );
  $$
);
```

Then create the health endpoint in your app at `app/api/health/route.ts`:

```typescript
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

### 9.4 Update Supabase Auth URLs for Production

1. Go to Supabase **Authentication → URL Configuration**
2. Change **Site URL** to: `https://your-app.onrender.com`
3. Add to **Redirect URLs**: `https://your-app.onrender.com/auth/callback`

### 9.5 Update Dodo Webhook for Production

1. Go to Dodo Dashboard → Webhooks
2. Add a new endpoint: `https://your-app.onrender.com/api/webhooks/dodo`
3. Select the same events as before
4. Copy the new signing secret and update `DODO_PAYMENTS_WEBHOOK_KEY` in Render

### 9.6 Deploy

Push to your main branch — Render auto-deploys on every push.

```bash
git add .
git commit -m "initial deployment"
git push origin main
```

Watch the build logs in Render dashboard. A successful deploy shows:
```
==> Build successful 🎉
==> Your service is live at https://your-app.onrender.com
```

---

## 10. Spinning Up a New SaaS

This is the whole point of the boilerplate. For every new product:

### Step 1 — Copy the boilerplate

```bash
cp -r saas-boilerplate my-new-saas
cd my-new-saas
npm install
```

Or use GitHub's template feature if you set the repo as a template.

### Step 2 — Update .env.local

Only these values change per SaaS:

```bash
NEXT_PUBLIC_APP_ID=my_new_saas          # new unique schema name
NEXT_PUBLIC_APP_NAME=My New SaaS        # new app name
NEXT_PUBLIC_APP_URL=http://localhost:3000

# New Dodo product ID (create a new product in same Dodo account)
DODO_PRO_PRODUCT_ID=pdt_new_product_id

# New email from address (if different domain)
EMAIL_FROM=noreply@mynewsaas.com
```

Everything else (Supabase keys, Resend key, Dodo API key) stays the same — they all live under the same accounts.

### Step 3 — Run the app

```bash
npm run dev
```

On first start, the app automatically creates a new schema `my_new_saas` in Supabase with all the required tables. You will see:

```
[Schema Provisioning] Schema "my_new_saas" is ready
```

### Step 4 — Customise plans in config/plans.ts

```typescript
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    dodoProductId: null,
    features: ['Feature 1', 'Feature 2'],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29/mo',
    dodoProductId: process.env.DODO_PRO_PRODUCT_ID ?? '',
    features: ['Everything in Free', 'Feature 3', 'Feature 4'],
    highlighted: true,
  },
]
```

### Step 5 — Write your landing page and deploy

That is it. Auth, payments, email, blog, schema — all working.

### New SaaS Checklist

```
[ ] Copied boilerplate to new folder
[ ] Updated NEXT_PUBLIC_APP_ID (unique, lowercase, underscores)
[ ] Updated NEXT_PUBLIC_APP_NAME
[ ] Created new Dodo product, updated DODO_PRO_PRODUCT_ID
[ ] Updated EMAIL_FROM if using a different domain
[ ] Ran npm run env:validate — passes cleanly
[ ] Ran npm run dev — schema provisioned successfully
[ ] Tested signup flow end to end
[ ] Tested payment flow with test card
[ ] Deployed to Render with updated env vars
[ ] Updated Supabase auth redirect URLs for new domain
[ ] Added new Dodo webhook endpoint for new domain
[ ] Set up Supabase cron to keep Render warm
```

---

## 11. Writing a Blog Post

Blog posts are `.mdx` files inside `content/blogs/`. No CMS, no dashboard — just a file.

### Create a new post

```bash
# Create a new file
touch content/blogs/your-post-slug.mdx
```

### Add frontmatter at the top

```mdx
---
title: "Your Post Title Here"
description: "A one or two sentence description used in Google search results and social sharing."
date: "2026-06-03"
tags: ["tag1", "tag2"]
published: false
coverImage: "/images/blogs/your-post-cover.png"
author: "Your Name"
---

Your content starts here...
```

### Write your content

Standard Markdown works:

```mdx
## Section heading

Some paragraph text with **bold** and *italic* and [links](https://example.com).

### Subsection

- Bullet point one
- Bullet point two

\`\`\`typescript
// Code blocks with syntax highlighting
const hello = "world"
\`\`\`

> Blockquote for important callouts
```

### Preview locally

While `npm run dev` is running, visit:
```
http://localhost:3000/blog/your-post-slug
```

Your post renders immediately — no rebuild needed in development.

### Publish

1. Set `published: true` in frontmatter
2. Commit and push:

```bash
git add content/blogs/your-post-slug.mdx
git commit -m "blog: your post title"
git push
```

Render rebuilds and the post goes live at:
```
https://your-app.onrender.com/blog/your-post-slug
```

It also auto-appears on:
- `/blog` index page
- `/sitemap.xml` (Google picks this up)
- `/feed.xml` (RSS feed)

### Keep drafts in the repo

Set `published: false` to keep a post saved but hidden from visitors. Useful for drafts in progress.

---

## 12. Project Structure

```
saas-boilerplate/
│
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages — not in nav
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/              # Protected pages
│   │   ├── layout.tsx            # Checks session, redirects if not authed
│   │   └── dashboard/page.tsx
│   ├── (marketing)/              # Public pages
│   │   ├── blog/
│   │   │   ├── page.tsx          # Blog index
│   │   │   ├── [slug]/page.tsx   # Individual post
│   │   │   └── tag/[tag]/page.tsx
│   │   └── pricing/page.tsx
│   ├── api/
│   │   ├── checkout/route.ts     # Dodo checkout session
│   │   ├── customer-portal/route.ts
│   │   ├── health/route.ts       # Render keep-warm endpoint
│   │   └── webhooks/
│   │       └── dodo/route.ts     # Payment webhook handler
│   ├── auth/
│   │   └── callback/route.ts     # OAuth callback
│   ├── checkout/
│   │   └── success/page.tsx
│   ├── email-preview/page.tsx    # Dev only — preview email templates
│   ├── feed.xml/route.ts         # RSS feed
│   ├── sitemap.ts                # Auto sitemap
│   └── robots.ts
│
├── components/
│   ├── blog/
│   │   └── MDXContent.tsx        # MDX renderer with custom components
│   └── UpgradePrompt.tsx         # Shown when user hits a gated feature
│
├── config/
│   ├── email.ts                  # Email branding config
│   └── plans.ts                  # Subscription plans — edit per SaaS
│
├── content/
│   └── blogs/                    # Your .mdx blog posts go here
│       └── welcome-to-our-blog.mdx
│
├── emails/                       # React Email templates
│   ├── components/
│   │   └── BaseLayout.tsx        # Shared email wrapper
│   ├── WelcomeEmail.tsx
│   ├── PasswordResetEmail.tsx
│   ├── PaymentSuccessEmail.tsx
│   └── SubscriptionCancelledEmail.tsx
│
├── hooks/
│   ├── useUser.ts                # Client hook — current auth user
│   └── usePlan.ts                # Client hook — current plan
│
├── lib/
│   ├── actions/
│   │   ├── auth.ts               # signIn, signUp, signOut server actions
│   │   ├── email.ts              # sendWelcomeEmail, sendPaymentSuccessEmail etc.
│   │   └── payments.ts           # createCheckoutSession, redirectToCustomerPortal
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client (uses cookies)
│   │   ├── provision.ts          # Schema auto-provisioner
│   │   ├── schema.ts             # getTable() helper
│   │   └── getPlan.ts            # Server-side plan checker
│   ├── blog.ts                   # getAllPosts, getPostBySlug utilities
│   ├── email.ts                  # sendEmail() core utility
│   └── resend.ts                 # Resend client singleton
│
├── supabase/
│   └── migrations/
│       ├── 001_schema_provisioning.sql   # Run once in Supabase SQL Editor
│       └── 002_payments.sql              # Run once in Supabase SQL Editor
│
├── types/
│   └── database.ts               # Generated Supabase types (run supabase gen types)
│
├── env.ts                        # All env vars — validated at startup
├── middleware.ts                 # Route protection
├── instrumentation.ts            # Startup hook — runs schema provisioning
├── .cursorrules                  # Cursor Agent standing rules
├── .env.local                    # Your secrets — gitignored
├── .env.local.example            # Template — committed to git
└── next.config.ts
```

---

## 13. How Each Module Works

### Auth Flow

```
User visits /login
  → fills email + password OR clicks "Continue with Google"
  → Server Action fires (lib/actions/auth.ts)
  → Supabase Auth creates/finds user in auth.users
  → Checks {APP_ID}.profiles for this user
  → No profile? Creates one (first time on this SaaS)
  → Profile exists? Proceeds
  → Redirects to /dashboard
  → sendWelcomeEmail() fires in background (non-blocking)
```

### Payments Flow

```
User visits /pricing
  → clicks "Upgrade to Pro"
  → createCheckoutSession('pro') server action
  → POST /api/checkout with product cart
  → Dodo returns checkout_url
  → User redirected to Dodo hosted checkout
  → User pays
  → Dodo fires POST /api/webhooks/dodo
  → subscription.created event
  → {APP_ID}.profiles updated: plan='pro', dodo_customer_id, subscription_ends_at
  → sendPaymentSuccessEmail() fires
  → User goes to /checkout/success
  → usePlan() returns 'pro' → features unlocked
```

### Schema Provisioning

```
App starts (any environment)
  → instrumentation.ts registers
  → provisionAppSchema() called
  → Calls Postgres function provision_app_schema(APP_ID)
  → Schema exists? → log "already exists", continue
  → Schema missing? → create schema + profiles table + RLS policies
  → App boots normally
```

### Blog / SEO

```
Build time (when you push to git)
  → Next.js reads all .mdx files in content/blogs/
  → generateStaticParams() returns all slugs
  → Every post pre-rendered as static HTML
  → sitemap.xml updated automatically

Visit time (user or Google)
  → CDN serves pre-built HTML instantly
  → Full content readable by Google immediately
  → No JavaScript needed to see content
```

---

## 14. Troubleshooting

### Schema not provisioning on startup

- Check terminal for `[Schema Provisioning]` log lines
- Make sure `001_schema_provisioning.sql` was run in Supabase SQL Editor
- Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly — not the anon key
- Make sure `instrumentationHook: true` is in `next.config.ts`

### Google OAuth not working

- Check redirect URI in Google Cloud Console matches exactly: `https://your-project.supabase.co/auth/v1/callback`
- Check Supabase Auth redirect URLs include your app URL
- Make sure Google OAuth is enabled in Supabase Auth → Providers

### Payments webhook not firing locally

- Make sure ngrok is running: `ngrok http 3000`
- Make sure the ngrok URL is updated in Dodo webhook settings
- ngrok URL changes every time you restart it — update Dodo each time
- Check `/api/webhooks/dodo` is returning 200 in ngrok inspector (`http://localhost:4040`)

### Webhook firing but plan not updating

- Check `DODO_PAYMENTS_WEBHOOK_KEY` matches the signing secret in Dodo dashboard
- Check Supabase Table Editor — look in `{APP_ID}.profiles` table
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set — webhook uses service role to bypass RLS

### Emails not sending

- Check `RESEND_API_KEY` is correct
- If domain not verified, `EMAIL_FROM` must be `onboarding@resend.dev`
- Check Resend dashboard → Logs for delivery status

### Render cold starts happening

- Check your Supabase cron job is running: Supabase → Database → Cron Jobs
- Make sure cron job URL is your actual Render URL, not localhost
- Check `/api/health` endpoint is returning 200

### Blog posts not appearing

- Make sure `published: true` is set in frontmatter
- Make sure the filename is kebab-case (e.g. `my-post.mdx` not `My Post.mdx`)
- In production, posts only appear after a rebuild — push to git to trigger

### Environment variable errors on startup

```bash
# Run this to see exactly which vars are missing or wrong
npm run env:validate
```

### Types out of sync with Supabase schema

```bash
# Regenerate types after changing your schema
npx supabase gen types typescript \
  --project-id your-project-ref \
  --schema youtube_toolkit \
  > types/database.ts
```

---

## Quick Reference

### Commands

```bash
npm run dev           # Start local dev server
npm run build         # Production build
npm run start         # Start production server
npm run env:validate  # Validate all environment variables
```

### URLs (local)

```
http://localhost:3000              # App home
http://localhost:3000/login        # Login
http://localhost:3000/signup       # Signup
http://localhost:3000/dashboard    # Protected dashboard
http://localhost:3000/pricing      # Pricing page
http://localhost:3000/blog         # Blog index
http://localhost:3000/email-preview # Email template preview (dev only)
http://localhost:3000/sitemap.xml  # Sitemap
http://localhost:3000/feed.xml     # RSS feed
http://localhost:4040              # ngrok inspector
```

### Per-SaaS files to customise

```
.env.local           # App ID, name, URL, product IDs
config/plans.ts      # Plan names, prices, features, product IDs
config/email.ts      # Email branding (auto-reads from env)
content/blogs/       # Your blog posts
app/(marketing)/     # Landing page, pricing page copy
```

### Files that never change between SaaS products

```
lib/actions/auth.ts
lib/actions/payments.ts
lib/actions/email.ts
lib/supabase/
emails/
middleware.ts
instrumentation.ts
env.ts               # Add new vars here if needed
```

---

*Last updated: June 2026*
*Stack: Next.js 14 · Supabase · Dodo Payments · Resend · Render · t3-env · MDX*
