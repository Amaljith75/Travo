-- Row Level Security, role helpers, public RPCs and storage.
-- Public (anon) clients can only read published catalogue data. Traveller
-- writes go through SECURITY DEFINER functions that validate input and never
-- expose other people's bookings. Admin writes require a signed-in user whose
-- user_profiles.role allows it. The service-role key is never used by clients.

-- ---------------------------------------------------------------------------
-- Role helpers
-- ---------------------------------------------------------------------------
create or replace function public.current_role_name() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.user_profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('super_admin','admin') from public.user_profiles where id = auth.uid()), false)
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('super_admin','admin','staff') from public.user_profiles where id = auth.uid()), false)
$$;

-- New auth users get a profile. The very first user becomes super_admin
-- (bootstrap); everyone after that is a traveller until an admin promotes them.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles(id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when exists (select 1 from public.user_profiles where role = 'super_admin') then 'traveller' else 'super_admin' end
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.operator_types enable row level security;
alter table public.operators enable row level security;
alter table public.user_profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.packages enable row level security;
alter table public.package_images enable row level security;
alter table public.package_itineraries enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;
alter table public.scheduled_trips enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_passengers enable row level security;
alter table public.enquiries enable row level security;
alter table public.payment_records enable row level security;
alter table public.reviews enable row level security;
alter table public.favourites enable row level security;
alter table public.notifications enable row level security;
alter table public.sync_state enable row level security;

-- Public catalogue reads
create policy "operator types readable" on public.operator_types for select using (true);
create policy "operators readable" on public.operators for select using (true);
create policy "destinations readable" on public.destinations for select using (is_active or public.is_staff());
create policy "packages readable" on public.packages for select using (status = 'published' or public.is_staff());
create policy "package images readable" on public.package_images for select
  using (exists (select 1 from public.packages p where p.id = package_id and (p.status = 'published' or public.is_staff())));
create policy "package itineraries readable" on public.package_itineraries for select
  using (exists (select 1 from public.packages p where p.id = package_id and (p.status = 'published' or public.is_staff())));
create policy "vehicles readable" on public.vehicles for select using (listing_status = 'approved' or public.is_staff());
create policy "vehicle images readable" on public.vehicle_images for select
  using (exists (select 1 from public.vehicles v where v.id = vehicle_id and (v.listing_status = 'approved' or public.is_staff())));
create policy "trips readable" on public.scheduled_trips for select using (true);
create policy "reviews readable" on public.reviews for select using (status = 'published' or public.is_staff());
create policy "sync state readable" on public.sync_state for select using (true);

-- Admin catalogue writes
do $$
declare t text;
begin
  foreach t in array array['operator_types','operators','destinations','packages','package_images','package_itineraries','vehicles','vehicle_images','scheduled_trips']
  loop
    execute format('create policy %I on public.%I for insert with check (public.is_admin())', t || ' admin insert', t);
    execute format('create policy %I on public.%I for update using (public.is_admin()) with check (public.is_admin())', t || ' admin update', t);
    execute format('create policy %I on public.%I for delete using (public.is_admin())', t || ' admin delete', t);
  end loop;
end $$;

-- Bookings, enquiries, payments: staff can read/update, admins can create/delete.
do $$
declare t text;
begin
  foreach t in array array['bookings','booking_passengers','enquiries','payment_records']
  loop
    execute format('create policy %I on public.%I for select using (public.is_staff())', t || ' staff read', t);
    execute format('create policy %I on public.%I for update using (public.is_staff()) with check (public.is_staff())', t || ' staff update', t);
    execute format('create policy %I on public.%I for insert with check (public.is_staff())', t || ' staff insert', t);
    execute format('create policy %I on public.%I for delete using (public.is_admin())', t || ' admin delete', t);
  end loop;
end $$;

-- Reviews: staff moderate, admins delete.
create policy "reviews staff update" on public.reviews for update using (public.is_staff()) with check (public.is_staff());
create policy "reviews admin insert" on public.reviews for insert with check (public.is_admin());
create policy "reviews admin delete" on public.reviews for delete using (public.is_admin());

-- Profiles: users read their own; only admins change roles (no self-escalation).
create policy "profiles read own or admin" on public.user_profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles admin update" on public.user_profiles for update using (public.is_admin()) with check (public.is_admin());

-- Personal data
create policy "favourites own" on public.favourites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications own" on public.notifications for select using (user_id = auth.uid() or public.is_staff());
create policy "notifications mark read" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications staff write" on public.notifications for insert with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Traveller RPCs (no login required)
-- ---------------------------------------------------------------------------
create or replace function public.generate_reference(prefix text) returns text
language plpgsql as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  body text := '';
  i int;
begin
  for i in 1..6 loop
    body := body || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return prefix || '-' || to_char(now(), 'YY') || body;
end $$;

create or replace function public.create_booking_request(payload jsonb)
returns table(reference text, status public.booking_status, estimated_total integer, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_pkg public.packages;
  v_trip public.scheduled_trips;
  v_vehicle public.vehicles;
  v_adults int := (payload->>'adults')::int;
  v_children int := coalesce((payload->>'children')::int, 0);
  v_unit int;
  v_ref text;
  v_booking public.bookings;
  v_phone text := trim(payload->>'contact_phone');
begin
  if v_adults is null or v_adults < 1 or v_adults > 60 or v_children < 0 or v_children > 40 then
    raise exception 'Invalid number of travellers' using errcode = '22023';
  end if;
  if length(regexp_replace(coalesce(v_phone, ''), '\D', '', 'g')) not between 10 and 13 then
    raise exception 'Enter a valid mobile number' using errcode = '22023';
  end if;
  if length(trim(coalesce(payload->>'contact_name', ''))) < 2 or length(trim(coalesce(payload->>'pickup_location', ''))) < 2 then
    raise exception 'Name and pickup location are required' using errcode = '22023';
  end if;

  if payload->>'scheduled_trip_id' is not null then
    select * into v_trip from public.scheduled_trips where id = (payload->>'scheduled_trip_id')::uuid for update;
    if not found or v_trip.status in ('sold_out','cancelled','departed','completed') then
      raise exception 'This departure is not open for booking' using errcode = 'P0001';
    end if;
    if v_trip.total_seats - v_trip.seats_booked < v_adults + v_children then
      raise exception 'Only % seats left on this departure', v_trip.total_seats - v_trip.seats_booked using errcode = 'P0001';
    end if;
  end if;

  if coalesce(payload->>'package_id', v_trip.package_id::text) is not null then
    select * into v_pkg from public.packages where id = coalesce((payload->>'package_id')::uuid, v_trip.package_id);
    if not found or v_pkg.status <> 'published' then
      raise exception 'This package is not currently accepting bookings' using errcode = 'P0001';
    end if;
  end if;

  if payload->>'vehicle_id' is not null then
    select * into v_vehicle from public.vehicles where id = (payload->>'vehicle_id')::uuid and listing_status = 'approved';
  end if;

  if v_trip.id is null and v_pkg.id is null and v_vehicle.id is null then
    raise exception 'Select a trip to book' using errcode = 'P0001';
  end if;

  -- Price is always computed server-side.
  v_unit := coalesce(v_trip.price_per_person, round(v_pkg.base_price * (1 - v_pkg.discount_percent / 100.0))::int, 0);

  loop
    v_ref := public.generate_reference('TRV');
    exit when not exists (select 1 from public.bookings b where b.reference = v_ref);
  end loop;

  insert into public.bookings (
    reference, package_id, scheduled_trip_id, vehicle_id, operator_id, travel_date, adults, children,
    pickup_location, contact_name, contact_phone, contact_email, special_requirements,
    preferred_payment_method, estimated_total, status, source
  ) values (
    v_ref, coalesce(v_pkg.id, v_trip.package_id), v_trip.id, v_vehicle.id,
    coalesce(v_trip.operator_id, v_pkg.operator_id, v_vehicle.operator_id),
    coalesce(v_trip.departure_date, (payload->>'travel_date')::date),
    v_adults, v_children,
    left(trim(payload->>'pickup_location'), 200), left(trim(payload->>'contact_name'), 120), left(v_phone, 20),
    nullif(left(trim(coalesce(payload->>'contact_email', '')), 200), ''),
    nullif(left(trim(coalesce(payload->>'special_requirements', '')), 1000), ''),
    coalesce((payload->>'preferred_payment_method')::public.payment_method, 'pay_at_operator'),
    v_unit * v_adults + round(v_unit * 0.5)::int * v_children,
    'pending',
    case when payload->>'source' in ('mobile','whatsapp') then payload->>'source' else 'mobile' end
  ) returning * into v_booking;

  insert into public.booking_passengers(booking_id, full_name, passenger_type)
  values (v_booking.id, v_booking.contact_name, 'adult');

  return query select v_booking.reference, v_booking.status, v_booking.estimated_total, v_booking.created_at;
end $$;

-- Look up one booking by reference + phone. Internal notes are never returned.
create or replace function public.lookup_booking(p_reference text, p_phone text)
returns jsonb
language sql stable security definer set search_path = public as $$
  select (to_jsonb(b) - 'internal_notes' - 'user_id')
         || jsonb_build_object('internal_notes', '[]'::jsonb,
              'booking_passengers', coalesce((select jsonb_agg(to_jsonb(p)) from public.booking_passengers p where p.booking_id = b.id), '[]'::jsonb))
  from public.bookings b
  where b.reference = upper(trim(p_reference))
    and right(regexp_replace(b.contact_phone, '\D', '', 'g'), 10) = right(regexp_replace(p_phone, '\D', '', 'g'), 10)
  limit 1
$$;

create or replace function public.create_enquiry(payload jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_ref text;
  v_operator uuid;
begin
  if length(regexp_replace(coalesce(payload->>'contact_phone', ''), '\D', '', 'g')) not between 10 and 13 then
    raise exception 'Enter a valid mobile number' using errcode = '22023';
  end if;
  if payload->>'vehicle_id' is not null then
    select operator_id into v_operator from public.vehicles where id = (payload->>'vehicle_id')::uuid;
  end if;
  loop
    v_ref := public.generate_reference('ENQ');
    exit when not exists (select 1 from public.enquiries e where e.reference = v_ref);
  end loop;
  insert into public.enquiries (
    reference, type, vehicle_id, package_id, operator_id, pickup_location, destination, stops, travel_date, return_date,
    passengers, contact_name, contact_phone, contact_email, message
  ) values (
    v_ref,
    coalesce((payload->>'type')::public.enquiry_type, 'custom_trip'),
    (payload->>'vehicle_id')::uuid, (payload->>'package_id')::uuid, v_operator,
    left(trim(payload->>'pickup_location'), 200), left(trim(payload->>'destination'), 200),
    coalesce((select array_agg(left(x, 120)) from jsonb_array_elements_text(coalesce(payload->'stops', '[]'::jsonb)) x), '{}'),
    (payload->>'travel_date')::date, (payload->>'return_date')::date,
    greatest(1, least(60, coalesce((payload->>'passengers')::int, 1))),
    left(trim(payload->>'contact_name'), 120), left(trim(payload->>'contact_phone'), 20),
    nullif(left(trim(coalesce(payload->>'contact_email', '')), 200), ''),
    nullif(left(trim(coalesce(payload->>'message', '')), 1000), '')
  );
  return v_ref;
end $$;

-- Admin: change booking status and keep scheduled-trip seat counts consistent.
create or replace function public.admin_set_booking_status(p_booking_id uuid, p_status public.booking_status) returns void
language plpgsql security definer set search_path = public as $$
declare
  b public.bookings;
  holds_old boolean;
  holds_new boolean;
  delta int;
  t public.scheduled_trips;
begin
  if not public.is_staff() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  select * into b from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found' using errcode = 'P0002'; end if;
  holds_old := b.status in ('confirmed','completed');
  holds_new := p_status in ('confirmed','completed');
  if b.scheduled_trip_id is not null and holds_old <> holds_new then
    select * into t from public.scheduled_trips where id = b.scheduled_trip_id for update;
    delta := (b.adults + b.children) * (case when holds_new then 1 else -1 end);
    if delta > 0 and t.seats_booked + delta > t.total_seats then
      raise exception 'Not enough seats left on this departure to confirm' using errcode = 'P0001';
    end if;
    update public.scheduled_trips
       set seats_booked = greatest(0, seats_booked + delta),
           status = case
             when greatest(0, seats_booked + delta) >= total_seats and status <> 'cancelled' then 'sold_out'::public.trip_status
             when status = 'sold_out' then 'open'::public.trip_status
             else status end
     where id = t.id;
  end if;
  update public.bookings set status = p_status where id = p_booking_id;
end $$;

revoke all on function public.admin_set_booking_status(uuid, public.booking_status) from public, anon;
grant execute on function public.admin_set_booking_status(uuid, public.booking_status) to authenticated;
grant execute on function public.create_booking_request(jsonb) to anon, authenticated;
grant execute on function public.lookup_booking(text, text) to anon, authenticated;
grant execute on function public.create_enquiry(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: public-read photo bucket, admin-only writes
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;

create policy "media admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy "media admin update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());
create policy "media admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
