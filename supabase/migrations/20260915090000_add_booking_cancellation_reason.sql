-- Vendor cancels a still-confirmed booking and records why, shown back to
-- the customer on the booking's own detail page. Nullable — most bookings
-- are never cancelled.
--
-- Backfill note: this column was already applied directly to the live
-- database on 2026-09-15 while building Cancel Booking, before this file
-- existed. Recorded here now so the migration history matches reality.

alter table public.bookings
  add column cancellation_reason text null;
