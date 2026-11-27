import type {
  BookingStatus,
  EnquiryStatus,
  EnquiryType,
  OperatorTypeCode,
  PackageCategory,
  PackageSort,
  PackageStatus,
  PaymentMethod,
  PricingUnit,
  ReviewStatus,
  ScheduledTripStatus,
  TripType,
  UserRole,
  VehicleCategory,
  VehicleListingStatus,
  VerificationStatus,
} from './types';

export const PACKAGE_CATEGORY_LABELS: Record<PackageCategory, string> = {
  one_day: 'One-day trips',
  weekend: 'Weekend trips',
  multi_day: 'Multi-day tours',
  family: 'Family',
  couple: 'Couples',
  honeymoon: 'Honeymoon',
  adventure: 'Adventure',
  pilgrimage: 'Pilgrimage',
  group: 'Group tours',
  luxury: 'Luxury',
  budget: 'Budget',
  custom: 'Custom tours',
};

export const VEHICLE_CATEGORY_LABELS: Record<VehicleCategory, string> = {
  hatchback: 'Hatchback',
  sedan: 'Sedan',
  suv: 'SUV',
  muv: 'MUV',
  premium: 'Premium car',
  jeep: 'Jeep',
  tempo_traveller: 'Tempo Traveller',
  mini_bus: 'Mini bus',
  tourist_bus: 'Tourist bus',
  luxury_coach: 'Luxury coach',
};

export const OPERATOR_TYPE_LABELS: Record<OperatorTypeCode, string> = {
  travel_agency: 'Travel agency',
  tour_operator: 'Independent tour operator',
  vehicle_owner: 'Individual vehicle owner',
  fleet_operator: 'Bus & fleet operator',
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  pending: 'Pending review',
  verified: 'Verified',
  rejected: 'Rejected',
  suspended: 'Suspended',
};

export const PACKAGE_STATUS_LABELS: Record<PackageStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  unpublished: 'Unpublished',
  archived: 'Archived',
};

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  private: 'Private trip',
  group: 'Group trip',
};

export const TRIP_STATUS_LABELS: Record<ScheduledTripStatus, string> = {
  scheduled: 'Scheduled',
  open: 'Open for booking',
  filling_fast: 'Filling fast',
  sold_out: 'Sold out',
  departed: 'Departed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  quoted: 'Quoted',
  converted: 'Converted',
  closed: 'Closed',
};

export const ENQUIRY_TYPE_LABELS: Record<EnquiryType, string> = {
  custom_trip: 'Custom trip',
  vehicle: 'Vehicle hire',
  package_question: 'Package question',
  general: 'General',
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  published: 'Published',
  hidden: 'Hidden',
  pending: 'Awaiting moderation',
};

export const LISTING_STATUS_LABELS: Record<VehicleListingStatus, string> = {
  pending: 'Awaiting approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const PRICING_UNIT_LABELS: Record<PricingUnit, string> = {
  per_km: '/km',
  per_day: '/day',
  per_trip: '/trip',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: 'UPI',
  card: 'Credit / Debit card',
  netbanking: 'Net banking',
  wallet: 'Wallets',
  pay_at_operator: 'Pay at operator',
};

export const PACKAGE_SORT_LABELS: Record<PackageSort, string> = {
  recommended: 'Recommended',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
  popular: 'Most popular',
  recent: 'Recently added',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  agency: 'Agency',
  vehicle_owner: 'Vehicle Owner',
  staff: 'Staff',
  traveller: 'Traveller',
};
