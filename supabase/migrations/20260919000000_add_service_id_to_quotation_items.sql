alter table public.quotation_items
  add column service_id uuid references public.services(id) on delete set null;

create index idx_quotation_items_service_id on public.quotation_items(service_id);
