-- Vendor Profile needs a full street address, distinct from the city-only
-- business_address dropdown used at registration for location filtering.
alter table public.vendors
  add column if not exists office_address text;
