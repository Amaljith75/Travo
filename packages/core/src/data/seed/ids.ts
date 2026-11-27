/**
 * Deterministic UUIDs for demo records so the SQL seed, the demo adapter and
 * any deep links all agree on identifiers.
 */
const pad = (n: number) => String(n).padStart(12, '0');

export const destId = (n: number) => `d0000000-0000-4000-8000-${pad(n)}`;
export const opId = (n: number) => `a0000000-0000-4000-8000-${pad(n)}`;
export const pkgId = (n: number) => `b0000000-0000-4000-8000-${pad(n)}`;
export const tripId = (n: number) => `c0000000-0000-4000-8000-${pad(n)}`;
export const vehId = (n: number) => `e0000000-0000-4000-8000-${pad(n)}`;
export const bookingId = (n: number) => `f0000000-0000-4000-8000-${pad(n)}`;
export const reviewId = (n: number) => `10000000-0000-4000-8000-${pad(n)}`;
export const enquiryId = (n: number) => `20000000-0000-4000-8000-${pad(n)}`;
/** Child rows (images, itinerary days): one hex prefix char, 3-digit parent, 4-digit index. */
export const childId = (prefix: string, parent: number, n: number) =>
  `${prefix}${String(parent).padStart(3, '0')}${String(n).padStart(4, '0')}-0000-4000-8000-000000000000`;

export const DEMO_TIMESTAMP = '2026-09-01T09:00:00.000Z';
