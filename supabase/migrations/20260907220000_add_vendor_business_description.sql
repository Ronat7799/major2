-- Vendor Profile feature needs a free-text business description field.
-- The vendors table already exists; this only adds the missing column.
alter table public.vendors
  add column if not exists business_description text;
