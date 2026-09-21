-- Lets any user (customer or vendor) set a personal avatar, independent of
-- a vendor's own company logo (vendors.profile_image, unrelated column on a
-- different table) — used first by the customer profile page's photo upload.

alter table public.users
  add column profile_image text;
