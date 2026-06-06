-- Per-user ownership for cold email data + RLS

-- 1. campaigns owned by auth user
alter table cold_email.campaigns
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

delete from cold_email.campaigns where user_id is null;

alter table cold_email.campaigns
  alter column user_id set not null;

create index if not exists campaigns_user_id_idx on cold_email.campaigns (user_id);

-- 2. gmail credentials per user (one connection per user)
alter table cold_email.gmail_credentials
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

delete from cold_email.gmail_credentials where user_id is null;

alter table cold_email.gmail_credentials
  alter column user_id set not null;

alter table cold_email.gmail_credentials
  drop constraint if exists gmail_credentials_sender_email_key;

create unique index if not exists gmail_credentials_user_id_key
  on cold_email.gmail_credentials (user_id);

-- 3. Row level security
alter table cold_email.campaigns enable row level security;
alter table cold_email.contacts enable row level security;
alter table cold_email.sequence_steps enable row level security;
alter table cold_email.send_log enable row level security;
alter table cold_email.gmail_credentials enable row level security;

-- campaigns
drop policy if exists campaigns_select_own on cold_email.campaigns;
drop policy if exists campaigns_insert_own on cold_email.campaigns;
drop policy if exists campaigns_update_own on cold_email.campaigns;
drop policy if exists campaigns_delete_own on cold_email.campaigns;

create policy campaigns_select_own on cold_email.campaigns
  for select using (auth.uid () = user_id);

create policy campaigns_insert_own on cold_email.campaigns
  for insert with check (auth.uid () = user_id);

create policy campaigns_update_own on cold_email.campaigns
  for update using (auth.uid () = user_id);

create policy campaigns_delete_own on cold_email.campaigns
  for delete using (auth.uid () = user_id);

-- child tables via campaign ownership
drop policy if exists contacts_own on cold_email.contacts;
drop policy if exists sequence_steps_own on cold_email.sequence_steps;
drop policy if exists send_log_own on cold_email.send_log;

create policy contacts_own on cold_email.contacts
  for all
  using (
    exists (
      select 1
      from cold_email.campaigns c
      where c.id = contacts.campaign_id and c.user_id = auth.uid ()
    )
  )
  with check (
    exists (
      select 1
      from cold_email.campaigns c
      where c.id = contacts.campaign_id and c.user_id = auth.uid ()
    )
  );

create policy sequence_steps_own on cold_email.sequence_steps
  for all
  using (
    exists (
      select 1
      from cold_email.campaigns c
      where c.id = sequence_steps.campaign_id and c.user_id = auth.uid ()
    )
  )
  with check (
    exists (
      select 1
      from cold_email.campaigns c
      where c.id = sequence_steps.campaign_id and c.user_id = auth.uid ()
    )
  );

create policy send_log_own on cold_email.send_log
  for all
  using (
    exists (
      select 1
      from cold_email.campaigns c
      where c.id = send_log.campaign_id and c.user_id = auth.uid ()
    )
  )
  with check (
    exists (
      select 1
      from cold_email.campaigns c
      where c.id = send_log.campaign_id and c.user_id = auth.uid ()
    )
  );

-- gmail credentials
drop policy if exists gmail_credentials_own on cold_email.gmail_credentials;

create policy gmail_credentials_own on cold_email.gmail_credentials
  for all
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);

notify pgrst, 'reload schema';
