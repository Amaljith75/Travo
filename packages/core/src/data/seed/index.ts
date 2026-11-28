import { seedDestinations } from './destinations';
import { seedOperators } from './operators';
import { seedPackages } from './packages';
import { seedVehicles } from './vehicles';
import { seedBookings, seedEnquiries, seedPayments, seedReviews, seedTrips } from './activity';
import type { PaymentRecord, Booking, Destination, Enquiry, Operator, Review, ScheduledTrip, TravelPackage, Vehicle } from '../../types';

export interface DataSnapshot {
  destinations: Destination[];
  operators: Operator[];
  packages: TravelPackage[];
  trips: ScheduledTrip[];
  vehicles: Vehicle[];
  bookings: Booking[];
  enquiries: Enquiry[];
  reviews: Review[];
  payments: PaymentRecord[];
}

/** Fresh deep copy of the demo dataset. */
export function createSeedSnapshot(): DataSnapshot {
  return JSON.parse(
    JSON.stringify({
      destinations: seedDestinations,
      operators: seedOperators,
      packages: seedPackages,
      trips: seedTrips,
      vehicles: seedVehicles,
      bookings: seedBookings,
      enquiries: seedEnquiries,
      reviews: seedReviews,
      payments: seedPayments,
    }),
  ) as DataSnapshot;
}
