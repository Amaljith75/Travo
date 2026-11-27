# Travo — Kerala travel marketplace

A multi-vendor travel marketplace connecting travellers with Kerala travel agencies, independent tour operators, vehicle owners and bus/fleet operators.

| Part | Stack | Path |
| --- | --- | --- |
| Traveller mobile app | Expo SDK 58 · React Native 0.88 · Expo Router · TanStack Query · React Hook Form + Zod · Lucide | `apps/mobile` |
| Shared core | Domain types, Zod schemas, demo seed data, data adapters (demo + Supabase), filters, payment & auth abstractions | `packages/core` |

## Download the Android app

Every push that touches the app builds a release APK with GitHub Actions (`.github/workflows/android-apk.yml`) and publishes it under **Releases**. Download the `.apk` on an Android phone and open it (allow "Install unknown apps" if prompted).

Builds are signed with a development key, which is fine for testing and sideloading. Play Store releases need an upload keystore.

## Data modes

The app talks to data only through the `DataAdapter` interface (`packages/core/src/services/adapter.ts`).

- **Demo mode** (default): a real, persistent store on the device, seeded with sample Kerala destinations, packages, trips, vehicles and operators. Sample operators are fictitious and labelled "(Demo)"; WhatsApp/call buttons will not contact their placeholder numbers.
- **Supabase mode**: set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (as env vars locally, or as GitHub repository *variables* for CI builds). Only the public anon key is ever used in the app — never a service-role key.

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
