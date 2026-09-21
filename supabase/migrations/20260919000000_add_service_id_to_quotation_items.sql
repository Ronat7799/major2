-- Lets a quotation line item optionally point back to the vendor's own
-- services row it came from, so the vendor dashboard's Top Services ranking
-- can aggregate real bookings/revenue per service instead of relying on the
-- free-text service_name a vendor types on every quotation.
--
-- Nullable and on delete set null: a line item can still be a one-off/custom
-- charge with no matching catalog service (and stays that way if the vendor
-- later deletes the service it pointed to) — service_name remains the
-- source of truth for what actually appears on the quotation.

alter table public.quotation_items
  add column service_id uuid references public.services(id) on delete set null;

create index idx_quotation_items_service_id on public.quotation_items(service_id);
