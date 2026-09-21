-- Splits a booking's payment into two stages — a fixed 30% deposit taken
-- up front and the remaining balance taken later — while keeping booking
-- confirmation itself unchanged (a booking is still 'confirmed' the
-- instant a quotation is accepted, before any payment exists).
--
-- Existing rows predate this feature and were always "pay the full
-- grand_total in one shot" — they get payment_type = 'full' via this
-- column's default, so a historical fully-paid booking keeps reading as
-- fully paid with no data backfill of its business meaning.

alter table public.payments
  add column payment_type text not null default 'full';

alter table public.payments
  add constraint payments_payment_type_check
    check (payment_type in ('deposit', 'balance', 'full'));

alter table public.payments
  add constraint payments_booking_id_payment_type_unique
    unique (booking_id, payment_type);

alter table public.payments
  alter column payment_type drop default;
