-- Gmail credentials for cold outreach (separate from Supabase auth OAuth)
create table if not exists cold_email.gmail_credentials (
  id uuid primary key default gen_random_uuid(),
  sender_email text unique not null,
  access_token text,
  refresh_token text not null,
  token_expiry timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table cold_email.send_log
  add column if not exists gmail_message_id text;

alter table cold_email.send_log
  add column if not exists gmail_thread_id text;
