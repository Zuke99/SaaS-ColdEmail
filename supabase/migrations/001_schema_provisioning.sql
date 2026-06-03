-- Run this entire file in Supabase Dashboard → SQL Editor → Run
-- PostgREST (Supabase API) cannot call RPC functions that return void.

create or replace function public.provision_app_schema(schema_name text)
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
    where s.schema_name = provision_app_schema.schema_name
  ) then
    execute format('create schema if not exists %I', schema_name);

    execute format('
      create table if not exists %I.profiles (
        id uuid references auth.users(id) on delete cascade,
        email text,
        full_name text,
        avatar_url text,
        plan text default ''free'',
        dodo_customer_id text,
        dodo_subscription_id text,
        dodo_payment_id text,
        subscription_ends_at timestamptz,
        cancelled_at timestamptz,
        created_at timestamptz default now(),
        updated_at timestamptz default now(),
        primary key (id)
      )
    ', schema_name);

    execute format(
      'alter table %I.profiles enable row level security',
      schema_name
    );

    execute format('
      create policy "Users can view own profile"
      on %I.profiles for select
      using (auth.uid() = id)
    ', schema_name);

    execute format('
      create policy "Users can update own profile"
      on %I.profiles for update
      using (auth.uid() = id)
    ', schema_name);

    execute format('
      create policy "Users can insert own profile"
      on %I.profiles for insert
      with check (auth.uid() = id)
    ', schema_name);

    execute format(
      'grant usage on schema %I to anon, authenticated, service_role',
      schema_name
    );
    execute format(
      'grant select, insert, update on %I.profiles to authenticated',
      schema_name
    );
    execute format(
      'grant select, insert, update on %I.profiles to service_role',
      schema_name
    );

    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.provision_app_schema(text) to service_role;

-- Refresh PostgREST schema cache so RPC is available immediately
notify pgrst, 'reload schema';
