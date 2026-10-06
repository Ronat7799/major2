alter table public.quotation
  add column if not exists expires_at timestamptz;
