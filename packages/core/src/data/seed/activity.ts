import type { PaymentRecord, Booking, BookingStatus, Enquiry, PaymentMethod, Review, ScheduledTrip, ScheduledTripStatus } from '../../types';
import { addDays, todayISO } from '../../utils/format';
import { bookingId, childId, enquiryId, reviewId, tripId } from './ids';
import { DEST } from './destinations';
import { OP } from './operators';
import { PKG, seedPackages } from './packages';
import { VEH } from './vehicles';

const today = todayISO();
const daysAgoISO = (d: number, hour = 10) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(hour, 15, 0, 0);
  return t.toISOString();
};

interface TripSeed {
  pkg: string;
  title: string;
  op: string;
  veh: number | null;
  dest: string;
  inDays: number;
  len: number;
  time: string;
  from: string;
  district: ScheduledTrip['departureDistrict'];
  seats: number;
  booked: number;
  price: number;
  status: ScheduledTripStatus;
  notes?: string;
}

const tripSeeds: TripSeed[] = [
  { pkg: 'munnar-weekend-escape', title: 'Munnar Weekend Escape', op: OP.highrange, veh: 7, dest: 'munnar', inDays: 5, len: 2, time: '06:00', from: 'Kochi — Vyttila Hub', district: 'Ernakulam', seats: 12, booked: 7, price: 4999, status: 'filling_fast' },
  { pkg: 'munnar-weekend-escape', title: 'Munnar Weekend Escape', op: OP.highrange, veh: 7, dest: 'munnar', inDays: 12, len: 2, time: '06:00', from: 'Kochi — Vyttila Hub', district: 'Ernakulam', seats: 12, booked: 3, price: 4999, status: 'open' },
  { pkg: 'vagamon-group-camping', title: 'Vagamon Meadows Camp Night', op: OP.highrange, veh: 7, dest: 'vagamon', inDays: 6, len: 1, time: '07:00', from: 'Kottayam KSRTC', district: 'Kottayam', seats: 17, booked: 17, price: 2999, status: 'sold_out' },
  { pkg: 'wayanad-3-day-adventure', title: 'Wayanad Trek & Safari', op: OP.malabar, veh: null, dest: 'wayanad', inDays: 9, len: 2, time: '05:30', from: 'Kozhikode railway station', district: 'Kozhikode', seats: 14, booked: 6, price: 6499, status: 'open' },
  { pkg: 'sabarimala-pilgrimage-package', title: 'Sabarimala Mandala Batch', op: OP.coastline, veh: 9, dest: 'sabarimala', inDays: 3, len: 1, time: '19:00', from: 'Thiruvananthapuram Thampanoor', district: 'Thiruvananthapuram', seats: 45, booked: 38, price: 1899, status: 'filling_fast' },
  { pkg: 'fort-kochi-heritage-day', title: 'Saturday Heritage Walk', op: OP.greenleaf, veh: null, dest: 'fort-kochi', inDays: 2, len: 0, time: '09:00', from: 'Vasco da Gama Square', district: 'Ernakulam', seats: 12, booked: 4, price: 1199, status: 'open' },
  { pkg: 'luxury-kerala-coach-tour', title: 'Kerala Grand Coach Tour', op: OP.coastline, veh: 10, dest: 'fort-kochi', inDays: 18, len: 5, time: '10:00', from: 'Kochi airport', district: 'Ernakulam', seats: 41, booked: 12, price: 21999, status: 'open' },
  { pkg: 'munroe-island-canoe-day', title: 'Munroe Island Sunrise Canoe', op: OP.coastline, veh: null, dest: 'munroe-island', inDays: 4, len: 0, time: '06:30', from: 'Munroe Island jetty', district: 'Kollam', seats: 10, booked: 2, price: 899, status: 'open' },
  { pkg: 'munnar-weekend-escape', title: 'Munnar Weekend Escape', op: OP.highrange, veh: 7, dest: 'munnar', inDays: -9, len: 2, time: '06:00', from: 'Kochi — Vyttila Hub', district: 'Ernakulam', seats: 12, booked: 12, price: 4999, status: 'completed' },
];

export const seedTrips: ScheduledTrip[] = tripSeeds.map((t, i) => ({
  id: tripId(i + 1),
  packageId: PKG[t.pkg] ?? null,
  title: t.title,
  operatorId: t.op,
  vehicleId: t.veh ? VEH[t.veh] ?? null : null,
  destinationId: DEST[t.dest]!,
  departureDate: addDays(today, t.inDays),
  returnDate: addDays(today, t.inDays + t.len),
  departureTime: t.time,
  departureLocation: t.from,
  departureDistrict: t.district,
  totalSeats: t.seats,
  seatsBooked: t.booked,
  pricePerPerson: t.price,
  status: t.status,
  notes: t.notes ?? '',
  createdAt: daysAgoISO(30),
  updatedAt: daysAgoISO(2),
}));

interface BookingSeed {
  ref: string;
  pkg: string;
  trip?: number;
  travelIn: number;
  adults: number;
  children: number;
  pickup: string;
  name: string;
  phone: string;
  email?: string;
  req?: string;
  pay: PaymentMethod;
  status: BookingStatus;
  createdAgo: number;
  note?: string;
}

const bookingSeeds: BookingSeed[] = [
  { ref: 'TRV-26A7KQ2M', pkg: 'munnar-weekend-escape', trip: 1, travelIn: 5, adults: 2, children: 1, pickup: 'Vyttila Hub', name: 'Arjun Pillai', phone: '+91 98470 11111', email: 'arjun@example.com', pay: 'pay_at_operator', status: 'confirmed', createdAgo: 6, note: 'Advance collected offline by operator.' },
  { ref: 'TRV-26B3XN8P', pkg: 'alleppey-houseboat-overnight', travelIn: 11, adults: 2, children: 0, pickup: 'Finishing Point jetty', name: 'Sneha Kurian', phone: '+91 98470 22222', email: 'sneha@example.com', req: 'Honeymoon — flower decoration please.', pay: 'upi', status: 'pending', createdAgo: 1 },
  { ref: 'TRV-26C9RT4H', pkg: 'athirappilly-waterfall-day-trip', travelIn: 3, adults: 4, children: 2, pickup: 'Kakkanad', name: 'Mohammed Shafi', phone: '+91 98470 33333', pay: 'pay_at_operator', status: 'pending', createdAgo: 0 },
  { ref: 'TRV-26D2LM6W', pkg: 'kerala-5-day-family-tour', travelIn: 25, adults: 2, children: 2, pickup: 'Kochi airport', name: 'Priya Sharma', phone: '+91 98110 44444', email: 'priya@example.com', req: 'Flying in from Delhi, arriving 10:40 am.', pay: 'card', status: 'confirmed', createdAgo: 9 },
  { ref: 'TRV-26E5QW9Z', pkg: 'vagamon-group-camping', trip: 3, travelIn: 6, adults: 8, children: 0, pickup: 'Kottayam KSRTC', name: 'Rahul Krishnan', phone: '+91 98470 55555', req: 'Office team outing — need GST invoice.', pay: 'netbanking', status: 'confirmed', createdAgo: 12 },
  { ref: 'TRV-26F8HJ3K', pkg: 'sabarimala-pilgrimage-package', trip: 5, travelIn: 3, adults: 6, children: 0, pickup: 'Thampanoor', name: 'Gopakumar R', phone: '+91 98470 66666', pay: 'pay_at_operator', status: 'pending', createdAgo: 2 },
  { ref: 'TRV-26G4PS7N', pkg: 'wayanad-3-day-adventure', trip: 4, travelIn: 9, adults: 3, children: 0, pickup: 'Kozhikode station', name: 'Ananya Rao', phone: '+91 99000 77777', email: 'ananya@example.com', pay: 'upi', status: 'rejected', createdAgo: 4, note: 'Group size below minimum for the date; offered next departure.' },
  { ref: 'TRV-26H6VB2C', pkg: 'kerala-honeymoon-7-days', travelIn: 40, adults: 2, children: 0, pickup: 'Kochi airport', name: 'Karthik & Divya', phone: '+91 98450 88888', email: 'karthik@example.com', req: 'Vegetarian meals only.', pay: 'card', status: 'pending', createdAgo: 3 },
  { ref: 'TRV-26J9TY5D', pkg: 'munnar-weekend-escape', trip: 9, travelIn: -9, adults: 2, children: 0, pickup: 'Aluva metro', name: 'Lakshmi Nair', phone: '+91 98470 99999', pay: 'pay_at_operator', status: 'completed', createdAgo: 20 },
  { ref: 'TRV-26K2FG8R', pkg: 'fort-kochi-heritage-day', trip: 6, travelIn: 2, adults: 2, children: 0, pickup: 'Vasco da Gama Square', name: 'Emma Wilson', phone: '+44 7700 900123', email: 'emma@example.com', pay: 'wallet', status: 'cancelled', createdAgo: 5, note: 'Traveller cancelled — flight change.' },
  { ref: 'TRV-26L7MN4X', pkg: 'kumarakom-lake-luxury', travelIn: 15, adults: 2, children: 0, pickup: 'Kochi airport', name: 'Vikram Mehta', phone: '+91 98200 12121', email: 'vikram@example.com', pay: 'card', status: 'confirmed', createdAgo: 7 },
  { ref: 'TRV-26M3QR6T', pkg: 'luxury-kerala-coach-tour', trip: 7, travelIn: 18, adults: 12, children: 0, pickup: 'Kochi airport', name: 'Kerala Teachers Assoc. (Demo)', phone: '+91 98470 13131', req: 'Need wheelchair access for two members.', pay: 'netbanking', status: 'pending', createdAgo: 1 },
];

const pkgById = new Map(seedPackages.map((p) => [p.id, p]));

export const seedBookings: Booking[] = bookingSeeds.map((b, i) => {
  const packageId = PKG[b.pkg]!;
  const pkg = pkgById.get(packageId)!;
  const trip = b.trip ? seedTrips[b.trip - 1] : undefined;
  const unit = trip ? trip.pricePerPerson : Math.round(pkg.basePrice * (1 - pkg.discountPercent / 100));
  const createdAt = daysAgoISO(b.createdAgo, 9 + (i % 8));
  return {
    id: bookingId(i + 1),
    reference: b.ref,
    packageId,
    scheduledTripId: trip?.id ?? null,
    vehicleId: null,
    operatorId: pkg.operatorId,
    travelDate: trip?.departureDate ?? addDays(today, b.travelIn),
    adults: b.adults,
    children: b.children,
    pickupLocation: b.pickup,
    contactName: b.name,
    contactPhone: b.phone,
    contactEmail: b.email ?? null,
    specialRequirements: b.req ?? null,
    preferredPaymentMethod: b.pay,
    estimatedTotal: unit * b.adults + Math.round(unit * 0.5) * b.children,
    status: b.status,
    passengers: [{ id: childId('8', i + 1, 1), fullName: b.name, age: null, type: 'adult' }],
    internalNotes: b.note ? [{ id: childId('9', i + 1, 1), body: b.note, author: 'Admin', createdAt }] : [],
    source: 'mobile',
    createdAt,
    updatedAt: createdAt,
  };
});

export const seedEnquiries: Enquiry[] = [
  { id: enquiryId(1), reference: 'ENQ-26P4WX7A', type: 'vehicle', vehicleId: VEH[3] ?? null, packageId: null, operatorId: OP.greenleaf, pickupLocation: 'Kochi airport', destination: 'Munnar', stops: ['Cheeyappara falls'], travelDate: addDays(today, 8), returnDate: addDays(today, 10), passengers: 5, contactName: 'Nikhil Joseph', contactPhone: '+91 98470 14141', contactEmail: null, message: 'Need a driver who speaks Hindi.', status: 'new', createdAt: daysAgoISO(0, 8), updatedAt: daysAgoISO(0, 8) },
  { id: enquiryId(2), reference: 'ENQ-26Q8RT2B', type: 'custom_trip', vehicleId: null, packageId: null, operatorId: null, pickupLocation: 'Thrissur', destination: 'Guruvayur & Athirappilly', stops: ['Guruvayur temple'], travelDate: addDays(today, 4), returnDate: null, passengers: 10, contactName: 'Sreeja M', contactPhone: '+91 98470 15151', contactEmail: 'sreeja@example.com', message: 'Family of 10 including elders.', status: 'contacted', createdAt: daysAgoISO(2), updatedAt: daysAgoISO(1) },
  { id: enquiryId(3), reference: 'ENQ-26R2YU5C', type: 'vehicle', vehicleId: VEH[6] ?? null, packageId: null, operatorId: OP.coastline, pickupLocation: 'Kollam', destination: 'Kanyakumari', stops: ['Kovalam'], travelDate: addDays(today, 14), returnDate: addDays(today, 15), passengers: 11, contactName: 'Abdul Kareem', contactPhone: '+91 98470 16161', contactEmail: null, message: null, status: 'quoted', createdAt: daysAgoISO(5), updatedAt: daysAgoISO(3) },
];

interface ReviewSeed {
  pkg?: string;
  veh?: number;
  op: string;
  name: string;
  city: string;
  rating: number;
  title: string;
  body: string;
  month: string;
  status?: Review['status'];
}

const reviewSeeds: ReviewSeed[] = [
  { pkg: 'munnar-weekend-escape', op: OP.highrange, name: 'Arun V', city: 'Kochi', rating: 5, title: 'Perfectly paced weekend', body: 'Trip captain was fantastic and the resort view was stunning. The campfire night was a highlight.', month: 'October 2026' },
  { pkg: 'munnar-weekend-escape', op: OP.highrange, name: 'Meera S', city: 'Bengaluru', rating: 4, title: 'Great value', body: 'Lovely group and comfortable traveller. Would have liked more time at Eravikulam.', month: 'September 2026' },
  { pkg: 'alleppey-houseboat-overnight', op: OP.backwater, name: 'Rohit & Neha', city: 'Mumbai', rating: 5, title: 'Best food of our trip', body: 'The chef’s karimeen pollichathu was unforgettable. Clean, quiet and very private.', month: 'October 2026' },
  { pkg: 'athirappilly-waterfall-day-trip', op: OP.jomon, name: 'Fathima K', city: 'Thrissur', rating: 5, title: 'Safe and punctual driver', body: 'Jomon chettan was on time, drove carefully and knew the best viewpoints.', month: 'August 2026' },
  { pkg: 'kerala-5-day-family-tour', op: OP.greenleaf, name: 'The Agarwal family', city: 'Jaipur', rating: 5, title: 'Kids loved every day', body: 'Hotels were well chosen and the houseboat was the cherry on top.', month: 'July 2026' },
  { pkg: 'wayanad-3-day-adventure', op: OP.malabar, name: 'Sanjay P', city: 'Chennai', rating: 4, title: 'Tough but rewarding trek', body: 'Chembra is steep — the guide was patient. Camp food was simple but good.', month: 'October 2026' },
  { pkg: 'vagamon-group-camping', op: OP.highrange, name: 'Team Pixel (Demo)', city: 'Kochi', rating: 5, title: 'Ideal team outing', body: 'Smooth logistics for 15 of us. Paragliding was worth it.', month: 'September 2026' },
  { veh: 5, op: OP.highrange, name: 'Diya R', city: 'Pune', rating: 5, title: 'Kolukkumalai sunrise!', body: 'Bumpy but exhilarating ride; driver stopped for every photo.', month: 'October 2026' },
  { pkg: 'fort-kochi-heritage-day', op: OP.greenleaf, name: 'Tom H', city: 'London', rating: 4, title: 'Lovely guide', body: 'Lots of history and great food stops. A little rushed at the end.', month: 'November 2026', status: 'pending' },
];

export const seedReviews: Review[] = reviewSeeds.map((r, i) => ({
  id: reviewId(i + 1),
  packageId: r.pkg ? PKG[r.pkg] ?? null : null,
  vehicleId: r.veh ? VEH[r.veh] ?? null : null,
  operatorId: r.op,
  authorName: r.name,
  authorCity: r.city,
  rating: r.rating,
  title: r.title,
  body: r.body,
  travelMonth: r.month,
  status: r.status ?? 'published',
  createdAt: daysAgoISO(10 + i * 3),
  updatedAt: daysAgoISO(10 + i * 3),
}));

/** Offline payments recorded by admins against confirmed bookings. */
export const seedPayments: PaymentRecord[] = seedBookings
  .filter((b) => b.status === 'confirmed' || b.status === 'completed')
  .map((b, i) => ({
    id: `30000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    bookingId: b.id,
    provider: 'offline',
    method: b.preferredPaymentMethod === 'pay_at_operator' ? 'pay_at_operator' : b.preferredPaymentMethod,
    amount: b.status === 'completed' ? b.estimatedTotal : Math.round(b.estimatedTotal * 0.3),
    currency: 'INR' as const,
    status: 'paid' as const,
    providerReference: `ADV-${b.reference.slice(4)}`,
    notes: b.status === 'completed' ? 'Paid in full' : '30% advance collected by operator',
    createdAt: b.updatedAt,
    updatedAt: b.updatedAt,
  }));
