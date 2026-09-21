-- Vendor Profile needs a public bucket to hold uploaded logo and cover images.
insert into storage.buckets (id, name, public)
values ('vendor-images', 'vendor-images', true)
on conflict (id) do nothing;
