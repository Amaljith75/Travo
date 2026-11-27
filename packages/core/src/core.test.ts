import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DemoAdapter, MemoryStore } from './services/demo-adapter';
import { bookingRequestSchema } from './schemas';
import { createSeedSnapshot } from './data/seed';
import { DISTRICTS } from './types';

const adapter = () => new DemoAdapter({ store: new MemoryStore(), latencyMs: 0 });

test('seed meets minimum demo volumes and covers all districts', () => {
  const s = createSeedSnapshot();
  assert.ok(s.destinations.length >= 12);
  assert.ok(s.packages.length >= 15);
  assert.ok(s.trips.length >= 8);
  assert.ok(s.vehicles.length >= 10);
  assert.ok(s.operators.length >= 5);
  assert.ok(s.bookings.length >= 10);
  for (const d of DISTRICTS) assert.ok(s.destinations.some((x) => x.district === d), `missing district ${d}`);
  const ids = new Set<string>();
  for (const p of s.packages) {
    assert.ok(s.destinations.some((d) => d.id === p.destinationId), p.slug);
    assert.ok(s.operators.some((o) => o.id === p.operatorId), p.slug);
    for (const x of [p.id, ...p.images.map((i) => i.id), ...p.itinerary.map((i) => i.id)]) {
      assert.match(x, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      assert.ok(!ids.has(x), `duplicate id ${x}`);
      ids.add(x);
    }
  }
});

test('search, filters and sorting', async () => {
  const a = adapter();
  const munnar = await a.listPackages({ query: 'munnar' });
  assert.ok(munnar.length >= 2);
  const oneDay = await a.listPackages({ categories: ['one_day'], sort: 'price_asc' });
  assert.ok(oneDay.length >= 3);
  for (let i = 1; i < oneDay.length; i++) assert.ok(oneDay[i - 1]!.basePrice * (1 - oneDay[i - 1]!.discountPercent / 100) <= oneDay[i]!.basePrice * (1 - oneDay[i]!.discountPercent / 100) + 1);
  const budget = await a.listPackages({ maxPrice: 2000 });
  assert.ok(budget.every((p) => p.basePrice * (1 - p.discountPercent / 100) <= 2000));
  const big = await a.listVehicles({ minSeats: 20 });
  assert.ok(big.every((v) => v.seatingCapacity >= 20));
});

test('booking request is stored with a reference and can be looked up', async () => {
  const a = adapter();
  const [pkg] = await a.listPackages({ query: 'athirappilly' });
  const input = bookingRequestSchema.parse({
    packageId: pkg!.id, scheduledTripId: null, vehicleId: null, travelDate: '2030-01-05', adults: 2, children: 1,
    pickupLocation: 'Kochi', contactName: 'Test User', contactPhone: '98470 00000', contactEmail: '', specialRequirements: '',
    preferredPaymentMethod: 'pay_at_operator', source: 'mobile',
  });
  const receipt = await a.createBooking(input);
  assert.match(receipt.reference, /^TRV-\d{2}[A-Z0-9]{6}$/);
  assert.equal(receipt.status, 'pending');
  const found = await a.lookupBooking(receipt.reference, '+91 98470 00000');
  assert.equal(found?.contactName, 'Test User');
  assert.equal(await a.lookupBooking(receipt.reference, '9999999999'), null);
});

test('confirming a trip booking holds seats and enforces capacity', async () => {
  const a = adapter();
  const trips = await a.listTrips();
  const trip = trips.find((t) => t.totalSeats - t.seatsBooked >= 2)!;
  const r = await a.createBooking({ packageId: trip.packageId, scheduledTripId: trip.id, vehicleId: null, travelDate: trip.departureDate, adults: 2, children: 0, pickupLocation: 'x', contactName: 'Seat Test', contactPhone: '9847011112', contactEmail: null, specialRequirements: null, preferredPaymentMethod: 'upi', source: 'mobile' });
  const booking = (await a.listBookings({ query: r.reference }))[0]!;
  await a.updateBookingStatus(booking.id, 'confirmed');
  assert.equal((await a.getTrip(trip.id))!.seatsBooked, trip.seatsBooked + 2);
  await a.updateBookingStatus(booking.id, 'cancelled');
  assert.equal((await a.getTrip(trip.id))!.seatsBooked, trip.seatsBooked);
  const soldOut = trips.find((t) => t.status === 'sold_out');
  if (soldOut) await assert.rejects(a.createBooking({ ...booking, scheduledTripId: soldOut.id, packageId: soldOut.packageId, source: 'mobile' }));
});

test('demo data persists through the store and can be reset', async () => {
  const store = new MemoryStore();
  const a = new DemoAdapter({ store, latencyMs: 0 });
  const d = (await a.listDestinations())[0]!;
  await a.saveDestination({ ...d, name: 'Renamed' }, d.id);
  const b = new DemoAdapter({ store, latencyMs: 0 });
  assert.equal((await b.getDestination(d.id))!.name, 'Renamed');
  await b.reset();
  assert.notEqual((await b.getDestination(d.id))!.name, 'Renamed');
});

test('deleting a package with bookings is refused', async () => {
  const a = adapter();
  const b = (await a.listBookings())[0]!;
  await assert.rejects(a.deletePackage(b.packageId!), /Archive/);
});
