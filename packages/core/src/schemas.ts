import { z } from 'zod';
import {
  BOOKING_STATUSES,
  DISTRICTS,
  OPERATOR_TYPES,
  PACKAGE_CATEGORIES,
  PACKAGE_STATUSES,
  PAYMENT_METHODS,
  PRICING_UNITS,
  TRIP_STATUSES,
  TRIP_TYPES,
  VEHICLE_CATEGORIES,
  VEHICLE_LISTING_STATUSES,
  VERIFICATION_STATUSES,
} from './types';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date');
const phone = z
  .string()
  .trim()
  .refine((v) => {
    const d = v.replace(/\D/g, '');
    return d.length >= 10 && d.length <= 13;
  }, 'Enter a valid mobile number');
const optionalEmail = z
  .string()
  .trim()
  .email('Enter a valid email')
  .or(z.literal(''))
  .transform((v) => (v === '' ? null : v))
  .nullable();
const optionalText = z
  .string()
  .trim()
  .max(1000)
  .transform((v) => (v === '' ? null : v))
  .nullable();

export const bookingRequestSchema = z
  .object({
    packageId: z.string().uuid().nullable(),
    scheduledTripId: z.string().uuid().nullable(),
    vehicleId: z.string().uuid().nullable(),
    travelDate: isoDate,
    adults: z.number().int().min(1, 'At least one adult').max(60),
    children: z.number().int().min(0).max(40),
    pickupLocation: z.string().trim().min(2, 'Enter a pickup location').max(200),
    contactName: z.string().trim().min(2, 'Enter your name').max(120),
    contactPhone: phone,
    contactEmail: optionalEmail,
    specialRequirements: optionalText,
    preferredPaymentMethod: z.enum(PAYMENT_METHODS),
    source: z.enum(['mobile', 'admin', 'whatsapp']),
  })
  .refine((v) => v.packageId || v.scheduledTripId || v.vehicleId, { message: 'Select a trip', path: ['packageId'] });
export type BookingRequestForm = z.input<typeof bookingRequestSchema>;

export const customTripSchema = z.object({
  type: z.enum(['custom_trip', 'vehicle', 'package_question', 'general']),
  vehicleId: z.string().uuid().nullable(),
  packageId: z.string().uuid().nullable(),
  pickupLocation: z.string().trim().min(2, 'Enter a pickup location'),
  destination: z.string().trim().min(2, 'Enter a destination'),
  stops: z.array(z.string().trim().min(1)).max(8),
  travelDate: isoDate,
  returnDate: isoDate.nullable(),
  passengers: z.number().int().min(1, 'At least one passenger').max(60),
  contactName: z.string().trim().min(2, 'Enter your name'),
  contactPhone: phone,
  contactEmail: optionalEmail,
  message: optionalText,
});

export const bookingLookupSchema = z.object({
  reference: z.string().trim().min(6, 'Enter your booking reference'),
  phone,
});

const stringList = z.array(z.string().trim().min(1));

export const packageSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only').min(3),
    title: z.string().trim().min(4, 'Title is required').max(120),
    summary: z.string().trim().min(10, 'Add a short summary').max(240),
    description: z.string().trim().min(20, 'Add a description'),
    destinationId: z.string().min(1, 'Choose a destination'),
    additionalDestinationIds: z.array(z.string()),
    operatorId: z.string().min(1, 'Assign an operator'),
    categories: z.array(z.enum(PACKAGE_CATEGORIES)).min(1, 'Pick at least one category'),
    tripType: z.enum(TRIP_TYPES),
    durationDays: z.number().int().min(1).max(30),
    durationNights: z.number().int().min(0).max(30),
    basePrice: z.number().int().min(100, 'Enter a price in ₹'),
    discountPercent: z.number().int().min(0).max(90),
    minGroupSize: z.number().int().min(1),
    maxGroupSize: z.number().int().min(1),
    vehicleCategory: z.enum(VEHICLE_CATEGORIES),
    transportDetails: z.string().trim(),
    accommodation: z.string().trim(),
    pickupPoints: stringList.min(1, 'Add a pickup point'),
    dropPoints: stringList,
    pickupDistricts: z.array(z.enum(DISTRICTS)),
    inclusions: stringList,
    exclusions: stringList,
    cancellationPolicy: z.string().trim().min(10, 'Add a cancellation policy'),
    images: z.array(z.object({ id: z.string(), url: z.string().min(1), caption: z.string().nullable(), sortOrder: z.number() })).min(1, 'Add at least one photo'),
    itinerary: z
      .array(
        z.object({
          id: z.string(),
          dayNumber: z.number().int(),
          title: z.string().trim().min(2, 'Day title required'),
          description: z.string().trim().min(2, 'Describe the day'),
          meals: z.array(z.string()),
          stay: z.string().nullable(),
        }),
      )
      .min(1, 'Add at least one itinerary day'),
    availableDates: z.array(isoDate),
    status: z.enum(PACKAGE_STATUSES),
    isFeatured: z.boolean(),
    isTrending: z.boolean(),
  })
  .refine((v) => v.maxGroupSize >= v.minGroupSize, { message: 'Max group must be ≥ min group', path: ['maxGroupSize'] })
  .refine((v) => v.durationNights <= v.durationDays, { message: 'Nights cannot exceed days', path: ['durationNights'] });

export const tripSchema = z
  .object({
    packageId: z.string().nullable(),
    title: z.string().trim().min(3, 'Title is required'),
    operatorId: z.string().min(1, 'Assign an operator'),
    vehicleId: z.string().nullable(),
    destinationId: z.string().min(1, 'Choose a destination'),
    departureDate: isoDate,
    returnDate: isoDate,
    departureTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
    departureLocation: z.string().trim().min(2, 'Enter a departure point'),
    departureDistrict: z.enum(DISTRICTS),
    totalSeats: z.number().int().min(1).max(100),
    seatsBooked: z.number().int().min(0),
    pricePerPerson: z.number().int().min(1, 'Enter a price'),
    status: z.enum(TRIP_STATUSES),
    notes: z.string(),
  })
  .refine((v) => v.returnDate >= v.departureDate, { message: 'Return must be on or after departure', path: ['returnDate'] })
  .refine((v) => v.seatsBooked <= v.totalSeats, { message: 'Booked seats exceed capacity', path: ['seatsBooked'] });

export const vehicleSchema = z.object({
  operatorId: z.string().min(1, 'Assign an owner'),
  title: z.string().trim().min(3, 'Listing title is required'),
  make: z.string().trim().min(2),
  model: z.string().trim().min(1),
  year: z.number().int().min(1990).max(2100),
  category: z.enum(VEHICLE_CATEGORIES),
  seatingCapacity: z.number().int().min(1).max(80),
  luggageCapacity: z.string().trim(),
  isAc: z.boolean(),
  driverIncluded: z.boolean(),
  pricingUnit: z.enum(PRICING_UNITS),
  price: z.number().min(1, 'Enter a price'),
  minimumCharge: z.number().min(0),
  baseDistrict: z.enum(DISTRICTS),
  pickupLocation: z.string().trim().min(2),
  amenities: stringList,
  description: z.string().trim(),
  images: z.array(z.object({ id: z.string(), url: z.string().min(1), sortOrder: z.number() })).min(1, 'Add at least one photo'),
  isAvailable: z.boolean(),
  listingStatus: z.enum(VEHICLE_LISTING_STATUSES),
  registrationVerified: z.boolean(),
});

export const operatorSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only').min(3),
  businessName: z.string().trim().min(2, 'Business name is required'),
  type: z.enum(OPERATOR_TYPES),
  contactName: z.string().trim().min(2),
  phone,
  whatsapp: phone,
  email: z.string().trim().email(),
  district: z.enum(DISTRICTS),
  address: z.string().trim(),
  description: z.string().trim(),
  logo: z.string().nullable(),
  verificationStatus: z.enum(VERIFICATION_STATUSES),
  yearsInBusiness: z.number().int().min(0).max(100),
  isDemo: z.boolean(),
});

export const destinationSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only').min(2),
  name: z.string().trim().min(2, 'Name is required'),
  district: z.enum(DISTRICTS),
  tagline: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10),
  coverImage: z.string().min(1, 'Add a cover image'),
  gallery: z.array(z.string()),
  attractions: z.array(z.object({ name: z.string().trim().min(1), description: z.string().trim() })),
  bestExperiences: stringList,
  bestTimeToVisit: z.string().trim(),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
});

export const bookingStatusSchema = z.enum(BOOKING_STATUSES);
