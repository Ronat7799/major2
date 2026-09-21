-- Vendor-initiated chat invites: before a booking exists, a vendor may
-- invite a customer to chat about a quotation the customer asked to revise.
-- Reuses conversations (same participants+messages shape as a booking-based
-- chat) instead of a new table. Existing rows keep booking_id set and
-- quotation_id null; status defaults to 'accepted' so every pre-existing
-- conversation is unaffected.

alter table public.conversations
  alter column booking_id drop not null;

alter table public.conversations
  add column quotation_id uuid,
  add column status text not null default 'accepted';

alter table public.conversations
  add constraint conversations_quotation_id_unique unique (quotation_id);

alter table public.conversations
  add constraint conversations_quotation_id_fkey
    foreign key (quotation_id) references public.quotation (id) on delete restrict;

alter table public.conversations
  add constraint conversations_status_check
    check (status in ('invited', 'accepted', 'declined'));

alter table public.conversations
  add constraint conversations_scope_check
    check (
      (booking_id is not null and quotation_id is null) or
      (booking_id is null and quotation_id is not null)
    );

create index conversations_quotation_id_idx on public.conversations (quotation_id);
