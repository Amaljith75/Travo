import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateBookingInput, CreateEnquiryInput, PackageFilters, TripFilters, VehicleFilters } from '@travo/core';
import { api } from './data';

export const keys = {
  destinations: (featured?: boolean) => ['destinations', { featured }] as const,
  destination: (id: string) => ['destination', id] as const,
  packages: (f: PackageFilters) => ['packages', f] as const,
  pkg: (id: string) => ['package', id] as const,
  trips: (f: TripFilters) => ['trips', f] as const,
  trip: (id: string) => ['trip', id] as const,
  vehicles: (f: VehicleFilters) => ['vehicles', f] as const,
  vehicle: (id: string) => ['vehicle', id] as const,
  operators: ['operators'] as const,
  operator: (id: string) => ['operator', id] as const,
  reviews: (o: object) => ['reviews', o] as const,
  booking: (ref: string) => ['booking', ref] as const,
};

export const useDestinations = (featuredOnly?: boolean) =>
  useQuery({ queryKey: keys.destinations(featuredOnly), queryFn: () => api.listDestinations({ featuredOnly }) });

export const useDestination = (idOrSlug: string | undefined) =>
  useQuery({ queryKey: keys.destination(idOrSlug ?? ''), queryFn: () => api.getDestination(idOrSlug!), enabled: !!idOrSlug });

export const usePackages = (filters: PackageFilters = {}) =>
  useQuery({ queryKey: keys.packages(filters), queryFn: () => api.listPackages(filters) });

export const usePackage = (idOrSlug: string | undefined) =>
  useQuery({ queryKey: keys.pkg(idOrSlug ?? ''), queryFn: () => api.getPackage(idOrSlug!), enabled: !!idOrSlug });

export const useTrips = (filters: TripFilters = {}) => useQuery({ queryKey: keys.trips(filters), queryFn: () => api.listTrips(filters) });

export const useTrip = (id: string | undefined) => useQuery({ queryKey: keys.trip(id ?? ''), queryFn: () => api.getTrip(id!), enabled: !!id });

export const useVehicles = (filters: VehicleFilters = {}) =>
  useQuery({ queryKey: keys.vehicles(filters), queryFn: () => api.listVehicles(filters) });

export const useVehicle = (id: string | undefined) =>
  useQuery({ queryKey: keys.vehicle(id ?? ''), queryFn: () => api.getVehicle(id!), enabled: !!id });

export const useOperators = () => useQuery({ queryKey: keys.operators, queryFn: () => api.listOperators(), staleTime: 5 * 60_000 });

/** Operators keyed by id, for card labels. */
export function useOperatorMap() {
  const q = useOperators();
  return new Map((q.data ?? []).map((o) => [o.id, o]));
}

export function useDestinationMap() {
  const q = useDestinations();
  return new Map((q.data ?? []).map((d) => [d.id, d]));
}

export const useOperator = (id: string | undefined) =>
  useQuery({ queryKey: keys.operator(id ?? ''), queryFn: () => api.getOperator(id!), enabled: !!id });

export const useReviews = (opts: { packageId?: string; vehicleId?: string; operatorId?: string }) =>
  useQuery({ queryKey: keys.reviews(opts), queryFn: () => api.listReviews(opts) });

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingInput) => api.createBooking(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['trip'] });
    },
  });
}

export const useCreateEnquiry = () => useMutation({ mutationFn: (input: CreateEnquiryInput) => api.createEnquiry(input) });

export const useBookingLookup = (reference: string | undefined, phone: string | undefined) =>
  useQuery({
    queryKey: keys.booking(`${reference}|${phone}`),
    queryFn: () => api.lookupBooking(reference!, phone!),
    enabled: !!reference && !!phone,
  });
