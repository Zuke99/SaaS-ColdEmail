-- Create schema
create schema if not exists cold_email;
set search_path to cold_email;

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- 1. campaigns
create table cold_email.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'draft',  -- draft | active | paused
  daily_limit integer not null default 30,
  sender_name text not null default '',
  sender_email text not null default '',
  follow_up_count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. contacts
create table cold_email.contacts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references cold_email.campaigns(id) on delete cascade,
  name text,
  email text not null,
  status text not null default 'not_started',  -- not_started | sent | opened | replied | bounced | unsubscribed
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(campaign_id, email)
);

-- 3. sequence_steps
create table cold_email.sequence_steps (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references cold_email.campaigns(id) on delete cascade,
  step_number integer not null,  -- 1 = initial email, 2/3/4 = follow-ups
  subject text not null default '',
  body text not null default '',
  delay_days integer not null default 0,  -- days after previous step. Step 1 always 0.
  created_at timestamptz default now(),
  unique(campaign_id, step_number)
);

-- 4. send_log
create table cold_email.send_log (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references cold_email.campaigns(id) on delete cascade,
  contact_id uuid references cold_email.contacts(id) on delete cascade,
  step_number integer not null,
  subject text not null,
  body text not null,
  status text not null default 'pending',  -- pending | sent | failed | cancelled
  scheduled_for date not null,
  sent_at timestamptz,
  error_message text,
  tracking_pixel_id uuid default gen_random_uuid(),
  opened_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes
create index on cold_email.contacts(campaign_id);
create index on cold_email.contacts(status);
create index on cold_email.send_log(contact_id);
create index on cold_email.send_log(campaign_id);
create index on cold_email.send_log(scheduled_for, status);
create index on cold_email.sequence_steps(campaign_id, step_number);

-- Trigger: cancel pending sends when contact status changes to replied/unsubscribed/bounced
create or replace function cold_email.cancel_pending_sends()
returns trigger as $$
begin
  if NEW.status in ('replied', 'unsubscribed', 'bounced') then
    update cold_email.send_log
    set status = 'cancelled'
    where contact_id = NEW.id
    and status = 'pending';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger on_contact_status_change
after update of status on cold_email.contacts
for each row
execute function cold_email.cancel_pending_sends();