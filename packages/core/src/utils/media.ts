/**
 * Central photo registry.
 *
 * Demo photos are freely licensed images of the actual places, taken from
 * Wikimedia Commons (credits in assets/photos/credits.json) and served from
 * this repository through the jsDelivr CDN, pinned to a commit so they never
 * change underneath the app. Photos uploaded in the admin dashboard are stored
 * in Supabase Storage and saved as full URLs instead.
 */
export const PHOTO_COMMIT = '9d37dbc1a869121092f90bec5beec3b410706676';
const BASE = `https://cdn.jsdelivr.net/gh/Amaljith75/Travo@${PHOTO_COMMIT}/assets/photos`;

/** How many photos exist for each place key (place-1.jpg … place-N.jpg). */
export const PLACE_PHOTO_COUNT = {
  munnar: 4,
  wayanad: 4,
  vagamon: 3,
  alleppey: 4,
  thekkady: 4,
  varkala: 3,
  kovalam: 3,
  'fort-kochi': 3,
  athirappilly: 4,
  bekal: 3,
  ponmudi: 3,
  kumarakom: 3,
  idukki: 2,
  kozhikode: 3,
  sabarimala: 3,
  'munroe-island': 3,
  nelliyampathy: 3,
  nilambur: 3,
  kannur: 4,
  hero: 2,
} as const;
export type PlaceKey = keyof typeof PLACE_PHOTO_COUNT;

export const VEHICLE_PHOTO_KEYS = ['v-swift', 'v-etios', 'v-innova', 'v-xuv', 'v-thar', 'v-traveller', 'v-minibus', 'v-bus', 'v-coach', 'v-eclass'] as const;
export type VehiclePhotoKey = (typeof VEHICLE_PHOTO_KEYS)[number];

export function photoUrl(key: string, n = 1): string {
  return `${BASE}/${key}-${n}.jpg`;
}

/** All photos of a place, cover first. */
export function placePhotos(key: PlaceKey): string[] {
  return Array.from({ length: PLACE_PHOTO_COUNT[key] }, (_, i) => photoUrl(key, i + 1));
}

/** Kept for API compatibility; CDN photos are already sized for mobile. */
export function sizedImage(url: string, _width?: number): string {
  return url;
}

export const HERO_IMAGE = photoUrl('hero', 1);
