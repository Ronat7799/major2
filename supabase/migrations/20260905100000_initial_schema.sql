-- Reabjom — initial PostgreSQL schema (Supabase)
-- One request = one customer + one vendor
-- Vendor quotes or declines; customer accept creates booking + conversation
-- Chat unlocks on accept, before payment

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  password text not null,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_unique unique (email),
  constraint users_email_format check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint users_role_check check (role in ('customer', 'vendor'))
);

create index users_role_idx on public.users (role);

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- vendors (exactly one profile per vendor user)
-- ---------------------------------------------------------------------------
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_name text not null,
  contact_person text,
  business_category text,
  business_address text,
  verification_document_url text,
  languages_spoken text[],
  year_of_experience integer,
  profile_image text,
  cover_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendors_user_id_unique unique (user_id),
  constraint vendors_user_id_fkey foreign key (user_id) references public.users (id) on delete restrict,
  constraint vendors_year_of_experience_check check (year_of_experience is null or year_of_experience >= 0)
);

create index vendors_business_category_idx on public.vendors (business_category);

create trigger vendors_set_updated_at
before update on public.vendors
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null,
  service_name text not null,
  service_category text,
  starting_price numeric(12, 2),
  minimum_guest_capacity integer,
  estimated_setup_time text,
  service_description text,
  availability text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_vendor_id_fkey foreign key (vendor_id) references public.vendors (id) on delete cascade,
  constraint services_starting_price_check check (starting_price is null or starting_price >= 0),
  constraint services_minimum_guest_capacity_check check (minimum_guest_capacity is null or minimum_guest_capacity >= 0)
);

create index services_vendor_id_idx on public.services (vendor_id);
create index services_service_category_idx on public.services (service_category);

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- portfolio (images belong to a service)
-- ---------------------------------------------------------------------------
create table public.portfolio (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null,
  image_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_service_id_fkey foreign key (service_id) references public.services (id) on delete cascade
);

create index portfolio_service_id_idx on public.portfolio (service_id);

create trigger portfolio_set_updated_at
before update on public.portfolio
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- quotation_requests (one customer → one vendor per row)
-- ---------------------------------------------------------------------------
create table public.quotation_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  vendor_id uuid not null,
  event_type text,
  event_date date,
  start_time time,
  end_time time,
  event_location text,
  guests_min integer,
  guests_max integer,
  budget_min numeric(12, 2),
  budget_max numeric(12, 2),
  additional_event_description text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotation_requests_customer_id_fkey foreign key (customer_id) references public.users (id) on delete restrict,
  constraint quotation_requests_vendor_id_fkey foreign key (vendor_id) references public.vendors (id) on delete restrict,
  constraint quotation_requests_status_check check (
    status in ('pending', 'quoted', 'declined', 'accepted', 'cancelled')
  ),
  constraint quotation_requests_guests_check check (
    guests_min is null or guests_min >= 0
  ),
  constraint quotation_requests_guests_range_check check (
    guests_max is null or guests_min is null or guests_min <= guests_max
  ),
  constraint quotation_requests_budget_check check (
    (budget_min is null or budget_min >= 0)
    and (budget_max is null or budget_max >= 0)
  ),
  constraint quotation_requests_budget_range_check check (
    budget_max is null or budget_min is null or budget_min <= budget_max
  ),
  constraint quotation_requests_time_range_check check (
    start_time is null or end_time is null or start_time <= end_time
  )
);

create index quotation_requests_customer_id_idx on public.quotation_requests (customer_id);
create index quotation_requests_vendor_id_idx on public.quotation_requests (vendor_id);
create index quotation_requests_status_idx on public.quotation_requests (status);
create index quotation_requests_event_date_idx on public.quotation_requests (event_date);

-- At most one open request (pending or quoted) per customer + vendor
create unique index quotation_requests_one_open_per_vendor_idx
  on public.quotation_requests (customer_id, vendor_id)
  where status in ('pending', 'quoted');

create trigger quotation_requests_set_updated_at
before update on public.quotation_requests
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- quotation_requests_services (categories on the request, not a service FK)
-- ---------------------------------------------------------------------------
create table public.quotation_requests_services (
  id uuid primary key default gen_random_uuid(),
  quotation_request_id uuid not null,
  service_category text not null,
  constraint quotation_requests_services_request_fkey
    foreign key (quotation_request_id) references public.quotation_requests (id) on delete cascade
);

create index quotation_requests_services_request_idx
  on public.quotation_requests_services (quotation_request_id);

-- ---------------------------------------------------------------------------
-- quotation_requests_image
-- ---------------------------------------------------------------------------
create table public.quotation_requests_image (
  id uuid primary key default gen_random_uuid(),
  quotation_request_id uuid not null,
  image_url text not null,
  created_at timestamptz not null default now(),
  constraint quotation_requests_image_request_fkey
    foreign key (quotation_request_id) references public.quotation_requests (id) on delete cascade
);

create index quotation_requests_image_request_idx
  on public.quotation_requests_image (quotation_request_id);

-- ---------------------------------------------------------------------------
-- quotation (at most one per request; created only if vendor quotes)
-- ---------------------------------------------------------------------------
create table public.quotation (
  id uuid primary key default gen_random_uuid(),
  quotation_request_id uuid not null,
  vendor_id uuid not null,
  service_subtotal numeric(12, 2) not null default 0,
  additional_charges numeric(12, 2) not null default 0,
  platform_fee numeric(12, 2) not null default 0,
  grand_total numeric(12, 2) not null default 0,
  service_message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotation_request_id_unique unique (quotation_request_id),
  constraint quotation_quotation_request_id_fkey
    foreign key (quotation_request_id) references public.quotation_requests (id) on delete restrict,
  constraint quotation_vendor_id_fkey
    foreign key (vendor_id) references public.vendors (id) on delete restrict,
  constraint quotation_status_check check (status in ('pending', 'accepted', 'cancelled')),
  constraint quotation_service_subtotal_check check (service_subtotal >= 0),
  constraint quotation_additional_charges_check check (additional_charges >= 0),
  constraint quotation_platform_fee_check check (platform_fee >= 0),
  constraint quotation_grand_total_check check (grand_total >= 0)
);

create index quotation_vendor_id_idx on public.quotation (vendor_id);
create index quotation_status_idx on public.quotation (status);

create trigger quotation_set_updated_at
before update on public.quotation
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- quotation_items (price snapshot; not live service rows)
-- ---------------------------------------------------------------------------
create table public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null,
  service_name text not null,
  quantity integer not null default 1,
  unit_price numeric(12, 2) not null,
  total_price numeric(12, 2) not null,
  description text,
  constraint quotation_items_quotation_id_fkey
    foreign key (quotation_id) references public.quotation (id) on delete cascade,
  constraint quotation_items_quantity_check check (quantity > 0),
  constraint quotation_items_unit_price_check check (unit_price >= 0),
  constraint quotation_items_total_price_check check (total_price >= 0)
);

create index quotation_items_quotation_id_idx on public.quotation_items (quotation_id);

-- ---------------------------------------------------------------------------
-- quotation_additional_charges
-- ---------------------------------------------------------------------------
create table public.quotation_additional_charges (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null,
  charge_name text not null,
  charge_price numeric(12, 2) not null,
  constraint quotation_additional_charges_quotation_id_fkey
    foreign key (quotation_id) references public.quotation (id) on delete cascade,
  constraint quotation_additional_charges_price_check check (charge_price >= 0)
);

create index quotation_additional_charges_quotation_id_idx
  on public.quotation_additional_charges (quotation_id);

-- ---------------------------------------------------------------------------
-- bookings (created when customer accepts the quotation)
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null,
  vendor_id uuid not null,
  user_id uuid not null,
  booking_date date,
  start_time time,
  end_time time,
  status text not null default 'confirmed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_quotation_id_unique unique (quotation_id),
  constraint bookings_quotation_id_fkey
    foreign key (quotation_id) references public.quotation (id) on delete restrict,
  constraint bookings_vendor_id_fkey
    foreign key (vendor_id) references public.vendors (id) on delete restrict,
  constraint bookings_user_id_fkey
    foreign key (user_id) references public.users (id) on delete restrict,
  constraint bookings_status_check check (status in ('confirmed', 'completed', 'cancelled')),
  constraint bookings_time_range_check check (
    start_time is null or end_time is null or start_time <= end_time
  )
);

create index bookings_vendor_id_idx on public.bookings (vendor_id);
create index bookings_user_id_idx on public.bookings (user_id);
create index bookings_status_idx on public.bookings (status);
create index bookings_booking_date_idx on public.bookings (booking_date);

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- payments (after chat is already allowed)
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  amount numeric(12, 2) not null,
  payment_method text,
  transaction_id text,
  payment_status text not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_booking_id_fkey
    foreign key (booking_id) references public.bookings (id) on delete restrict,
  constraint payments_amount_check check (amount >= 0),
  constraint payments_status_check check (
    payment_status in ('pending', 'paid', 'failed', 'refunded')
  ),
  constraint payments_transaction_id_unique unique (transaction_id)
);

create index payments_booking_id_idx on public.payments (booking_id);
create index payments_payment_status_idx on public.payments (payment_status);

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- conversations (one per booking; created on quote accept)
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  user_id uuid not null,
  vendor_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_booking_id_unique unique (booking_id),
  constraint conversations_booking_id_fkey
    foreign key (booking_id) references public.bookings (id) on delete restrict,
  constraint conversations_user_id_fkey
    foreign key (user_id) references public.users (id) on delete restrict,
  constraint conversations_vendor_id_fkey
    foreign key (vendor_id) references public.vendors (id) on delete restrict
);

create index conversations_user_id_idx on public.conversations (user_id);
create index conversations_vendor_id_idx on public.conversations (vendor_id);

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- messages (sender is always users.id — vendor uses their user account)
-- ---------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id uuid not null,
  message text not null,
  message_type text not null default 'text',
  created_at timestamptz not null default now(),
  constraint messages_conversation_id_fkey
    foreign key (conversation_id) references public.conversations (id) on delete cascade,
  constraint messages_user_id_fkey
    foreign key (user_id) references public.users (id) on delete restrict,
  constraint messages_type_check check (message_type in ('text', 'image')),
  constraint messages_body_check check (length(btrim(message)) > 0)
);

create index messages_conversation_id_idx on public.messages (conversation_id);
create index messages_user_id_idx on public.messages (user_id);
create index messages_created_at_idx on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- reviews (one per booking; only completed bookings in application logic)
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  user_id uuid not null,
  vendor_id uuid not null,
  rating integer not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_booking_id_unique unique (booking_id),
  constraint reviews_booking_id_fkey
    foreign key (booking_id) references public.bookings (id) on delete restrict,
  constraint reviews_user_id_fkey
    foreign key (user_id) references public.users (id) on delete restrict,
  constraint reviews_vendor_id_fkey
    foreign key (vendor_id) references public.vendors (id) on delete restrict,
  constraint reviews_rating_check check (rating >= 1 and rating <= 5)
);

create index reviews_vendor_id_idx on public.reviews (vendor_id);
create index reviews_user_id_idx on public.reviews (user_id);

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();
