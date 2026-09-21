-- Quotation revisions: before payment, a customer may ask for changes and the
-- vendor sends a new quotation row instead of silently overwriting the old
-- one. This requires relaxing the one-quotation-per-request constraint (a
-- revision chain is now multiple rows per request) and widening the status
-- list to include the two new in-between states. Both changes are additive;
-- no existing column is renamed or removed.

alter table public.quotation
  drop constraint quotation_request_id_unique;

create index quotation_quotation_request_id_idx on public.quotation (quotation_request_id);

alter table public.quotation
  add column parent_quotation_id uuid,
  add column revision_number integer not null default 1,
  add column revision_note text,
  add column revised_at timestamptz;

alter table public.quotation
  add constraint quotation_parent_quotation_id_fkey
    foreign key (parent_quotation_id) references public.quotation (id) on delete set null;

create index quotation_parent_quotation_id_idx on public.quotation (parent_quotation_id);

alter table public.quotation
  drop constraint quotation_status_check;

alter table public.quotation
  add constraint quotation_status_check
    check (status in ('pending', 'accepted', 'cancelled', 'revision_requested', 'revised'));
