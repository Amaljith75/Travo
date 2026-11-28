'use client';

import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import type { BookingFilters, PackageFilters, SyncTable, TripFilters, VehicleFilters } from '@travo/core';
import { api } from './data';

/** Which cached queries depend on which table — used for live refresh. */
export const TABLE_KEYS: Record<SyncTable, string[]> = {
  destinations: ['destinations', 'destination', 'stats', 'packages'],
  operators: ['operators', 'operator', 'stats'],
  packages: ['packages', 'package', 'stats'],
  scheduled_trips: ['trips', 'trip', 'stats'],
  vehicles: ['vehicles', 'vehicle', 'stats'],
  bookings: ['bookings', 'booking', 'stats', 'trips', 'trip'],
  enquiries: ['enquiries', 'stats'],
  reviews: ['reviews'],
  payment_records: ['payments'],
};

export const useStats = () => useQuery({ queryKey: ['stats'], queryFn: () => api.getDashboardStats() });
export const useDestinations = () => useQuery({ queryKey: ['destinations', 'all'], queryFn: () => api.listDestinations({ includeInactive: true }) });
export const useDestination = (id?: string | null) => useQuery({ queryKey: ['destination', id], queryFn: () => api.getDestination(id!), enabled: !!id });
export const usePackages = (f: PackageFilters = {}) => useQuery({ queryKey: ['packages', { ...f, includeUnpublished: true }], queryFn: () => api.listPackages({ ...f, includeUnpublished: true }) });
export const usePackage = (id?: string | null) => useQuery({ queryKey: ['package', id], queryFn: () => api.getPackage(id!), enabled: !!id });
export const useTrips = (f: TripFilters = {}) => useQuery({ queryKey: ['trips', { includePast: true, ...f }], queryFn: () => api.listTrips({ includePast: true, ...f }) });
export const useTrip = (id?: string | null) => useQuery({ queryKey: ['trip', id], queryFn: () => api.getTrip(id!), enabled: !!id });
export const useVehicles = (f: VehicleFilters = {}) => useQuery({ queryKey: ['vehicles', { ...f, includeAll: true }], queryFn: () => api.listVehicles({ ...f, includeAll: true }) });
export const useVehicle = (id?: string | null) => useQuery({ queryKey: ['vehicle', id], queryFn: () => api.getVehicle(id!), enabled: !!id });
export const useOperators = () => useQuery({ queryKey: ['operators'], queryFn: () => api.listOperators() });
export const useOperator = (id?: string | null) => useQuery({ queryKey: ['operator', id], queryFn: () => api.getOperator(id!), enabled: !!id });
export const useBookings = (f: BookingFilters = {}) => useQuery({ queryKey: ['bookings', f], queryFn: () => api.listBookings(f) });
export const useBooking = (id?: string | null) => useQuery({ queryKey: ['booking', id], queryFn: () => api.getBooking(id!), enabled: !!id });
export const useEnquiries = () => useQuery({ queryKey: ['enquiries'], queryFn: () => api.listEnquiries() });
export const useReviews = () => useQuery({ queryKey: ['reviews', 'all'], queryFn: () => api.listReviews({ includeHidden: true }) });
export const usePayments = (bookingId?: string) => useQuery({ queryKey: ['payments', bookingId ?? 'all'], queryFn: () => api.listPayments(bookingId) });

/** Mutation that refreshes the given query groups on success. */
export function useSave<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>, invalidate: string[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all(invalidate.map((k) => qc.invalidateQueries({ queryKey: [k] as QueryKey }))),
  });
}
