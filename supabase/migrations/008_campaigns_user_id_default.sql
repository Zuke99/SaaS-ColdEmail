-- Ensure user_id defaults to the authenticated user when RLS runs
alter table cold_email.campaigns
  alter column user_id set default auth.uid ();

notify pgrst, 'reload schema';
