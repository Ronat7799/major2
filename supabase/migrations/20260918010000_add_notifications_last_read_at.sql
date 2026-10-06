alter table public.users
  add column notifications_last_read_at timestamptz default now();

alter table public.users
  alter column notifications_last_read_at drop default;
