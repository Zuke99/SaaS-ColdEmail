-- Run in Supabase SQL Editor after 001_schema_provisioning.sql
-- Adds payment columns to an existing app schema (replace youtube_toolkit with your NEXT_PUBLIC_APP_ID)

create or replace function public.migrate_app_profiles_payments(schema_name text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if schema_name !~ '^[a-z][a-z0-9_]{1,48}$' then
    raise exception 'Invalid schema name: %', schema_name;
  end if;

  if not exists (
    select 1
    from information_schema.schemata s
    where s.schema_name = migrate_app_profiles_payments.schema_name
  ) then
    raise exception 'Schema % does not exist', schema_name;
  end if;

  execute format(
    'alter table %I.profiles
      add column if not exists dodo_customer_id text,
      add column if not exists dodo_subscription_id text,
      add column if not exists dodo_payment_id text,
      add column if not exists subscription_ends_at timestamptz,
      add column if not exists cancelled_at timestamptz',
    schema_name
  );

  return true;
end;
$$;

grant execute on function public.migrate_app_profiles_payments(text) to service_role;

-- Example: migrate your app schema
-- select public.migrate_app_profiles_payments('youtube_toolkit');

notify pgrst, 'reload schema';
