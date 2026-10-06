alter table public.quotation_requests
  add column service_id uuid references public.services(id) on delete set null;

create index quotation_requests_service_id_idx on public.quotation_requests (service_id);
