/**
 * Public backend configuration shared by the mobile app and admin dashboard.
 *
 * The publishable key is safe to ship in client code: every table is protected
 * by Row Level Security, and admin writes require a signed-in admin account.
 * NEVER put the service-role / secret key in any client.
 *
 * Override with EXPO_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL (and the
 * matching *_ANON_KEY), or set *_DATA_MODE=demo to run on local sample data.
 */
export const TRAVO_SUPABASE = {
  url: 'https://zwaujrrlupjocitaqtvo.supabase.co',
  publishableKey: 'sb_publishable_73zX6uHGFQVTHN89RqPOJg_-CFHBK1g',
} as const;
