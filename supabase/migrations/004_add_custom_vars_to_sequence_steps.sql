-- Add custom_vars column for global placeholder values per sequence step
alter table cold_email.sequence_steps
add column if not exists custom_vars jsonb default '{}';
