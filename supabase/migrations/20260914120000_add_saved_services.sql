create table public.saved_services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  service_id uuid not null,
  created_at timestamptz not null default now(),
  constraint saved_services_user_id_service_id_key unique (user_id, service_id),
  constraint saved_services_user_id_fkey
    foreign key (user_id) references public.users (id) on delete cascade,
  constraint saved_services_service_id_fkey
    foreign key (service_id) references public.services (id) on delete cascade
);

create index saved_services_user_id_idx on public.saved_services (user_id);
create index saved_services_service_id_idx on public.saved_services (service_id);

alter table public.saved_services enable row level security;
