alter table cold_email.send_log
  add column if not exists sent_by_cron boolean not null default false;
