/**
 * Travo domain model.
 *
 * These types are the single source of truth shared by the mobile app,
 * the admin dashboard and both data adapters (demo + Supabase).
 * Field names are camelCase versions of the PostgreSQL columns in
 * `supabase/migrations`.
 */

export type ID = string;
/** ISO-8601 timestamp, e.g. 2026-12-12T04:30:00.000Z */
export type ISODateTime = string;
/** Calendar date, e.g. 2026-12-12 */
export type ISODate = string;

// ---------------------------------------------------------------------------
// Enumerations (mirrored as PostgreSQL enums)
// ---------------------------------------------------------------------------

export const DISTRICTS = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod',
] as const;
export type District = (typeof DISTRICTS)[number];

export const USER_ROLES = ['super_admin', 'admin', 'agency', 'vehicle_owner', 'staff', 'traveller'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const OPERATOR_TYPES = ['travel_agency', 'tour_operator', 'vehicle_owner', 'fleet_operator'] as const;
export type OperatorTypeCode = (typeof OPERATOR_TYPES)[number];

export const VERIFICATION_STATUSES = ['pending', 'verified', 'rejected', 'suspended'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const PACKAGE_CATEGORIES = [
  'one_day',
  'weekend',
  'multi_day',
  'family',
  'couple',
  'honeymoon',
  'adventure',
  'pilgrimage',
  'group',
  'luxury',
  'budget',
  'custom',
] as const;
export type PackageCategory = (typeof PACKAGE_CATEGORIES)[number];

export const PACKAGE_STATUSES = ['draft', 'published', 'unpublished', 'archived'] as const;
export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

export const TRIP_TYPES = ['private', 'group'] as const;
export type TripType = (typeof TRIP_TYPES)[number];

export const VEHICLE_CATEGORIES = [
  'hatchback',
  'sedan',
  'suv',
  'muv',
  'premium',
  'jeep',
  'tempo_traveller',
  'mini_bus',
  'tourist_bus',
  'luxury_coach',
] as const;
export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export const VEHICLE_LISTING_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type VehicleListingStatus = (typeof VEHICLE_LISTING_STATUSES)[number];

export const PRICING_UNITS = ['per_km', 'per_day', 'per_trip'] as const;
export type PricingUnit = (typeof PRICING_UNITS)[number];

export const TRIP_STATUSES = ['scheduled', 'open', 'filling_fast', 'sold_out', 'departed', 'completed', 'cancelled'] as const;
export type ScheduledTripStatus = (typeof TRIP_STATUSES)[number];

export const BOOKING_STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const ENQUIRY_STATUSES = ['new', 'contacted', 'quoted', 'converted', 'closed'] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const ENQUIRY_TYPES = ['custom_trip', 'vehicle', 'package_question', 'general'] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export const REVIEW_STATUSES = ['published', 'hidden', 'pending'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const PAYMENT_METHODS = ['upi', 'card', 'netbanking', 'wallet', 'pay_at_operator'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['not_started', 'pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export interface Timestamps {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Attraction {
  name: string;
  description: string;
}

export interface Destination extends Timestamps {
  id: ID;
  slug: string;
  name: string;
  district: District;
  tagline: string;
  description: string;
  coverImage: string;
  gallery: string[];
  attractions: Attraction[];
  bestExperiences: string[];
  bestTimeToVisit: string;
  isFeatured: boolean;
  isActive: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface Operator extends Timestamps {
  id: ID;
  slug: string;
  businessName: string;
  type: OperatorTypeCode;
  contactName: string;
  phone: string;
  whatsapp: string;
  email: string;
  district: District;
  address: string;
  description: string;
  logo: string | null;
  verificationStatus: VerificationStatus;
  rating: number;
  reviewCount: number;
  yearsInBusiness: number;
  /** Demo records are fictitious and labelled as such everywhere. */
  isDemo: boolean;
}

export interface ItineraryDay {
  id: ID;
  dayNumber: number;
  title: string;
  description: string;
  meals: string[];
  stay: string | null;
}

export interface PackageImage {
  id: ID;
  url: string;
  caption: string | null;
  sortOrder: number;
}

export interface TravelPackage extends Timestamps {
  id: ID;
  slug: string;
  title: string;
  summary: string;
  description: string;
  destinationId: ID;
  /** Extra destinations visited in multi-stop tours. */
  additionalDestinationIds: ID[];
  operatorId: ID;
  categories: PackageCategory[];
  tripType: TripType;
  durationDays: number;
  durationNights: number;
  /** Price per person in INR, before discount. */
  basePrice: number;
  /** Percentage discount 0–90. */
  discountPercent: number;
  minGroupSize: number;
  maxGroupSize: number;
  vehicleCategory: VehicleCategory;
  transportDetails: string;
  accommodation: string;
  pickupPoints: string[];
  dropPoints: string[];
  pickupDistricts: District[];
  inclusions: string[];
  exclusions: string[];
  cancellationPolicy: string;
  images: PackageImage[];
  itinerary: ItineraryDay[];
  /** Dates on which the private / on-request package can run. Empty = on request any day. */
  availableDates: ISODate[];
  status: PackageStatus;
  isFeatured: boolean;
  isTrending: boolean;
  rating: number;
  reviewCount: number;
  bookingCount: number;
}

export interface ScheduledTrip extends Timestamps {
  id: ID;
  packageId: ID | null;
  title: string;
  operatorId: ID;
  vehicleId: ID | null;
  destinationId: ID;
  departureDate: ISODate;
  returnDate: ISODate;
  departureTime: string;
  departureLocation: string;
  departureDistrict: District;
  totalSeats: number;
  seatsBooked: number;
  pricePerPerson: number;
  status: ScheduledTripStatus;
  notes: string;
}

export interface VehicleImage {
  id: ID;
  url: string;
  sortOrder: number;
}

export interface Vehicle extends Timestamps {
  id: ID;
  operatorId: ID;
  title: string;
  make: string;
  model: string;
  year: number;
  category: VehicleCategory;
  seatingCapacity: number;
  luggageCapacity: string;
  isAc: boolean;
  driverIncluded: boolean;
  pricingUnit: PricingUnit;
  price: number;
  minimumCharge: number;
  baseDistrict: District;
  pickupLocation: string;
  amenities: string[];
  description: string;
  images: VehicleImage[];
  isAvailable: boolean;
  listingStatus: VehicleListingStatus;
  registrationVerified: boolean;
  rating: number;
  reviewCount: number;
}

export interface BookingPassenger {
  id: ID;
  fullName: string;
  age: number | null;
  type: 'adult' | 'child';
}

export interface BookingNote {
  id: ID;
  body: string;
  author: string;
  createdAt: ISODateTime;
}

export interface Booking extends Timestamps {
  id: ID;
  reference: string;
  packageId: ID | null;
  scheduledTripId: ID | null;
  vehicleId: ID | null;
  operatorId: ID;
  travelDate: ISODate;
  adults: number;
  children: number;
  pickupLocation: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  specialRequirements: string | null;
  preferredPaymentMethod: PaymentMethod;
  /** Estimated total in INR at the time of request. */
  estimatedTotal: number;
  status: BookingStatus;
  passengers: BookingPassenger[];
  internalNotes: BookingNote[];
  source: 'mobile' | 'admin' | 'whatsapp';
}

export interface Enquiry extends Timestamps {
  id: ID;
  reference: string;
  type: EnquiryType;
  vehicleId: ID | null;
  packageId: ID | null;
  operatorId: ID | null;
  pickupLocation: string;
  destination: string;
  stops: string[];
  travelDate: ISODate;
  returnDate: ISODate | null;
  passengers: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  message: string | null;
  status: EnquiryStatus;
}

export interface Review extends Timestamps {
  id: ID;
  packageId: ID | null;
  vehicleId: ID | null;
  operatorId: ID;
  authorName: string;
  authorCity: string;
  rating: number;
  title: string;
  body: string;
  travelMonth: string;
  status: ReviewStatus;
}

export interface PaymentRecord extends Timestamps {
  id: ID;
  bookingId: ID;
  provider: string;
  method: PaymentMethod;
  amount: number;
  currency: 'INR';
  status: PaymentStatus;
  providerReference: string | null;
  notes?: string | null;
}

export interface AppNotification extends Timestamps {
  id: ID;
  userId: ID | null;
  title: string;
  body: string;
  readAt: ISODateTime | null;
}

export interface ActivityItem {
  id: ID;
  kind: 'booking' | 'enquiry' | 'package' | 'trip' | 'vehicle' | 'operator' | 'review' | 'destination';
  message: string;
  createdAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Query & input shapes
// ---------------------------------------------------------------------------

export const PACKAGE_SORTS = ['recommended', 'price_asc', 'price_desc', 'popular', 'recent'] as const;
export type PackageSort = (typeof PACKAGE_SORTS)[number];

export interface PackageFilters {
  query?: string;
  destinationId?: string;
  pickupDistrict?: District;
  categories?: PackageCategory[];
  vehicleCategories?: VehicleCategory[];
  tripType?: TripType;
  minPrice?: number;
  maxPrice?: number;
  minDays?: number;
  maxDays?: number;
  travelDate?: ISODate;
  travellers?: number;
  featuredOnly?: boolean;
  trendingOnly?: boolean;
  operatorId?: string;
  /** Admin only: include unpublished/draft/archived packages. */
  includeUnpublished?: boolean;
  sort?: PackageSort;
}

export interface VehicleFilters {
  query?: string;
  categories?: VehicleCategory[];
  district?: District;
  minSeats?: number;
  acOnly?: boolean;
  operatorId?: string;
  /** Admin only: include pending/rejected & unavailable vehicles. */
  includeAll?: boolean;
}

export interface TripFilters {
  destinationId?: string;
  departureDistrict?: District;
  fromDate?: ISODate;
  operatorId?: string;
  packageId?: string;
  includePast?: boolean;
  statuses?: ScheduledTripStatus[];
}

export interface BookingFilters {
  query?: string;
  status?: BookingStatus;
  packageId?: string;
  operatorId?: string;
  scheduledTripId?: string;
  fromDate?: ISODate;
  toDate?: ISODate;
}

export interface DashboardStats {
  totalPackages: number;
  activePackages: number;
  upcomingTrips: number;
  totalEnquiries: number;
  pendingBookings: number;
  confirmedBookings: number;
  registeredOperators: number;
  listedVehicles: number;
  bookingsByStatus: { status: BookingStatus; count: number }[];
  enquiriesOverTime: { date: ISODate; bookings: number; enquiries: number }[];
  popularDestinations: { destinationId: ID; name: string; bookings: number; packages: number }[];
  packagePerformance: { packageId: ID; title: string; bookings: number; revenue: number; rating: number }[];
  recentActivity: ActivityItem[];
}

/** Payload sent by travellers. Server assigns id, reference, status, timestamps. */
export interface CreateBookingInput {
  packageId: ID | null;
  scheduledTripId: ID | null;
  vehicleId: ID | null;
  travelDate: ISODate;
  adults: number;
  children: number;
  pickupLocation: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  specialRequirements: string | null;
  preferredPaymentMethod: PaymentMethod;
  source: Booking['source'];
}

export interface CreateEnquiryInput {
  type: EnquiryType;
  vehicleId: ID | null;
  packageId: ID | null;
  pickupLocation: string;
  destination: string;
  stops: string[];
  travelDate: ISODate;
  returnDate: ISODate | null;
  passengers: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  message: string | null;
}

export interface BookingReceipt {
  reference: string;
  status: BookingStatus;
  estimatedTotal: number;
  createdAt: ISODateTime;
}

export type BookingUpdate = Partial<
  Pick<
    Booking,
    | 'travelDate'
    | 'adults'
    | 'children'
    | 'pickupLocation'
    | 'contactName'
    | 'contactPhone'
    | 'contactEmail'
    | 'specialRequirements'
    | 'preferredPaymentMethod'
    | 'estimatedTotal'
    | 'passengers'
    | 'operatorId'
  >
>;

export type PaymentInput = Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt' | 'currency'> & { notes?: string | null };

/** Tables whose changes are broadcast to clients for live refresh. */
export const SYNC_TABLES = ['destinations', 'operators', 'packages', 'scheduled_trips', 'vehicles', 'bookings', 'enquiries', 'reviews', 'payment_records'] as const;
export type SyncTable = (typeof SYNC_TABLES)[number];

export type PackageInput = Omit<TravelPackage, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount' | 'bookingCount'>;
export type ScheduledTripInput = Omit<ScheduledTrip, 'id' | 'createdAt' | 'updatedAt'>;
export type VehicleInput = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount'>;
export type OperatorInput = Omit<Operator, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount'>;
export type DestinationInput = Omit<Destination, 'id' | 'createdAt' | 'updatedAt'>;
