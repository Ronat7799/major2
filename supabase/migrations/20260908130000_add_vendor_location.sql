-- Vendor Profile needs a precise business location for Google Maps display.
alter table public.vendors
  add column if not exists full_address text,
  add column if not exists latitude numeric(10, 7),
  add column if not exists longitude numeric(10, 7);
