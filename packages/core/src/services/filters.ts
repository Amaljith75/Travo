import type {
  Booking,
  BookingFilters,
  Destination,
  PackageFilters,
  ScheduledTrip,
  TravelPackage,
  TripFilters,
  Vehicle,
  VehicleFilters,
} from '../types';
import { discountedPrice, todayISO } from '../utils/format';

const norm = (s: string) => s.toLowerCase().normalize('NFKD');

export function effectivePrice(p: Pick<TravelPackage, 'basePrice' | 'discountPercent'>): number {
  return discountedPrice(p.basePrice, p.discountPercent);
}

/** Text match across a package and its destinations. */
function matchesQuery(p: TravelPackage, q: string, destinations: Map<string, Destination>): boolean {
  const words = norm(q).split(/\s+/).filter(Boolean);
  const dest = [p.destinationId, ...p.additionalDestinationIds].map((id) => destinations.get(id));
  const haystack = norm(
    [
      p.title,
      p.summary,
      p.categories.join(' '),
      p.pickupPoints.join(' '),
      p.pickupDistricts.join(' '),
      ...dest.flatMap((d) => (d ? [d.name, d.district, d.slug] : [])),
    ].join(' '),
  );
  return words.every((w) => haystack.includes(w));
}

export function filterPackages(
  packages: TravelPackage[],
  filters: PackageFilters,
  destinations: Destination[] = [],
): TravelPackage[] {
  const destMap = new Map(destinations.map((d) => [d.id, d]));
  const result = packages.filter((p) => {
    if (!filters.includeUnpublished && p.status !== 'published') return false;
    if (filters.query && !matchesQuery(p, filters.query, destMap)) return false;
    if (filters.destinationId && p.destinationId !== filters.destinationId && !p.additionalDestinationIds.includes(filters.destinationId))
      return false;
    if (filters.pickupDistrict && !p.pickupDistricts.includes(filters.pickupDistrict)) return false;
    if (filters.categories?.length && !filters.categories.some((c) => p.categories.includes(c))) return false;
    if (filters.vehicleCategories?.length && !filters.vehicleCategories.includes(p.vehicleCategory)) return false;
    if (filters.tripType && p.tripType !== filters.tripType) return false;
    const price = effectivePrice(p);
    if (filters.minPrice != null && price < filters.minPrice) return false;
    if (filters.maxPrice != null && price > filters.maxPrice) return false;
    if (filters.minDays != null && p.durationDays < filters.minDays) return false;
    if (filters.maxDays != null && p.durationDays > filters.maxDays) return false;
    if (filters.travellers != null && filters.travellers > p.maxGroupSize) return false;
    if (filters.travelDate && p.availableDates.length > 0 && !p.availableDates.includes(filters.travelDate)) return false;
    if (filters.featuredOnly && !p.isFeatured) return false;
    if (filters.trendingOnly && !p.isTrending) return false;
    if (filters.operatorId && p.operatorId !== filters.operatorId) return false;
    return true;
  });
  return sortPackages(result, filters.sort ?? 'recommended');
}

export function sortPackages(packages: TravelPackage[], sort: NonNullable<PackageFilters['sort']>): TravelPackage[] {
  const list = [...packages];
  switch (sort) {
    case 'price_asc':
      return list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    case 'price_desc':
      return list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    case 'popular':
      return list.sort((a, b) => b.bookingCount - a.bookingCount);
    case 'recent':
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'recommended':
    default:
      return list.sort((a, b) => recommendationScore(b) - recommendationScore(a));
  }
}

function recommendationScore(p: TravelPackage): number {
  return (p.isFeatured ? 30 : 0) + (p.isTrending ? 15 : 0) + p.rating * 10 + Math.log10(1 + p.bookingCount) * 8 + Math.log10(1 + p.reviewCount) * 4;
}

export function filterVehicles(vehicles: Vehicle[], filters: VehicleFilters): Vehicle[] {
  const q = filters.query ? norm(filters.query) : '';
  return vehicles
    .filter((v) => {
      if (!filters.includeAll && (v.listingStatus !== 'approved')) return false;
      if (q && !norm(`${v.title} ${v.make} ${v.model} ${v.baseDistrict} ${v.pickupLocation}`).includes(q)) return false;
      if (filters.categories?.length && !filters.categories.includes(v.category)) return false;
      if (filters.district && v.baseDistrict !== filters.district) return false;
      if (filters.minSeats != null && v.seatingCapacity < filters.minSeats) return false;
      if (filters.acOnly && !v.isAc) return false;
      if (filters.operatorId && v.operatorId !== filters.operatorId) return false;
      return true;
    })
    .sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable) || a.seatingCapacity - b.seatingCapacity);
}

export const seatsLeft = (t: Pick<ScheduledTrip, 'totalSeats' | 'seatsBooked'>) => Math.max(0, t.totalSeats - t.seatsBooked);

export function filterTrips(trips: ScheduledTrip[], filters: TripFilters): ScheduledTrip[] {
  const from = filters.fromDate ?? (filters.includePast ? '0000-00-00' : todayISO());
  return trips
    .filter((t) => {
      if (t.departureDate < from) return false;
      if (!filters.includePast && (t.status === 'cancelled' || t.status === 'completed')) return false;
      if (filters.destinationId && t.destinationId !== filters.destinationId) return false;
      if (filters.departureDistrict && t.departureDistrict !== filters.departureDistrict) return false;
      if (filters.operatorId && t.operatorId !== filters.operatorId) return false;
      if (filters.packageId && t.packageId !== filters.packageId) return false;
      if (filters.statuses?.length && !filters.statuses.includes(t.status)) return false;
      return true;
    })
    .sort((a, b) => a.departureDate.localeCompare(b.departureDate));
}

export function filterBookings(bookings: Booking[], filters: BookingFilters): Booking[] {
  const q = filters.query ? norm(filters.query.trim()) : '';
  return bookings
    .filter((b) => {
      if (q && !norm(`${b.reference} ${b.contactName} ${b.contactPhone} ${b.contactEmail ?? ''}`).includes(q)) return false;
      if (filters.status && b.status !== filters.status) return false;
      if (filters.packageId && b.packageId !== filters.packageId) return false;
      if (filters.operatorId && b.operatorId !== filters.operatorId) return false;
      if (filters.scheduledTripId && b.scheduledTripId !== filters.scheduledTripId) return false;
      if (filters.fromDate && b.travelDate < filters.fromDate) return false;
      if (filters.toDate && b.travelDate > filters.toDate) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Price estimate: children pay 50% of the adult fare. */
export function estimateTotal(unitPrice: number, adults: number, children: number): number {
  return unitPrice * adults + Math.round(unitPrice * 0.5) * children;
}
