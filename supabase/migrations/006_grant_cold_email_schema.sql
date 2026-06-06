-- Grants for PostgREST (anon / authenticated / service_role) on cold_email schema.
-- Required for gmail_credentials and any table created outside provision_app_schema.

grant usage on schema cold_email to anon, authenticated, service_role;

grant all on all tables in schema cold_email to service_role;

grant select, insert, update, delete on all tables in schema cold_email to authenticated;

-- Optional: allow anon read if you rely on unauthenticated API access (omit if not needed)
-- grant select on all tables in schema cold_email to anon;

alter default privileges in schema cold_email
  grant all on tables to service_role;

alter default privileges in schema cold_email
  grant select, insert, update, delete on tables to authenticated;

notify pgrst, 'reload schema';
