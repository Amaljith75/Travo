import type { SupabaseClient } from '@supabase/supabase-js';
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
import { filterBookings, filterPackages, filterTrips, filterVehicles } from './filters';
import { computeDashboardStats } from './stats';
import { uuid } from '../utils/format';

type Row = Record<string, unknown>;

const PACKAGE_SELECT = '*, package_images(*), package_itineraries(*)' as const;

const toSnake = (k: string) => k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const toCamel = (k: string) => k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

function camelize<T>(row: Row): T {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) out[toCamel(k)] = v;
  return out as T;
}

function snakify(obj: Row, omit: string[] = []): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(obj)) if (!omit.includes(k) && v !== undefined) out[toSnake(k)] = v;
  return out;
}

const num = (v: unknown) => (typeof v === 'string' ? Number(v) : (v as number));

/**
 * Supabase / PostgreSQL implementation.
 *
 * Public clients use the anon key: RLS only exposes published catalogue
 * rows, and traveller writes go through SECURITY DEFINER RPCs that return a
 * reference without exposing other bookings. Admin writes require a signed-in
 * user whose `user_profiles.role` is admin/super_admin (enforced by RLS).
 *
 * Catalogue filtering runs client-side via the shared filter service, which
 * suits an MVP catalogue of hundreds of rows. Move to SQL/RPC filtering
 * (or a search index) once the catalogue grows.
 */
export class SupabaseAdapter implements DataAdapter {
  readonly mode = 'supabase' as const;

  constructor(
    private readonly client: SupabaseClient,
    private readonly storageBucket = 'media',
  ) {}

  private fail(error: { message: string; code?: string } | null, context: string): never {
    const code = error?.code === '42501' ? 'forbidden' : error?.code === '23505' ? 'conflict' : 'unknown';
    throw new DataError(`${context}: ${error?.message ?? 'unknown error'}`, code);
  }

  // --- mappers -----------------------------------------------------------
  private mapPackage(r: Row): TravelPackage {
    const base = camelize<TravelPackage & { packageImages?: Row[]; packageItineraries?: Row[] }>(r);
    const images = ((r.package_images as Row[]) ?? [])
      .map((i) => ({ id: i.id as string, url: i.url as string, caption: (i.caption as string) ?? null, sortOrder: num(i.sort_order) }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const itinerary = ((r.package_itineraries as Row[]) ?? [])
      .map((d) => ({
        id: d.id as string,
        dayNumber: num(d.day_number),
        title: d.title as string,
        description: d.description as string,
        meals: (d.meals as string[]) ?? [],
        stay: (d.stay as string) ?? null,
      }))
      .sort((a, b) => a.dayNumber - b.dayNumber);
    delete base.packageImages;
    delete base.packageItineraries;
    return { ...base, basePrice: num(base.basePrice), rating: num(base.rating), images, itinerary };
  }

  private mapVehicle(r: Row): Vehicle {
    const base = camelize<Vehicle & { vehicleImages?: Row[] }>(r);
    const images = ((r.vehicle_images as Row[]) ?? [])
      .map((i) => ({ id: i.id as string, url: i.url as string, sortOrder: num(i.sort_order) }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    delete base.vehicleImages;
    return { ...base, price: num(base.price), minimumCharge: num(base.minimumCharge), rating: num(base.rating), images };
  }

  private mapBooking(r: Row): Booking {
    const base = camelize<Booking & { bookingPassengers?: Row[] }>(r);
    const passengers = ((r.booking_passengers as Row[]) ?? []).map((p) => ({
      id: p.id as string,
      fullName: p.full_name as string,
      age: (p.age as number) ?? null,
      type: p.passenger_type as 'adult' | 'child',
    }));
    delete base.bookingPassengers;
    return { ...base, estimatedTotal: num(base.estimatedTotal), internalNotes: (base.internalNotes as Booking['internalNotes']) ?? [], passengers };
  }

  private mapOperator = (r: Row) => {
    const o = camelize<Operator>(r);
    return { ...o, rating: num(o.rating) };
  };

  // --- catalogue ---------------------------------------------------------
  async listDestinations(opts: { featuredOnly?: boolean; includeInactive?: boolean } = {}) {
    let q = this.client.from('destinations').select('*').order('is_featured', { ascending: false }).order('name');
    if (!opts.includeInactive) q = q.eq('is_active', true);
    if (opts.featuredOnly) q = q.eq('is_featured', true);
    const { data, error } = await q;
    if (error) this.fail(error, 'Loading destinations failed');
    return (data ?? []).map((r) => camelize<Destination>(r));
  }

  async getDestination(idOrSlug: string) {
    const col = /^[0-9a-f-]{36}$/.test(idOrSlug) ? 'id' : 'slug';
    const { data, error } = await this.client.from('destinations').select('*').eq(col, idOrSlug).maybeSingle();
    if (error) this.fail(error, 'Loading destination failed');
    return data ? camelize<Destination>(data) : null;
  }


  async listPackages(filters: PackageFilters = {}) {
    const [{ data, error }, destinations] = await Promise.all([
      this.client.from('packages').select(PACKAGE_SELECT),
      this.listDestinations({ includeInactive: true }),
    ]);
    if (error) this.fail(error, 'Loading packages failed');
    return filterPackages((data ?? []).map((r) => this.mapPackage(r)), filters, destinations);
  }

  async getPackage(idOrSlug: string) {
    const col = /^[0-9a-f-]{36}$/.test(idOrSlug) ? 'id' : 'slug';
    const { data, error } = await this.client.from('packages').select(PACKAGE_SELECT).eq(col, idOrSlug).maybeSingle();
    if (error) this.fail(error, 'Loading package failed');
    return data ? this.mapPackage(data) : null;
  }

  async listTrips(filters: TripFilters = {}) {
    const { data, error } = await this.client.from('scheduled_trips').select('*');
    if (error) this.fail(error, 'Loading trips failed');
    return filterTrips((data ?? []).map((r) => {
      const t = camelize<ScheduledTrip>(r);
      return { ...t, pricePerPerson: num(t.pricePerPerson) };
    }), filters);
  }

  async getTrip(id: string) {
    const { data, error } = await this.client.from('scheduled_trips').select('*').eq('id', id).maybeSingle();
    if (error) this.fail(error, 'Loading trip failed');
    if (!data) return null;
    const t = camelize<ScheduledTrip>(data);
    return { ...t, pricePerPerson: num(t.pricePerPerson) };
  }

  async listVehicles(filters: VehicleFilters = {}) {
    const { data, error } = await this.client.from('vehicles').select('*, vehicle_images(*)');
    if (error) this.fail(error, 'Loading vehicles failed');
    return filterVehicles((data ?? []).map((r) => this.mapVehicle(r)), filters);
  }

  async getVehicle(id: string) {
    const { data, error } = await this.client.from('vehicles').select('*, vehicle_images(*)').eq('id', id).maybeSingle();
    if (error) this.fail(error, 'Loading vehicle failed');
    return data ? this.mapVehicle(data) : null;
  }

  async listOperators() {
    const { data, error } = await this.client.from('operators').select('*').order('business_name');
    if (error) this.fail(error, 'Loading operators failed');
    return (data ?? []).map(this.mapOperator);
  }

  async getOperator(id: string) {
    const col = /^[0-9a-f-]{36}$/.test(id) ? 'id' : 'slug';
    const { data, error } = await this.client.from('operators').select('*').eq(col, id).maybeSingle();
    if (error) this.fail(error, 'Loading operator failed');
    return data ? this.mapOperator(data) : null;
  }

  async listReviews(opts: { packageId?: string; vehicleId?: string; operatorId?: string; includeHidden?: boolean } = {}) {
    let q = this.client.from('reviews').select('*').order('created_at', { ascending: false });
    if (!opts.includeHidden) q = q.eq('status', 'published');
    if (opts.packageId) q = q.eq('package_id', opts.packageId);
    if (opts.vehicleId) q = q.eq('vehicle_id', opts.vehicleId);
    if (opts.operatorId) q = q.eq('operator_id', opts.operatorId);
    const { data, error } = await q;
    if (error) this.fail(error, 'Loading reviews failed');
    return (data ?? []).map((r) => camelize<Review>(r));
  }

  // --- traveller actions ---------------------------------------------------
  async createBooking(input: CreateBookingInput): Promise<BookingReceipt> {
    const { data, error } = await this.client.rpc('create_booking_request', { payload: snakify(input as unknown as Row) });
    if (error) this.fail(error, 'Booking request failed');
    const r = (Array.isArray(data) ? data[0] : data) as Row;
    return { reference: r.reference as string, status: r.status as BookingStatus, estimatedTotal: num(r.estimated_total), createdAt: r.created_at as string };
  }

  async lookupBooking(reference: string, phone: string) {
    const { data, error } = await this.client.rpc('lookup_booking', { p_reference: reference.trim().toUpperCase(), p_phone: phone });
    if (error) this.fail(error, 'Booking lookup failed');
    const r = (Array.isArray(data) ? data[0] : data) as Row | null;
    return r ? { ...this.mapBooking(r), internalNotes: [] } : null;
  }

  async createEnquiry(input: CreateEnquiryInput) {
    const { data, error } = await this.client.rpc('create_enquiry', { payload: snakify(input as unknown as Row) });
    if (error) this.fail(error, 'Enquiry failed');
    return { reference: data as string };
  }

  // --- admin --------------------------------------------------------------
  async getDashboardStats() {
    const [destinations, operators, packages, trips, vehicles, bookings, enquiries] = await Promise.all([
      this.listDestinations({ includeInactive: true }),
      this.listOperators(),
      this.listPackages({ includeUnpublished: true }),
      this.listTrips({ includePast: true }),
      this.listVehicles({ includeAll: true }),
      this.listBookings(),
      this.listEnquiries(),
    ]);
    return computeDashboardStats({ destinations, operators, packages, trips, vehicles, bookings, enquiries, reviews: [] });
  }

  async listBookings(filters: BookingFilters = {}) {
    const { data, error } = await this.client.from('bookings').select('*, booking_passengers(*)');
    if (error) this.fail(error, 'Loading bookings failed');
    return filterBookings((data ?? []).map((r) => this.mapBooking(r)), filters);
  }

  async getBooking(id: string) {
    const { data, error } = await this.client.from('bookings').select('*, booking_passengers(*)').eq('id', id).maybeSingle();
    if (error) this.fail(error, 'Loading booking failed');
    return data ? this.mapBooking(data) : null;
  }

  async updateBookingStatus(id: string, status: BookingStatus) {
    const { error } = await this.client.rpc('admin_set_booking_status', { p_booking_id: id, p_status: status });
    if (error) this.fail(error, 'Updating booking failed');
    return (await this.getBooking(id))!;
  }

  async addBookingNote(id: string, body: string, author: string) {
    const current = await this.getBooking(id);
    if (!current) throw new DataError('Booking not found', 'not_found');
    const notes = [...current.internalNotes, { id: uuid(), body, author, createdAt: new Date().toISOString() }];
    const { error } = await this.client.from('bookings').update({ internal_notes: notes }).eq('id', id);
    if (error) this.fail(error, 'Saving note failed');
    return { ...current, internalNotes: notes };
  }

  async listEnquiries() {
    const { data, error } = await this.client.from('enquiries').select('*').order('created_at', { ascending: false });
    if (error) this.fail(error, 'Loading enquiries failed');
    return (data ?? []).map((r) => camelize<Enquiry>(r));
  }

  async updateEnquiryStatus(id: string, status: EnquiryStatus) {
    const { data, error } = await this.client.from('enquiries').update({ status }).eq('id', id).select().single();
    if (error) this.fail(error, 'Updating enquiry failed');
    return camelize<Enquiry>(data);
  }

  private async upsertRow(table: string, row: Row, id?: string): Promise<Row> {
    const query = id
      ? this.client.from(table).update(row).eq('id', id).select().single()
      : this.client.from(table).insert(row).select().single();
    const { data, error } = await query;
    if (error) this.fail(error, `Saving ${table} failed`);
    return data as Row;
  }

  private async replaceChildren(table: string, fk: string, parentId: string, rows: Row[]) {
    const del = await this.client.from(table).delete().eq(fk, parentId);
    if (del.error) this.fail(del.error, `Updating ${table} failed`);
    if (rows.length) {
      const ins = await this.client.from(table).insert(rows);
      if (ins.error) this.fail(ins.error, `Updating ${table} failed`);
    }
  }

  private async deleteRow(table: string, id: string) {
    const { error } = await this.client.from(table).delete().eq('id', id);
    if (error) {
      if (error.code === '23503') throw new DataError('This record is referenced by other records (bookings, trips or packages). Archive or reassign instead.', 'conflict');
      this.fail(error, `Deleting from ${table} failed`);
    }
  }

  async savePackage(input: PackageInput, id?: string) {
    const row = await this.upsertRow('packages', snakify(input as unknown as Row, ['images', 'itinerary']), id);
    const pid = row.id as string;
    await this.replaceChildren('package_images', 'package_id', pid, input.images.map((i, idx) => ({ package_id: pid, url: i.url, caption: i.caption, sort_order: idx })));
    await this.replaceChildren(
      'package_itineraries',
      'package_id',
      pid,
      input.itinerary.map((d, idx) => ({ package_id: pid, day_number: idx + 1, title: d.title, description: d.description, meals: d.meals, stay: d.stay })),
    );
    return (await this.getPackage(pid))!;
  }
  deletePackage(id: string) {
    return this.deleteRow('packages', id);
  }

  async saveTrip(input: ScheduledTripInput, id?: string) {
    return camelize<ScheduledTrip>(await this.upsertRow('scheduled_trips', snakify(input as unknown as Row), id));
  }
  deleteTrip(id: string) {
    return this.deleteRow('scheduled_trips', id);
  }

  async saveVehicle(input: VehicleInput, id?: string) {
    const row = await this.upsertRow('vehicles', snakify(input as unknown as Row, ['images']), id);
    const vid = row.id as string;
    await this.replaceChildren('vehicle_images', 'vehicle_id', vid, input.images.map((i, idx) => ({ vehicle_id: vid, url: i.url, sort_order: idx })));
    return (await this.getVehicle(vid))!;
  }
  deleteVehicle(id: string) {
    return this.deleteRow('vehicles', id);
  }

  async saveOperator(input: OperatorInput, id?: string) {
    return this.mapOperator(await this.upsertRow('operators', snakify(input as unknown as Row), id));
  }
  deleteOperator(id: string) {
    return this.deleteRow('operators', id);
  }

  async saveDestination(input: DestinationInput, id?: string) {
    return camelize<Destination>(await this.upsertRow('destinations', snakify(input as unknown as Row), id));
  }
  deleteDestination(id: string) {
    return this.deleteRow('destinations', id);
  }

  async updateReviewStatus(id: string, status: ReviewStatus) {
    const { data, error } = await this.client.from('reviews').update({ status }).eq('id', id).select().single();
    if (error) this.fail(error, 'Updating review failed');
    return camelize<Review>(data);
  }

  async uploadImage(file: Blob, folder: string, filename: string) {
    const safe = filename.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    const path = `${folder}/${Date.now()}-${safe}`;
    const { error } = await this.client.storage.from(this.storageBucket).upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (error) throw new DataError(`Upload failed: ${error.message}`, 'unknown');
    return this.client.storage.from(this.storageBucket).getPublicUrl(path).data.publicUrl;
  }
}
