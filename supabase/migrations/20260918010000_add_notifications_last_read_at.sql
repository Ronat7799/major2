-- Powers the vendor Notifications page's "Mark All Read". Notifications
-- aren't a stored event log — same derived-from-existing-data approach as
-- the Recent Activity feed (quotation requests, payments, bookings,
-- reviews, messages) — so a single read cursor per user is all "mark all
-- read" needs: anything at or before this timestamp reads as read, anything
-- after reads as unread.
--
-- Existing users get the cursor set to now() so a vendor's years of past
-- activity doesn't all appear as unread the first time they open the page;
-- new users get it null (no cursor yet — nothing "read" until they mark it).
alter table public.users
  add column notifications_last_read_at timestamptz default now();

alter table public.users
  alter column notifications_last_read_at drop default;
