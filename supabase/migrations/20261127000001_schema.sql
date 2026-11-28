-- Travo marketplace schema.
-- Column names are snake_case versions of the TypeScript domain model in packages/core/src/types.ts.
-- "users" are Supabase Auth users (auth.users); app-specific data lives in public.user_profiles.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.district as enum (
  'Thiruvananthapuram','Kollam','Pathanamthitta','Alappuzha','Kottayam','Idukki','Ernakulam',
  'Thrissur','Palakkad','Malappuram','Kozhikode','Wayanad','Kannur','Kasaragod'
);
create type public.user_role as enum ('super_admin','admin','agency','vehicle_owner','staff','traveller');
create type public.operator_type as enum ('travel_agency','tour_operator','vehicle_owner','fleet_operator');
create type public.verification_status as enum ('pending','verified','rejected','suspended');
create type public.package_category as enum ('one_day','weekend','multi_day','family','couple','honeymoon','adventure','pilgrimage','group','luxury','budget','custom');
create type public.package_status as enum ('draft','published','unpublished','archived');
create type public.trip_type as enum ('private','group');
create type public.vehicle_category as enum ('hatchback','sedan','suv','muv','premium','jeep','tempo_traveller','mini_bus','tourist_bus','luxury_coach');
create type public.vehicle_listing_status as enum ('pending','approved','rejected');
create type public.pricing_unit as enum ('per_km','per_day','per_trip');
create type public.trip_status as enum ('scheduled','open','filling_fast','sold_out','departed','completed','cancelled');
create type public.booking_status as enum ('pending','confirmed','rejected','cancelled','completed');
create type public.enquiry_status as enum ('new','contacted','quoted','converted','closed');
create type public.enquiry_type as enum ('custom_trip','vehicle','package_question','general');
create type public.review_status as enum ('published','hidden','pending');
create type public.payment_method as enum ('upi','card','netbanking','wallet','pay_at_operator');
create type public.payment_status as enum ('not_started','pending','paid','failed','refunded');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Users & operators
-- ---------------------------------------------------------------------------
create table public.operator_types (
  code public.operator_type primary key,
  label text not null,
  description text not null default ''
);

create table public.operators (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  business_name text not null,
  type public.operator_type not null references public.operator_types(code),
  contact_name text not null default '',
  phone text not null,
  whatsapp text not null,
  email text not null,
  district public.district not null,
  address text not null default '',
  description text not null default '',
  logo text,
  verification_status public.verification_status not null default 'pending',
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  years_in_business integer not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index operators_type_idx on public.operators(type);
create index operators_district_idx on public.operators(district);

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'traveller',
  operator_id uuid references public.operators(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index user_profiles_operator_idx on public.user_profiles(operator_id);

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  district public.district not null,
  tagline text not null default '',
  description text not null default '',
  cover_image text not null,
  gallery text[] not null default '{}',
  attractions jsonb not null default '[]',
  best_experiences text[] not null default '{}',
  best_time_to_visit text not null default '',
  is_featured boolean not null default false,
  is_active boolean not null default true,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index destinations_district_idx on public.destinations(district);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  description text not null default '',
  destination_id uuid not null references public.destinations(id) on delete restrict,
  additional_destination_ids uuid[] not null default '{}',
  operator_id uuid not null references public.operators(id) on delete restrict,
  categories public.package_category[] not null default '{}',
  trip_type public.trip_type not null default 'private',
  duration_days integer not null check (duration_days between 1 and 30),
  duration_nights integer not null default 0 check (duration_nights >= 0),
  base_price integer not null check (base_price >= 0),
  discount_percent integer not null default 0 check (discount_percent between 0 and 90),
  min_group_size integer not null default 1,
  max_group_size integer not null default 10,
  vehicle_category public.vehicle_category not null,
  transport_details text not null default '',
  accommodation text not null default '',
  pickup_points text[] not null default '{}',
  drop_points text[] not null default '{}',
  pickup_districts public.district[] not null default '{}',
  inclusions text[] not null default '{}',
  exclusions text[] not null default '{}',
  cancellation_policy text not null default '',
  available_dates date[] not null default '{}',
  status public.package_status not null default 'draft',
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  booking_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_group_size >= min_group_size)
);
create index packages_destination_idx on public.packages(destination_id);
create index packages_operator_idx on public.packages(operator_id);
create index packages_status_idx on public.packages(status);
create index packages_categories_idx on public.packages using gin(categories);

create table public.package_images (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  url text not null,
  caption text,
  sort_order integer not null default 0
);
create index package_images_package_idx on public.package_images(package_id, sort_order);

create table public.package_itineraries (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  day_number integer not null,
  title text not null,
  description text not null default '',
  meals text[] not null default '{}',
  stay text
);
create index package_itineraries_package_idx on public.package_itineraries(package_id, day_number);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id) on delete restrict,
  title text not null,
  make text not null,
  model text not null,
  year integer not null,
  category public.vehicle_category not null,
  seating_capacity integer not null check (seating_capacity > 0),
  luggage_capacity text not null default '',
  is_ac boolean not null default true,
  driver_included boolean not null default true,
  pricing_unit public.pricing_unit not null,
  price numeric(10,2) not null check (price >= 0),
  minimum_charge numeric(10,2) not null default 0,
  base_district public.district not null,
  pickup_location text not null default '',
  amenities text[] not null default '{}',
  description text not null default '',
  is_available boolean not null default true,
  listing_status public.vehicle_listing_status not null default 'pending',
  registration_verified boolean not null default false,
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vehicles_operator_idx on public.vehicles(operator_id);
create index vehicles_category_idx on public.vehicles(category);

create table public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0
);
create index vehicle_images_vehicle_idx on public.vehicle_images(vehicle_id, sort_order);

create table public.scheduled_trips (
  id uuid primary key default gen_random_uuid(),
  package_id uuid references public.packages(id) on delete set null,
  title text not null,
  operator_id uuid not null references public.operators(id) on delete restrict,
  vehicle_id uuid references public.vehicles(id) on delete restrict,
  destination_id uuid not null references public.destinations(id) on delete restrict,
  departure_date date not null,
  return_date date not null,
  departure_time text not null default '06:00',
  departure_location text not null,
  departure_district public.district not null,
  total_seats integer not null check (total_seats > 0),
  seats_booked integer not null default 0 check (seats_booked >= 0),
  price_per_person integer not null check (price_per_person >= 0),
  status public.trip_status not null default 'open',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (return_date >= departure_date),
  check (seats_booked <= total_seats)
);
create index scheduled_trips_departure_idx on public.scheduled_trips(departure_date);
create index scheduled_trips_package_idx on public.scheduled_trips(package_id);
create index scheduled_trips_operator_idx on public.scheduled_trips(operator_id);
create index scheduled_trips_vehicle_idx on public.scheduled_trips(vehicle_id);
create index scheduled_trips_destination_idx on public.scheduled_trips(destination_id);

-- ---------------------------------------------------------------------------
-- Bookings, enquiries, payments
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  package_id uuid references public.packages(id) on delete set null,
  scheduled_trip_id uuid references public.scheduled_trips(id) on delete restrict,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  operator_id uuid not null references public.operators(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  travel_date date not null,
  adults integer not null check (adults >= 1),
  children integer not null default 0 check (children >= 0),
  pickup_location text not null,
  contact_name text not null,
  contact_phone text not null,
  contact_email text,
  special_requirements text,
  preferred_payment_method public.payment_method not null default 'pay_at_operator',
  estimated_total integer not null default 0,
  status public.booking_status not null default 'pending',
  internal_notes jsonb not null default '[]',
  source text not null default 'mobile' check (source in ('mobile','admin','whatsapp')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_status_idx on public.bookings(status);
create index bookings_package_idx on public.bookings(package_id);
create index bookings_trip_idx on public.bookings(scheduled_trip_id);
create index bookings_vehicle_idx on public.bookings(vehicle_id);
create index bookings_operator_idx on public.bookings(operator_id);
create index bookings_user_idx on public.bookings(user_id);
create index bookings_travel_date_idx on public.bookings(travel_date);
create index bookings_created_idx on public.bookings(created_at desc);

create table public.booking_passengers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  full_name text not null,
  age integer check (age is null or age between 0 and 120),
  passenger_type text not null default 'adult' check (passenger_type in ('adult','child'))
);
create index booking_passengers_booking_idx on public.booking_passengers(booking_id);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  type public.enquiry_type not null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  package_id uuid references public.packages(id) on delete set null,
  operator_id uuid references public.operators(id) on delete set null,
  pickup_location text not null,
  destination text not null,
  stops text[] not null default '{}',
  travel_date date not null,
  return_date date,
  passengers integer not null check (passengers >= 1),
  contact_name text not null,
  contact_phone text not null,
  contact_email text,
  message text,
  status public.enquiry_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index enquiries_status_idx on public.enquiries(status);
create index enquiries_vehicle_idx on public.enquiries(vehicle_id);
create index enquiries_package_idx on public.enquiries(package_id);
create index enquiries_operator_idx on public.enquiries(operator_id);

create table public.payment_records (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  provider text not null default 'offline',
  method public.payment_method not null,
  amount integer not null check (amount >= 0),
  currency text not null default 'INR',
  status public.payment_status not null default 'pending',
  provider_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payment_records_booking_idx on public.payment_records(booking_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  package_id uuid references public.packages(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete cascade,
  operator_id uuid not null references public.operators(id) on delete cascade,
  author_name text not null,
  author_city text not null default '',
  rating integer not null check (rating between 1 and 5),
  title text not null default '',
  body text not null default '',
  travel_month text not null default '',
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reviews_package_idx on public.reviews(package_id);
create index reviews_vehicle_idx on public.reviews(vehicle_id);
create index reviews_operator_idx on public.reviews(operator_id);

create table public.favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id uuid references public.packages(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((package_id is not null) <> (vehicle_id is not null)),
  unique (user_id, package_id),
  unique (user_id, vehicle_id)
);
create index favourites_package_idx on public.favourites(package_id);
create index favourites_vehicle_idx on public.favourites(vehicle_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['operators','user_profiles','destinations','packages','vehicles','scheduled_trips','bookings','enquiries','payment_records','reviews','notifications']
  loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Live sync: one row per table, bumped on every write. Clients subscribe to
-- this table via Supabase Realtime and refetch the affected data. It carries
-- no row data, so it is safe to expose publicly.
-- ---------------------------------------------------------------------------
create table public.sync_state (
  table_name text primary key,
  version bigint not null default 0,
  changed_at timestamptz not null default now()
);

create or replace function public.bump_sync_state() returns trigger
language plpgsql security definer set search_path = public as $$
declare t text := tg_argv[0];
begin
  insert into public.sync_state(table_name, version, changed_at) values (t, 1, now())
  on conflict (table_name) do update set version = sync_state.version + 1, changed_at = now();
  return null;
end $$;
revoke execute on function public.bump_sync_state() from public, anon, authenticated;

do $$
declare pair text[];
begin
  foreach pair slice 1 in array array[
    ['destinations','destinations'], ['operators','operators'], ['packages','packages'],
    ['package_images','packages'], ['package_itineraries','packages'], ['scheduled_trips','scheduled_trips'],
    ['vehicles','vehicles'], ['vehicle_images','vehicles'], ['bookings','bookings'],
    ['booking_passengers','bookings'], ['enquiries','enquiries'], ['reviews','reviews'], ['payment_records','payment_records']
  ]
  loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each statement execute function public.bump_sync_state(%L)',
      pair[1] || '_sync', pair[1], pair[2]
    );
  end loop;
end $$;

insert into public.sync_state(table_name)
select unnest(array['destinations','operators','packages','scheduled_trips','vehicles','bookings','enquiries','reviews','payment_records']);

alter publication supabase_realtime add table public.sync_state;
