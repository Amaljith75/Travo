import type {
  Booking,
  BookingFilters,
  BookingReceipt,
  BookingStatus,
  CreateBookingInput,
  CreateEnquiryInput,
  DashboardStats,
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

/**
 * Every read/write in both apps goes through this interface.
 * Implementations: DemoAdapter (local device storage) and SupabaseAdapter.
 */
export interface DataAdapter {
  readonly mode: 'demo' | 'supabase';

  // Public catalogue -------------------------------------------------------
  listDestinations(opts?: { featuredOnly?: boolean; includeInactive?: boolean }): Promise<Destination[]>;
  getDestination(idOrSlug: string): Promise<Destination | null>;
  listPackages(filters?: PackageFilters): Promise<TravelPackage[]>;
  getPackage(idOrSlug: string): Promise<TravelPackage | null>;
  listTrips(filters?: TripFilters): Promise<ScheduledTrip[]>;
  getTrip(id: string): Promise<ScheduledTrip | null>;
  listVehicles(filters?: VehicleFilters): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | null>;
  listOperators(): Promise<Operator[]>;
  getOperator(id: string): Promise<Operator | null>;
  listReviews(opts?: { packageId?: string; vehicleId?: string; operatorId?: string; includeHidden?: boolean }): Promise<Review[]>;

  // Traveller actions (no login required) ----------------------------------
  createBooking(input: CreateBookingInput): Promise<BookingReceipt>;
  /** Looks up a booking by reference + phone so strangers can’t enumerate bookings. */
  lookupBooking(reference: string, phone: string): Promise<Booking | null>;
  createEnquiry(input: CreateEnquiryInput): Promise<{ reference: string }>;

  // Admin ------------------------------------------------------------------
  getDashboardStats(): Promise<DashboardStats>;
  listBookings(filters?: BookingFilters): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | null>;
  updateBookingStatus(id: string, status: BookingStatus): Promise<Booking>;
  addBookingNote(id: string, body: string, author: string): Promise<Booking>;
  listEnquiries(): Promise<Enquiry[]>;
  updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<Enquiry>;

  savePackage(input: PackageInput, id?: string): Promise<TravelPackage>;
  deletePackage(id: string): Promise<void>;
  saveTrip(input: ScheduledTripInput, id?: string): Promise<ScheduledTrip>;
  deleteTrip(id: string): Promise<void>;
  saveVehicle(input: VehicleInput, id?: string): Promise<Vehicle>;
  deleteVehicle(id: string): Promise<void>;
  saveOperator(input: OperatorInput, id?: string): Promise<Operator>;
  deleteOperator(id: string): Promise<void>;
  saveDestination(input: DestinationInput, id?: string): Promise<Destination>;
  deleteDestination(id: string): Promise<void>;
  updateReviewStatus(id: string, status: ReviewStatus): Promise<Review>;

  /** Upload an image and return its public URL. */
  uploadImage(file: Blob, folder: string, filename: string): Promise<string>;
}

export class DataError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'validation' | 'conflict' | 'forbidden' | 'network' | 'unknown' = 'unknown',
  ) {
    super(message);
    this.name = 'DataError';
  }
}
