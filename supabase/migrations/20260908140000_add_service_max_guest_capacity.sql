-- Service form now captures a guest capacity range; minimum_guest_capacity already
-- exists but the table has no maximum counterpart yet.
alter table public.services
  add column maximum_guest_capacity integer;

alter table public.services
  add constraint services_maximum_guest_capacity_check
  check (maximum_guest_capacity is null or maximum_guest_capacity >= 0);

alter table public.services
  add constraint services_guest_capacity_range_check
  check (
    maximum_guest_capacity is null
    or minimum_guest_capacity is null
    or minimum_guest_capacity <= maximum_guest_capacity
  );
