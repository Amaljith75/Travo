/**
 * Central photo registry.
 *
 * Every image URL used by the demo data lives here so photography can be
 * swapped in one place (e.g. for licensed shoots uploaded to Supabase Storage).
 * Both apps render images through a component with a branded fallback, so a
 * URL that fails to load degrades to a styled placeholder, never a blank box.
 *
 * Photos are served from the Unsplash CDN (free-to-use licence). Replace with
 * your own Supabase Storage URLs before launch.
 */

const unsplash = (id: string, width = 1400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=75`;

/** Resize helper for Unsplash URLs; other URLs are returned untouched. */
export function sizedImage(url: string, width: number): string {
  if (!url.includes('images.unsplash.com')) return url;
  return url.replace(/([?&])w=\d+/, `$1w=${width}`);
}

const IDS = {
  backwaters: '1602216056096-3b40cc0c9944',
  houseboat: '1593693411515-c20261bcad6e',
  teaHills: '1590077428593-a55bb07c4665',
  teaRows: '1598091383021-15ddea10925d',
  mistyHills: '1609920658906-8223bd289001',
  waterfall: '1626621341517-bbf3d9990a23',
  beachCliff: '1590123715937-e3d5a6ec8e65',
  palmBeach: '1588416936097-41850ab3d86d',
  fortKochi: '1580289143186-03f54224aad6',
  forest: '1544735716-392fe2489ffa',
  wildlife: '1561731216-c3a4d99437d5',
  meadow: '1580741186862-c5d0bf2aff33',
  temple: '1600100397608-f010e423b971',
  lighthouse: '1567157577867-05ccb1388e66',
  canoe: '1609340442473-aa0de1fcf57b',
  spices: '1596040033229-a9821ebd058d',
  // Vehicles
  sedan: '1549317661-bd32c8ce0db2',
  suv: '1519641471654-76ce0107ad1b',
  hatchback: '1494976388531-d1058494cdd8',
  jeep: '1533473359331-0135ef1b58bf',
  van: '1527786356703-4b100091cd2c',
  bus: '1544620347-c4fd4a3d5957',
  coach: '1570125909232-eb263c188f7e',
  premium: '1503376780353-7e6692767b70',
  muv: '1552519507-da3b142c6e3d',
} as const;

export type PhotoKey = keyof typeof IDS;

export function photo(key: PhotoKey, width = 1400): string {
  return unsplash(IDS[key], width);
}

export const HERO_IMAGE = photo('backwaters', 1800);
