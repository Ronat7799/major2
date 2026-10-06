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
