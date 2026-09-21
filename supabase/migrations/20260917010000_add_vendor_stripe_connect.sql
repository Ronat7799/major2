-- Stripe Connect Express account for vendor payouts. A vendor must have
-- charges_enabled before any customer payment can be created for their
-- bookings (see paymentService.createPaymentIntentForBooking) — these
-- cached booleans are self-healed from Stripe's live status whenever we
-- check them, and kept in sync going forward by the account.updated webhook.
alter table public.vendors
  add column if not exists stripe_account_id text,
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists stripe_payouts_enabled boolean not null default false;

create unique index if not exists vendors_stripe_account_id_key
  on public.vendors (stripe_account_id)
  where stripe_account_id is not null;
