# Travo — Kerala travel marketplace

A multi-vendor travel marketplace connecting travellers with Kerala travel agencies, independent tour operators, vehicle owners and bus/fleet operators.

| Part | Stack | Path |
| --- | --- | --- |
| Traveller mobile app | Expo SDK 58 · React Native 0.88 · Expo Router · TanStack Query · React Hook Form + Zod · Lucide | `apps/mobile` |
| Admin dashboard | Next.js 16 (static export) · Tailwind · TanStack Query · React Hook Form + Zod · Recharts | `apps/admin` |
| Shared core | Domain types, Zod schemas, demo seed data, data adapters (demo + Supabase), filters, payment & auth abstractions | `packages/core` |
| Database | Supabase Postgres: schema, RLS, RPCs, storage, realtime sync, seed | `supabase/` |

## Download the Android app

Every push that touches the app builds a release APK with GitHub Actions (`.github/workflows/android-apk.yml`) and publishes it under **Releases**. Download the `.apk` on an Android phone and open it (allow "Install unknown apps" if prompted).

Builds are signed with a development key, which is fine for testing and sideloading. Play Store releases need an upload keystore.

## Live backend (Supabase)

Both apps connect to the Travo Supabase project by default (`packages/core/src/config.ts`, public publishable key only).

- **Live sync:** every write bumps a per-table version in `sync_state` (database triggers). Both apps subscribe through Supabase Realtime and refetch affected screens, so changes made in the admin dashboard — new places, photos, packages, prices, trips, vehicles, booking status — appear in the mobile app within seconds.
- **Security:** Row Level Security on every table. The public key can read only published catalogue data. Travellers create bookings/enquiries and look up their own booking (reference + phone) through validated `SECURITY DEFINER` functions; prices are computed server-side. Admin writes require a signed-in account with an admin/staff role.
- **First admin:** open the dashboard → *Create the admin account*. The first account becomes Super Admin; later sign-ups get no access until a Super Admin assigns a role in **Settings → Team**. (If email confirmation is on in Supabase Auth, confirm the email first.)
- **Photos:** uploads go to the public `media` storage bucket. Demo photos are real, freely licensed Wikimedia Commons photos of each place (`assets/photos`, credits in `assets/photos/credits.json`).
- **Migrations & seed:** `supabase/migrations/*.sql`, `supabase/seed.sql` (regenerate with `npm run db:seed:generate`).

## Admin dashboard

Overview (KPIs + charts), Packages, Scheduled Trips, Vehicles, Destinations, Operators, Bookings (+ custom enquiries, CSV export), Payments (record offline payments), Travellers, Reviews, Settings (team roles, permissions, payment gateway status).

Hosting: `.github/workflows/admin-pages.yml` publishes it to GitHub Pages. One-time setup: repository **Settings → Pages → Source: GitHub Actions**. It is a static site; all access control is enforced by Supabase.

```bash
npm run admin        # local dev on http://localhost:3100
```

## Data modes

The app talks to data only through the `DataAdapter` interface (`packages/core/src/services/adapter.ts`).

- **Supabase (default):** live shared data as described above.
- **Demo mode:** set `EXPO_PUBLIC_DATA_MODE=demo` (mobile) or `NEXT_PUBLIC_DATA_MODE=demo` (admin) to run on persistent sample data stored on the device/browser, with no backend.
- Sample operators are fictitious and labelled "(Demo)"; the app will not open WhatsApp/calls to their placeholder numbers. Replace them with real operators in the dashboard.
- Never put a Supabase service-role/secret key in any client.

## Develop

```bash
npm install
```

```bash
npm run mobile        # Expo dev server (scan with a development build / Expo Go)
```

```bash
npm run mobile:web    # run the app in a browser
```

```bash
npm run typecheck && npm test
```

## Project rules

- Business data lives in `packages/core/src/data/seed`, never inside UI components.
- All reads/writes go through the adapter / TanStack Query hooks (`apps/mobile/src/lib/queries.ts`).
- Payments: `packages/core/src/services/payments.ts` is a provider placeholder. Online methods show "Coming soon"; no card details are collected and nothing is charged. Booking requests work independently of payments.
- Auth: `packages/core/src/services/auth.ts` defines roles (Super Admin, Admin, Agency, Vehicle Owner, Staff) and permissions for later vendor logins.
