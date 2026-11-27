import {
  BOOKING_STATUS_LABELS,
  ENQUIRY_STATUS_LABELS,
  LISTING_STATUS_LABELS,
  PACKAGE_STATUS_LABELS,
  REVIEW_STATUS_LABELS,
  TRIP_STATUS_LABELS,
  VERIFICATION_LABELS,
  type BookingStatus,
  type EnquiryStatus,
  type PackageStatus,
  type PaymentStatus,
  type ReviewStatus,
  type ScheduledTripStatus,
  type VehicleListingStatus,
  type VerificationStatus,
} from '@travo/core';
import { Badge, type Tone } from './ui';

const booking: Record<BookingStatus, Tone> = { pending: 'gold', confirmed: 'green', rejected: 'red', cancelled: 'grey', completed: 'blue' };
const pkg: Record<PackageStatus, Tone> = { draft: 'sand', published: 'green', unpublished: 'grey', archived: 'grey' };
const trip: Record<ScheduledTripStatus, Tone> = { scheduled: 'blue', open: 'green', filling_fast: 'gold', sold_out: 'red', departed: 'blue', completed: 'grey', cancelled: 'grey' };
const verification: Record<VerificationStatus, Tone> = { pending: 'gold', verified: 'green', rejected: 'red', suspended: 'grey' };
const listing: Record<VehicleListingStatus, Tone> = { pending: 'gold', approved: 'green', rejected: 'red' };
const enquiry: Record<EnquiryStatus, Tone> = { new: 'gold', contacted: 'blue', quoted: 'sand', converted: 'green', closed: 'grey' };
const review: Record<ReviewStatus, Tone> = { published: 'green', hidden: 'grey', pending: 'gold' };
const payment: Record<PaymentStatus, Tone> = { not_started: 'grey', pending: 'gold', paid: 'green', failed: 'red', refunded: 'blue' };

export const BookingBadge = ({ s }: { s: BookingStatus }) => <Badge tone={booking[s]}>{BOOKING_STATUS_LABELS[s]}</Badge>;
export const PackageBadge = ({ s }: { s: PackageStatus }) => <Badge tone={pkg[s]}>{PACKAGE_STATUS_LABELS[s]}</Badge>;
export const TripBadge = ({ s }: { s: ScheduledTripStatus }) => <Badge tone={trip[s]}>{TRIP_STATUS_LABELS[s]}</Badge>;
export const VerificationBadge = ({ s }: { s: VerificationStatus }) => <Badge tone={verification[s]}>{VERIFICATION_LABELS[s]}</Badge>;
export const ListingBadge = ({ s }: { s: VehicleListingStatus }) => <Badge tone={listing[s]}>{LISTING_STATUS_LABELS[s]}</Badge>;
export const EnquiryBadge = ({ s }: { s: EnquiryStatus }) => <Badge tone={enquiry[s]}>{ENQUIRY_STATUS_LABELS[s]}</Badge>;
export const ReviewBadge = ({ s }: { s: ReviewStatus }) => <Badge tone={review[s]}>{REVIEW_STATUS_LABELS[s]}</Badge>;
export const PaymentBadge = ({ s }: { s: PaymentStatus }) => <Badge tone={payment[s]}>{s.replace('_', ' ')}</Badge>;
