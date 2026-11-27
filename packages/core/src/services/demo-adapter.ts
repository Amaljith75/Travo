import type { DataAdapter } from './adapter';
import { DataError } from './adapter';
import type {
  Booking,
  BookingFilters,
  BookingReceipt,
  BookingStatus,
  CreateBookingInput,
  CreateEnquiryInput,
  Destination,
  DestinationInput,
  Enquiry,
  EnquiryStatus,
  Operator,
  OperatorInput,
  PackageFilters,
  PackageInput,
  Review,
  ReviewStatus,
  ScheduledTrip,
  ScheduledTripInput,
  TravelPackage,
  TripFilters,
  Vehicle,
  VehicleFilters,
  VehicleInput,
} from '../types';
import { createSeedSnapshot, type DataSnapshot } from '../data/seed';
import { estimateTotal, effectivePrice, filterBookings, filterPackages, filterTrips, filterVehicles } from './filters';
import { computeDashboardStats } from './stats';
import { generateReference, uuid } from '../utils/format';

/** Minimal async key-value store: AsyncStorage on mobile, localStorage on web. */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class MemoryStore implements KeyValueStore {
  private map = new Map<string, string>();
  async getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  async setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  async removeItem(k: string) {
    this.map.delete(k);
  }
}

const STORAGE_KEY = 'travo.demo.snapshot.v1';

export interface DemoAdapterOptions {
  store?: KeyValueStore;
  /** Artificial latency so loading states are visible in demo mode. */
  latencyMs?: number;
  /** Converts an uploaded Blob into a URL that survives reloads (e.g. data URL). */
  persistBlob?: (file: Blob) => Promise<string>;
}

/**
 * Demo adapter — a real, persistent implementation backed by local device
 * storage. Data lives only on this device/browser; it is not shared between
 * the mobile app and the admin dashboard. Use Supabase for shared data.
 */
export class DemoAdapter implements DataAdapter {
  readonly mode = 'demo' as const;
  private snapshot: DataSnapshot | null = null;
  private loading: Promise<DataSnapshot> | null = null;
  private readonly store: KeyValueStore;
  private readonly latency: number;
  private readonly persistBlob?: (file: Blob) => Promise<string>;

  constructor(opts: DemoAdapterOptions = {}) {
    this.store = opts.store ?? new MemoryStore();
    this.latency = opts.latencyMs ?? 250;
    this.persistBlob = opts.persistBlob;
  }

  private async db(): Promise<DataSnapshot> {
    if (this.latency) await new Promise((r) => setTimeout(r, this.latency));
    if (this.snapshot) return this.snapshot;
    this.loading ??= (async () => {
      try {
        const raw = await this.store.getItem(STORAGE_KEY);
        if (raw) return (this.snapshot = JSON.parse(raw) as DataSnapshot);
      } catch {
        // Corrupt or unavailable storage: fall back to fresh seed.
      }
      return (this.snapshot = createSeedSnapshot());
    })();
    return this.loading;
  }

  private async commit(): Promise<void> {
    if (!this.snapshot) return;
    try {
      await this.store.setItem(STORAGE_KEY, JSON.stringify(this.snapshot));
    } catch (e) {
      throw new DataError(`Could not save to device storage: ${(e as Error).message}`, 'unknown');
    }
  }

  /** Restore the original demo dataset. */
  async reset(): Promise<void> {
    this.snapshot = createSeedSnapshot();
    this.loading = Promise.resolve(this.snapshot);
    await this.store.removeItem(STORAGE_KEY);
  }

  private clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
  }

  private now() {
    return new Date().toISOString();
  }

  // --- catalogue ----------------------------------------------------------
  async listDestinations(opts: { featuredOnly?: boolean; includeInactive?: boolean } = {}) {
    const s = await this.db();
    return this.clone(
      s.destinations
        .filter((d) => (opts.includeInactive || d.isActive) && (!opts.featuredOnly || d.isFeatured))
        .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.name.localeCompare(b.name)),
    );
  }

  async getDestination(idOrSlug: string) {
    const s = await this.db();
    const d = s.destinations.find((x) => x.id === idOrSlug || x.slug === idOrSlug);
    return d ? this.clone(d) : null;
  }

  async listPackages(filters: PackageFilters = {}) {
    const s = await this.db();
    return this.clone(filterPackages(s.packages, filters, s.destinations));
  }

  async getPackage(idOrSlug: string) {
    const s = await this.db();
    const p = s.packages.find((x) => x.id === idOrSlug || x.slug === idOrSlug);
    return p ? this.clone(p) : null;
  }

  async listTrips(filters: TripFilters = {}) {
    const s = await this.db();
    return this.clone(filterTrips(s.trips, filters));
  }

  async getTrip(id: string) {
    const s = await this.db();
    const t = s.trips.find((x) => x.id === id);
    return t ? this.clone(t) : null;
  }

  async listVehicles(filters: VehicleFilters = {}) {
    const s = await this.db();
    return this.clone(filterVehicles(s.vehicles, filters));
  }

  async getVehicle(id: string) {
    const s = await this.db();
    const v = s.vehicles.find((x) => x.id === id);
    return v ? this.clone(v) : null;
  }

  async listOperators() {
    const s = await this.db();
    return this.clone([...s.operators].sort((a, b) => a.businessName.localeCompare(b.businessName)));
  }

  async getOperator(id: string) {
    const s = await this.db();
    const o = s.operators.find((x) => x.id === id || x.slug === id);
    return o ? this.clone(o) : null;
  }

  async listReviews(opts: { packageId?: string; vehicleId?: string; operatorId?: string; includeHidden?: boolean } = {}) {
    const s = await this.db();
    return this.clone(
      s.reviews
        .filter(
          (r) =>
            (opts.includeHidden || r.status === 'published') &&
            (!opts.packageId || r.packageId === opts.packageId) &&
            (!opts.vehicleId || r.vehicleId === opts.vehicleId) &&
            (!opts.operatorId || r.operatorId === opts.operatorId),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }

  // --- traveller actions --------------------------------------------------
  async createBooking(input: CreateBookingInput): Promise<BookingReceipt> {
    const s = await this.db();
    const pkg = input.packageId ? s.packages.find((p) => p.id === input.packageId) : undefined;
    const trip = input.scheduledTripId ? s.trips.find((t) => t.id === input.scheduledTripId) : undefined;
    const vehicle = input.vehicleId ? s.vehicles.find((v) => v.id === input.vehicleId) : undefined;
    if (!pkg && !trip && !vehicle) throw new DataError('The selected trip is no longer available.', 'not_found');
    if (pkg && pkg.status !== 'published') throw new DataError('This package is not currently accepting bookings.', 'conflict');

    const travellers = input.adults + input.children;
    if (trip) {
      const left = trip.totalSeats - trip.seatsBooked;
      if (trip.status === 'sold_out' || trip.status === 'cancelled' || left <= 0) throw new DataError('This departure is sold out.', 'conflict');
      if (travellers > left) throw new DataError(`Only ${left} seats left on this departure.`, 'conflict');
    }

    const unit = trip?.pricePerPerson ?? (pkg ? effectivePrice(pkg) : 0);
    const now = this.now();
    let reference = generateReference();
    while (s.bookings.some((b) => b.reference === reference)) reference = generateReference();

    const booking: Booking = {
      id: uuid(),
      reference,
      packageId: input.packageId ?? trip?.packageId ?? null,
      scheduledTripId: input.scheduledTripId,
      vehicleId: input.vehicleId,
      operatorId: (trip?.operatorId ?? pkg?.operatorId ?? vehicle?.operatorId)!,
      travelDate: trip?.departureDate ?? input.travelDate,
      adults: input.adults,
      children: input.children,
      pickupLocation: input.pickupLocation,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail,
      specialRequirements: input.specialRequirements,
      preferredPaymentMethod: input.preferredPaymentMethod,
      estimatedTotal: estimateTotal(unit, input.adults, input.children),
      status: 'pending',
      passengers: [{ id: uuid(), fullName: input.contactName, age: null, type: 'adult' }],
      internalNotes: [],
      source: input.source,
      createdAt: now,
      updatedAt: now,
    };
    s.bookings.push(booking);
    await this.commit();
    return { reference, status: booking.status, estimatedTotal: booking.estimatedTotal, createdAt: now };
  }

  async lookupBooking(reference: string, phone: string) {
    const s = await this.db();
    const digits = (v: string) => v.replace(/\D/g, '').slice(-10);
    const b = s.bookings.find((x) => x.reference.toUpperCase() === reference.trim().toUpperCase() && digits(x.contactPhone) === digits(phone));
    if (!b) return null;
    const { internalNotes: _hidden, ...publicFields } = b;
    return this.clone({ ...publicFields, internalNotes: [] });
  }

  async createEnquiry(input: CreateEnquiryInput) {
    const s = await this.db();
    const now = this.now();
    const vehicle = input.vehicleId ? s.vehicles.find((v) => v.id === input.vehicleId) : undefined;
    const reference = generateReference('ENQ');
    const enquiry: Enquiry = {
      ...input,
      id: uuid(),
      reference,
      operatorId: vehicle?.operatorId ?? null,
      status: 'new',
      createdAt: now,
      updatedAt: now,
    };
    s.enquiries.push(enquiry);
    await this.commit();
    return { reference };
  }

  // --- admin ---------------------------------------------------------------
  async getDashboardStats() {
    return computeDashboardStats(await this.db());
  }

  async listBookings(filters: BookingFilters = {}) {
    const s = await this.db();
    return this.clone(filterBookings(s.bookings, filters));
  }

  async getBooking(id: string) {
    const s = await this.db();
    const b = s.bookings.find((x) => x.id === id || x.reference === id);
    return b ? this.clone(b) : null;
  }

  async updateBookingStatus(id: string, status: BookingStatus) {
    const s = await this.db();
    const b = s.bookings.find((x) => x.id === id);
    if (!b) throw new DataError('Booking not found', 'not_found');
    const seatHolding = (st: BookingStatus) => st === 'confirmed' || st === 'completed';
    if (b.scheduledTripId && seatHolding(status) !== seatHolding(b.status)) {
      const trip = s.trips.find((t) => t.id === b.scheduledTripId);
      if (trip) {
        const delta = (b.adults + b.children) * (seatHolding(status) ? 1 : -1);
        if (delta > 0 && trip.seatsBooked + delta > trip.totalSeats) throw new DataError('Not enough seats left on this departure to confirm.', 'conflict');
        trip.seatsBooked = Math.max(0, trip.seatsBooked + delta);
        if (trip.seatsBooked >= trip.totalSeats && trip.status !== 'cancelled') trip.status = 'sold_out';
        else if (trip.status === 'sold_out') trip.status = 'open';
        trip.updatedAt = this.now();
      }
    }
    b.status = status;
    b.updatedAt = this.now();
    await this.commit();
    return this.clone(b);
  }

  async addBookingNote(id: string, body: string, author: string) {
    const s = await this.db();
    const b = s.bookings.find((x) => x.id === id);
    if (!b) throw new DataError('Booking not found', 'not_found');
    b.internalNotes.push({ id: uuid(), body, author, createdAt: this.now() });
    b.updatedAt = this.now();
    await this.commit();
    return this.clone(b);
  }

  async listEnquiries() {
    const s = await this.db();
    return this.clone([...s.enquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  async updateEnquiryStatus(id: string, status: EnquiryStatus) {
    const s = await this.db();
    const e = s.enquiries.find((x) => x.id === id);
    if (!e) throw new DataError('Enquiry not found', 'not_found');
    e.status = status;
    e.updatedAt = this.now();
    await this.commit();
    return this.clone(e);
  }

  private async upsert<T extends { id: string; createdAt: string; updatedAt: string }>(
    list: (s: DataSnapshot) => T[],
    input: object,
    id: string | undefined,
    defaults: Partial<T> = {},
  ): Promise<T> {
    const s = await this.db();
    const arr = list(s);
    const now = this.now();
    if (id) {
      const idx = arr.findIndex((x) => x.id === id);
      if (idx < 0) throw new DataError('Record not found', 'not_found');
      const updated = { ...arr[idx]!, ...input, id, updatedAt: now } as T;
      arr[idx] = updated;
      await this.commit();
      return this.clone(updated);
    }
    const created = { ...defaults, ...input, id: uuid(), createdAt: now, updatedAt: now } as T;
    arr.push(created);
    await this.commit();
    return this.clone(created);
  }

  private async remove(list: (s: DataSnapshot) => { id: string }[], id: string, guard?: (s: DataSnapshot) => string | null) {
    const s = await this.db();
    const reason = guard?.(s);
    if (reason) throw new DataError(reason, 'conflict');
    const arr = list(s);
    const idx = arr.findIndex((x) => x.id === id);
    if (idx < 0) throw new DataError('Record not found', 'not_found');
    arr.splice(idx, 1);
    await this.commit();
  }

  private assertSlugFree(items: { id: string; slug: string }[], slug: string, id?: string) {
    if (items.some((x) => x.slug === slug && x.id !== id)) throw new DataError(`The URL slug “${slug}” is already used.`, 'conflict');
  }

  async savePackage(input: PackageInput, id?: string) {
    const s = await this.db();
    this.assertSlugFree(s.packages, input.slug, id);
    return this.upsert<TravelPackage>((x) => x.packages, input, id, { rating: 0, reviewCount: 0, bookingCount: 0 });
  }
  deletePackage(id: string) {
    return this.remove((s) => s.packages, id, (s) =>
      s.bookings.some((b) => b.packageId === id) ? 'This package has bookings. Archive it instead of deleting.' : null,
    );
  }
  saveTrip(input: ScheduledTripInput, id?: string) {
    if (input.seatsBooked > input.totalSeats) return Promise.reject(new DataError('Booked seats cannot exceed total seats.', 'validation'));
    return this.upsert<ScheduledTrip>((s) => s.trips, input, id);
  }
  deleteTrip(id: string) {
    return this.remove((s) => s.trips, id, (s) =>
      s.bookings.some((b) => b.scheduledTripId === id) ? 'This departure has bookings. Cancel it instead of deleting.' : null,
    );
  }
  saveVehicle(input: VehicleInput, id?: string) {
    return this.upsert<Vehicle>((s) => s.vehicles, input, id, { rating: 0, reviewCount: 0 });
  }
  deleteVehicle(id: string) {
    return this.remove((s) => s.vehicles, id, (s) =>
      s.trips.some((t) => t.vehicleId === id) ? 'This vehicle is assigned to scheduled trips. Reassign them first.' : null,
    );
  }
  async saveOperator(input: OperatorInput, id?: string) {
    const s = await this.db();
    this.assertSlugFree(s.operators, input.slug, id);
    return this.upsert<Operator>((x) => x.operators, input, id, { rating: 0, reviewCount: 0 });
  }
  deleteOperator(id: string) {
    return this.remove((s) => s.operators, id, (s) =>
      s.packages.some((p) => p.operatorId === id) || s.vehicles.some((v) => v.operatorId === id)
        ? 'This operator still has packages or vehicles. Reassign or remove them first.'
        : null,
    );
  }
  async saveDestination(input: DestinationInput, id?: string) {
    const s = await this.db();
    this.assertSlugFree(s.destinations, input.slug, id);
    return this.upsert<Destination>((x) => x.destinations, input, id);
  }
  deleteDestination(id: string) {
    return this.remove((s) => s.destinations, id, (s) =>
      s.packages.some((p) => p.destinationId === id) ? 'Packages use this destination. Deactivate it instead.' : null,
    );
  }
  async updateReviewStatus(id: string, status: ReviewStatus) {
    const s = await this.db();
    const r = s.reviews.find((x) => x.id === id);
    if (!r) throw new DataError('Review not found', 'not_found');
    r.status = status;
    r.updatedAt = this.now();
    await this.commit();
    return this.clone(r);
  }

  async uploadImage(file: Blob): Promise<string> {
    if (!this.persistBlob) throw new DataError('Image upload is not available on this device in demo mode.', 'forbidden');
    if (file.size > 1.5 * 1024 * 1024) throw new DataError('In demo mode images must be under 1.5 MB (they are stored in the browser). Connect Supabase Storage for larger files.', 'validation');
    return this.persistBlob(file);
  }
}
