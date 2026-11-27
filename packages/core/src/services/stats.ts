import type { ActivityItem, BookingStatus, DashboardStats } from '../types';
import { BOOKING_STATUSES } from '../types';
import type { DataSnapshot } from '../data/seed';
import { addDays, todayISO } from '../utils/format';

/** Dashboard aggregation shared by both adapters. */
export function computeDashboardStats(s: DataSnapshot, days = 30): DashboardStats {
  const today = todayISO();
  const destName = new Map(s.destinations.map((d) => [d.id, d.name]));
  const pkgById = new Map(s.packages.map((p) => [p.id, p]));

  const bookingsByStatus = BOOKING_STATUSES.map((status: BookingStatus) => ({
    status,
    count: s.bookings.filter((b) => b.status === status).length,
  }));

  const start = addDays(today, -(days - 1));
  const series = new Map<string, { bookings: number; enquiries: number }>();
  for (let i = 0; i < days; i++) series.set(addDays(start, i), { bookings: 0, enquiries: 0 });
  const localDay = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  for (const b of s.bookings) {
    const e = series.get(localDay(b.createdAt));
    if (e) e.bookings++;
  }
  for (const q of s.enquiries) {
    const e = series.get(localDay(q.createdAt));
    if (e) e.enquiries++;
  }

  const destStats = new Map<string, { bookings: number; packages: number }>();
  for (const p of s.packages) {
    const e = destStats.get(p.destinationId) ?? { bookings: 0, packages: 0 };
    e.packages++;
    e.bookings += p.bookingCount;
    destStats.set(p.destinationId, e);
  }

  const perf = s.packages
    .filter((p) => p.status === 'published')
    .map((p) => {
      const own = s.bookings.filter((b) => b.packageId === p.id && b.status !== 'rejected' && b.status !== 'cancelled');
      return {
        packageId: p.id,
        title: p.title,
        bookings: p.bookingCount,
        revenue: own.reduce((sum, b) => sum + b.estimatedTotal, 0),
        rating: p.rating,
      };
    })
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 8);

  const activity: ActivityItem[] = [
    ...s.bookings.map((b) => ({
      id: `b-${b.id}`,
      kind: 'booking' as const,
      message: `${b.contactName} requested ${pkgById.get(b.packageId ?? '')?.title ?? 'a trip'} (${b.reference})`,
      createdAt: b.createdAt,
    })),
    ...s.enquiries.map((q) => ({
      id: `q-${q.id}`,
      kind: 'enquiry' as const,
      message: `New ${q.type === 'vehicle' ? 'vehicle' : 'custom trip'} enquiry from ${q.contactName}: ${q.pickupLocation} → ${q.destination}`,
      createdAt: q.createdAt,
    })),
    ...s.packages.map((p) => ({ id: `p-${p.id}`, kind: 'package' as const, message: `Package updated: ${p.title}`, createdAt: p.updatedAt })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  return {
    totalPackages: s.packages.filter((p) => p.status !== 'archived').length,
    activePackages: s.packages.filter((p) => p.status === 'published').length,
    upcomingTrips: s.trips.filter((t) => t.departureDate >= today && t.status !== 'cancelled' && t.status !== 'completed').length,
    totalEnquiries: s.enquiries.length + s.bookings.length,
    pendingBookings: s.bookings.filter((b) => b.status === 'pending').length,
    confirmedBookings: s.bookings.filter((b) => b.status === 'confirmed').length,
    registeredOperators: s.operators.length,
    listedVehicles: s.vehicles.filter((v) => v.listingStatus === 'approved').length,
    bookingsByStatus,
    enquiriesOverTime: [...series.entries()].map(([date, v]) => ({ date, ...v })),
    popularDestinations: [...destStats.entries()]
      .map(([destinationId, v]) => ({ destinationId, name: destName.get(destinationId) ?? 'Unknown', ...v }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 6),
    packagePerformance: perf,
    recentActivity: activity,
  };
}
