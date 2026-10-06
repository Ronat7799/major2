alter table public.bookings
  add column if not exists deposit_due_at timestamptz;

alter table public.bookings
  drop constraint if exists bookings_status_check;

alter table public.bookings
  add constraint bookings_status_check
    check (status in ('confirmed', 'completed', 'cancelled', 'declined'));
