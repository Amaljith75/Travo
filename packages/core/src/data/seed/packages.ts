import type { District, PackageCategory, TravelPackage, TripType, VehicleCategory } from '../../types';
import { photo, type PhotoKey } from '../../utils/media';
import { addDays, todayISO } from '../../utils/format';
import { childId, DEMO_TIMESTAMP, pkgId } from './ids';
import { DEST } from './destinations';
import { OP } from './operators';

interface Seed {
  slug: string;
  title: string;
  summary: string;
  description: string;
  destination: string;
  also?: string[];
  operatorId: string;
  categories: PackageCategory[];
  tripType: TripType;
  days: number;
  nights: number;
  price: number;
  discount?: number;
  group: [number, number];
  vehicle: VehicleCategory;
  transport: string;
  accommodation: string;
  pickup: string[];
  drop?: string[];
  pickupDistricts: District[];
  inclusions: string[];
  exclusions: string[];
  cancellation?: string;
  photos: PhotoKey[];
  itinerary: [title: string, description: string, meals?: string[], stay?: string][];
  featured?: boolean;
  trending?: boolean;
  rating: number;
  reviews: number;
  bookings: number;
  /** Days from today when the package can run; omitted = on request any day. */
  dateOffsets?: number[];
  createdDaysAgo: number;
}

const STANDARD_CANCELLATION =
  'Free cancellation up to 7 days before travel. 50% refund between 7 and 3 days. No refund within 72 hours of departure. Weather-related cancellations by the operator are fully refunded.';
const DAY_TRIP_CANCELLATION = 'Free cancellation up to 48 hours before departure. 50% refund within 48 hours. No refund for no-shows.';

const seeds: Seed[] = [
  {
    slug: 'athirappilly-waterfall-day-trip',
    title: 'Athirappilly & Vazhachal Waterfall Day Trip',
    summary: 'Kerala’s grandest waterfall, rainforest drive and a riverside lunch — back by evening.',
    description: 'Leave Kochi early for the 80-ft Athirappilly falls, walk down to the base viewpoint, continue to Vazhachal and drive into the Sholayar forest for hornbill spotting. A Kerala sadya lunch is served at a riverside restaurant.',
    destination: 'athirappilly', operatorId: OP.jomon, categories: ['one_day', 'family', 'budget'], tripType: 'private',
    days: 1, nights: 0, price: 1499, discount: 10, group: [2, 7], vehicle: 'muv',
    transport: 'Private AC car or Innova with driver, door pickup in Kochi or Thrissur.', accommodation: 'Not applicable (day trip).',
    pickup: ['Kochi city', 'Kochi airport', 'Thrissur town'], pickupDistricts: ['Ernakulam', 'Thrissur'],
    inclusions: ['Private AC vehicle with driver', 'Fuel, tolls and parking', 'Kerala sadya lunch', 'Bottled water'],
    exclusions: ['Waterfall entry tickets (₹50)', 'Personal expenses'], cancellation: DAY_TRIP_CANCELLATION,
    photos: ['waterfall', 'forest', 'mistyHills'],
    itinerary: [['Waterfalls and rainforest', 'Pickup 7:00 am · Athirappilly falls by 9:30 · Vazhachal · Sholayar drive · Lunch · Drop by 6:30 pm.', ['Lunch']]],
    featured: true, trending: true, rating: 4.8, reviews: 96, bookings: 412, createdDaysAgo: 120,
  },
  {
    slug: 'munnar-weekend-escape',
    title: 'Munnar Weekend Escape',
    summary: 'Two nights in the tea hills with Eravikulam, Mattupetty and Top Station sunrise.',
    description: 'The classic Kerala hill-station weekend. Climb into the High Ranges past Cheeyappara and Valara waterfalls, stay at a valley-view resort and spend two days among tea estates, dams and viewpoints.',
    destination: 'munnar', operatorId: OP.highrange, categories: ['weekend', 'group', 'family'], tripType: 'group',
    days: 3, nights: 2, price: 4999, group: [6, 12], vehicle: 'tempo_traveller',
    transport: 'AC 12-seater Tempo Traveller from Kochi.', accommodation: 'Valley-view resort, twin/triple sharing.',
    pickup: ['Kochi — Vyttila Hub', 'Aluva metro station'], drop: ['Kochi — Vyttila Hub'], pickupDistricts: ['Ernakulam'],
    inclusions: ['AC Tempo Traveller', '2 nights resort stay', 'Breakfast and dinner', 'Trip captain', 'Campfire night'],
    exclusions: ['Lunches', 'Entry tickets', 'Jeep safari (optional)'],
    photos: ['teaHills', 'teaRows', 'mistyHills', 'waterfall'],
    itinerary: [
      ['Kochi to Munnar', 'Depart 6:00 am, breakfast en route, Cheeyappara falls, spice garden, check-in and campfire.', ['Breakfast', 'Dinner'], 'Valley-view resort'],
      ['Eravikulam & Mattupetty', 'Nilgiri tahr at Eravikulam, Tea Museum, Mattupetty dam boating, Echo Point.', ['Breakfast', 'Dinner'], 'Valley-view resort'],
      ['Top Station & return', 'Optional sunrise at Top Station, checkout, return to Kochi by 7:00 pm.', ['Breakfast']],
    ],
    featured: true, trending: true, rating: 4.7, reviews: 214, bookings: 980, createdDaysAgo: 200,
  },
  {
    slug: 'alleppey-houseboat-overnight',
    title: 'Alleppey Premium Houseboat Overnight',
    summary: 'A private kettuvallam cruise on Vembanad Lake with chef-cooked Kerala meals.',
    description: 'Board a private premium houseboat at noon and drift through Kuttanad’s canals and paddy fields. Your on-board chef prepares karimeen pollichathu and fresh appam; the boat anchors at sunset for a quiet night on the lake.',
    destination: 'alleppey', also: ['kumarakom'], operatorId: OP.backwater, categories: ['couple', 'honeymoon', 'luxury', 'weekend'], tripType: 'private',
    days: 2, nights: 1, price: 7499, discount: 15, group: [2, 4], vehicle: 'sedan',
    transport: 'Optional private sedan transfer from Kochi (add-on).', accommodation: 'Private 1–2 bedroom premium houseboat with AC bedrooms.',
    pickup: ['Alappuzha Finishing Point jetty', 'Kochi (with transfer add-on)'], pickupDistricts: ['Alappuzha', 'Ernakulam'],
    inclusions: ['Private houseboat for 22 hours', 'Lunch, evening snacks, dinner, breakfast', 'AC in bedrooms (9 pm – 6 am)', 'Welcome drink'],
    exclusions: ['Transfers to the jetty', 'Alcohol', 'Shikara ride'],
    photos: ['houseboat', 'backwaters', 'canoe'],
    itinerary: [
      ['Board and cruise', 'Check-in 12:00 pm, cruise through Vembanad and Kuttanad canals, village walk, sunset anchor.', ['Lunch', 'Snacks', 'Dinner'], 'Premium houseboat'],
      ['Morning on the lake', 'Breakfast on deck, checkout 9:00 am.', ['Breakfast']],
    ],
    featured: true, trending: true, rating: 4.9, reviews: 178, bookings: 640, createdDaysAgo: 160,
  },
  {
    slug: 'wayanad-3-day-adventure',
    title: 'Wayanad 3-Day Adventure',
    summary: 'Chembra heart-lake trek, Edakkal caves and a wildlife jeep safari.',
    description: 'For active travellers: trek Chembra Peak to the heart-shaped lake, scramble up to Edakkal’s Neolithic carvings, kayak on Pookode lake and ride into Muthanga sanctuary at dawn.',
    destination: 'wayanad', operatorId: OP.malabar, categories: ['adventure', 'multi_day', 'group'], tripType: 'group',
    days: 3, nights: 2, price: 6499, group: [6, 14], vehicle: 'tempo_traveller',
    transport: 'AC Tempo Traveller from Kozhikode.', accommodation: 'Plantation homestay & tented camp.',
    pickup: ['Kozhikode railway station', 'Calicut airport'], pickupDistricts: ['Kozhikode', 'Malappuram'],
    inclusions: ['Transport', '2 nights stay', 'All meals', 'Trek guide & forest permits', 'Muthanga safari'],
    exclusions: ['Personal gear', 'Camera fees'],
    photos: ['forest', 'mistyHills', 'wildlife'],
    itinerary: [
      ['Into the hills', 'Thamarassery ghat drive, Pookode lake kayaking, camp check-in and barbecue.', ['Lunch', 'Dinner'], 'Tented camp'],
      ['Chembra Peak trek', 'Guided trek to the heart lake (permits included), evening at Banasura dam.', ['Breakfast', 'Lunch', 'Dinner'], 'Plantation homestay'],
      ['Safari & Edakkal', 'Dawn Muthanga safari, Edakkal caves, return to Kozhikode by 7:30 pm.', ['Breakfast', 'Lunch']],
    ],
    trending: true, rating: 4.7, reviews: 88, bookings: 310, createdDaysAgo: 90,
  },
  {
    slug: 'kerala-5-day-family-tour',
    title: 'Kerala Classic 5-Day Family Tour',
    summary: 'Kochi, Munnar, Thekkady and an Alleppey houseboat — the full Kerala in one trip.',
    description: 'A comfortable, well-paced circuit for families: Fort Kochi heritage, two nights in Munnar, a spice-country night in Thekkady and a final night on a private houseboat. Private Innova with a dedicated driver throughout.',
    destination: 'munnar', also: ['fort-kochi', 'thekkady', 'alleppey'], operatorId: OP.greenleaf, categories: ['family', 'multi_day'], tripType: 'private',
    days: 5, nights: 4, price: 18999, discount: 8, group: [2, 6], vehicle: 'muv',
    transport: 'Private Toyota Innova Crysta with driver for 5 days.', accommodation: '3-star hotels and a deluxe houseboat.',
    pickup: ['Kochi airport', 'Ernakulam railway station'], drop: ['Kochi airport'], pickupDistricts: ['Ernakulam'],
    inclusions: ['Private Innova Crysta', '4 nights stay', 'Daily breakfast', 'Houseboat full board', 'Driver allowance and tolls'],
    exclusions: ['Flights/trains', 'Entry tickets', 'Lunches and dinners except houseboat'],
    photos: ['teaHills', 'houseboat', 'fortKochi', 'spices'],
    itinerary: [
      ['Arrive Kochi', 'Fort Kochi heritage walk, Chinese fishing nets at sunset, Kathakali show.', [], 'Kochi'],
      ['Kochi to Munnar', 'Scenic drive with waterfall stops, spice garden, evening at leisure.', ['Breakfast'], 'Munnar'],
      ['Munnar sightseeing', 'Eravikulam, Tea Museum, Mattupetty dam and Echo Point.', ['Breakfast'], 'Munnar'],
      ['Munnar to Thekkady', 'Periyar boat safari, spice plantation tour, Kalaripayattu show.', ['Breakfast'], 'Thekkady'],
      ['Alleppey houseboat', 'Board at noon, cruise Vembanad, drop at Kochi airport next morning (add-on night) or same evening.', ['Breakfast', 'Lunch']],
    ],
    featured: true, rating: 4.8, reviews: 151, bookings: 520, createdDaysAgo: 240,
  },
  {
    slug: 'vagamon-group-camping',
    title: 'Vagamon Meadows Group Camping',
    summary: 'Overnight tents, campfire, pine forest and optional paragliding.',
    description: 'A sociable weekend for friend groups and colleagues. Camp on a private meadow with a campfire and barbecue, walk the pine forest at dawn and try paragliding with certified pilots (weather permitting).',
    destination: 'vagamon', operatorId: OP.highrange, categories: ['group', 'adventure', 'weekend', 'budget'], tripType: 'group',
    days: 2, nights: 1, price: 2999, group: [8, 17], vehicle: 'tempo_traveller',
    transport: 'AC Tempo Traveller from Kochi or Kottayam.', accommodation: 'Dome tents, 3 per tent, shared washrooms.',
    pickup: ['Kochi — Vyttila Hub', 'Kottayam KSRTC'], pickupDistricts: ['Ernakulam', 'Kottayam'],
    inclusions: ['Transport', 'Tent stay', 'Dinner, barbecue & breakfast', 'Campfire', 'Trip captain'],
    exclusions: ['Paragliding (₹3,500)', 'Lunch'],
    photos: ['meadow', 'mistyHills'],
    itinerary: [
      ['Up to the meadows', 'Depart 7:00 am, Thangalpara, Vagamon meadows, camp games, barbecue night.', ['Dinner'], 'Meadow campsite'],
      ['Pine forest & return', 'Sunrise walk, pine forest, optional paragliding, return by 6:00 pm.', ['Breakfast']],
    ],
    trending: true, rating: 4.6, reviews: 120, bookings: 455, createdDaysAgo: 45,
  },
  {
    slug: 'sabarimala-pilgrimage-package',
    title: 'Sabarimala Mandala Season Pilgrimage',
    summary: 'Hassle-free travel to Pamba with Erumely stop and return — by bus or tempo traveller.',
    description: 'Operated during the Mandala–Makaravilakku season for groups of devotees. Includes the traditional Erumely stop, transport to Pamba and return after darshan. Virtual Queue booking assistance is provided.',
    destination: 'sabarimala', operatorId: OP.coastline, categories: ['pilgrimage', 'group', 'budget'], tripType: 'group',
    days: 2, nights: 1, price: 1899, group: [10, 45], vehicle: 'tourist_bus',
    transport: 'Tourist bus or tempo traveller depending on group size.', accommodation: 'Rest stop at Pamba / Nilakkal (basic).',
    pickup: ['Thiruvananthapuram Thampanoor', 'Kollam', 'Kottayam'], pickupDistricts: ['Thiruvananthapuram', 'Kollam', 'Kottayam'],
    inclusions: ['Return transport', 'Virtual Queue booking help', 'Driver bata and tolls', 'Coordinator'],
    exclusions: ['Food', 'Offerings', 'Accommodation upgrades'],
    photos: ['temple', 'forest'],
    itinerary: [
      ['Departure to Erumely and Pamba', 'Evening departure, Erumely Petta Thullal stop, reach Nilakkal / Pamba.'],
      ['Darshan and return', 'Climb to Sannidhanam, darshan, return journey.'],
    ],
    rating: 4.5, reviews: 210, bookings: 1320, createdDaysAgo: 30,
  },
  {
    slug: 'varkala-cliff-beach-weekend',
    title: 'Varkala Cliff & Beach Weekend',
    summary: 'Cliff-top stay, sunset cafés, a surf lesson and an Ayurvedic massage.',
    description: 'A laid-back coastal weekend on Varkala’s North Cliff: beginner surf session, Kappil backwater kayak and a 60-minute Abhyanga massage.',
    destination: 'varkala', operatorId: OP.greenleaf, categories: ['couple', 'weekend'], tripType: 'private',
    days: 3, nights: 2, price: 8999, group: [2, 4], vehicle: 'sedan',
    transport: 'Private sedan from Thiruvananthapuram airport / station.', accommodation: 'Boutique cliff-top resort.',
    pickup: ['Thiruvananthapuram airport', 'Varkala Sivagiri station'], pickupDistricts: ['Thiruvananthapuram', 'Kollam'],
    inclusions: ['Transfers', '2 nights stay', 'Breakfast', 'Surf lesson', 'Ayurvedic massage'],
    exclusions: ['Lunch and dinner', 'Kayak rental'],
    photos: ['beachCliff', 'palmBeach', 'lighthouse'],
    itinerary: [
      ['Arrive Varkala', 'Transfer, check-in, sunset on North Cliff.', [], 'Cliff-top resort'],
      ['Surf & spa', 'Morning surf lesson, afternoon Ayurveda, Kappil sunset.', ['Breakfast'], 'Cliff-top resort'],
      ['Departure', 'Papanasam beach, Janardanaswamy temple, drop.', ['Breakfast']],
    ],
    rating: 4.6, reviews: 64, bookings: 190, createdDaysAgo: 75,
  },
  {
    slug: 'kerala-honeymoon-7-days',
    title: 'Kerala Honeymoon — Hills, Lake & Sea',
    summary: '7 days of Munnar, Thekkady, a private houseboat and Kovalam with romantic extras.',
    description: 'Candle-light dinners, flower bed decorations, a private houseboat night and a beach resort finale. Fully private with a dedicated chauffeur.',
    destination: 'munnar', also: ['thekkady', 'alleppey', 'kovalam'], operatorId: OP.greenleaf, categories: ['honeymoon', 'couple', 'luxury', 'multi_day'], tripType: 'private',
    days: 7, nights: 6, price: 42999, discount: 12, group: [2, 2], vehicle: 'sedan',
    transport: 'Private sedan with chauffeur for 7 days.', accommodation: '4-star resorts and a premium houseboat.',
    pickup: ['Kochi airport'], drop: ['Thiruvananthapuram airport'], pickupDistricts: ['Ernakulam'],
    inclusions: ['All transfers', '6 nights stay', 'Breakfast daily', 'Candle-light dinner', 'Houseboat full board', 'Honeymoon decorations'],
    exclusions: ['Flights', 'Entry tickets', 'Personal expenses'],
    photos: ['teaHills', 'houseboat', 'lighthouse', 'backwaters'],
    itinerary: [
      ['Kochi to Munnar', 'Airport pickup and scenic drive to the hills.', [], 'Munnar'],
      ['Munnar', 'Tea gardens, Eravikulam, candle-light dinner.', ['Breakfast', 'Dinner'], 'Munnar'],
      ['Munnar to Thekkady', 'Spice country and a lake cruise.', ['Breakfast'], 'Thekkady'],
      ['Thekkady to Alleppey', 'Private houseboat with chef.', ['Breakfast', 'Lunch', 'Dinner'], 'Premium houseboat'],
      ['Alleppey to Kovalam', 'Coastal drive south to Kovalam.', ['Breakfast'], 'Kovalam beach resort'],
      ['Kovalam', 'Beach day and Ayurvedic couples massage.', ['Breakfast'], 'Kovalam beach resort'],
      ['Departure', 'Drop at Thiruvananthapuram airport.', ['Breakfast']],
    ],
    featured: true, rating: 4.9, reviews: 73, bookings: 140, createdDaysAgo: 300,
  },
  {
    slug: 'thekkady-spice-wildlife',
    title: 'Thekkady Spice & Wildlife Getaway',
    summary: 'Periyar boat safari, spice plantation walk and a jungle-edge resort.',
    description: 'Two days in the cardamom hills around Periyar Tiger Reserve with a lake safari, plantation walk and an evening Kalaripayattu performance.',
    destination: 'thekkady', operatorId: OP.greenleaf, categories: ['family', 'weekend'], tripType: 'private',
    days: 2, nights: 1, price: 5499, group: [2, 6], vehicle: 'suv',
    transport: 'Private SUV from Kochi or Kottayam.', accommodation: 'Jungle-edge resort.',
    pickup: ['Kochi', 'Kottayam'], pickupDistricts: ['Ernakulam', 'Kottayam'],
    inclusions: ['Private SUV', '1 night stay', 'Breakfast & dinner', 'Spice plantation tour'],
    exclusions: ['Boat safari tickets', 'Lunch'],
    photos: ['wildlife', 'spices', 'forest'],
    itinerary: [
      ['Drive to Thekkady', 'Spice plantation walk, Kalaripayattu show.', ['Dinner'], 'Jungle resort'],
      ['Periyar safari', 'Morning lake safari, return drive.', ['Breakfast']],
    ],
    rating: 4.5, reviews: 52, bookings: 160, createdDaysAgo: 20,
  },
  {
    slug: 'fort-kochi-heritage-day',
    title: 'Fort Kochi Heritage & Food Walk',
    summary: 'Guided half-day walk through Mattancherry, Jew Town and Fort Kochi’s cafés.',
    description: 'A 6-hour guided walk and short drives covering Chinese fishing nets, St. Francis Church, Mattancherry Palace, the Paradesi Synagogue and spice warehouses, with tasting stops.',
    destination: 'fort-kochi', operatorId: OP.greenleaf, categories: ['one_day', 'couple', 'budget'], tripType: 'group',
    days: 1, nights: 0, price: 1199, group: [2, 12], vehicle: 'tempo_traveller',
    transport: 'Shared AC vehicle between stops.', accommodation: 'Not applicable.',
    pickup: ['Fort Kochi — Vasco da Gama Square', 'Ernakulam boat jetty'], pickupDistricts: ['Ernakulam'],
    inclusions: ['Licensed guide', 'Food tasting (5 stops)', 'Ferry ticket'],
    exclusions: ['Entry tickets', 'Shopping'], cancellation: DAY_TRIP_CANCELLATION,
    photos: ['fortKochi', 'spices'],
    itinerary: [['Heritage & flavours', '9:00 am start, fishing nets, churches, Mattancherry, Jew Town, café lunch, end 3:00 pm.', ['Tasting lunch']]],
    rating: 4.7, reviews: 133, bookings: 720, createdDaysAgo: 10,
  },
  {
    slug: 'kovalam-ponmudi-combo',
    title: 'Ponmudi Hills & Kovalam Beach Combo',
    summary: 'Morning in the clouds at Ponmudi, sunset at Kovalam — one easy day from Trivandrum.',
    description: 'Climb Ponmudi’s 22 hairpin bends to the tea-covered hilltop, stop at Golden Valley, then head to Kovalam’s Lighthouse Beach for sunset.',
    destination: 'ponmudi', also: ['kovalam'], operatorId: OP.coastline, categories: ['one_day', 'family', 'budget'], tripType: 'private',
    days: 1, nights: 0, price: 999, group: [2, 12], vehicle: 'tempo_traveller',
    transport: 'Private car or tempo traveller based on group size.', accommodation: 'Not applicable.',
    pickup: ['Thiruvananthapuram city', 'Thiruvananthapuram airport'], pickupDistricts: ['Thiruvananthapuram'],
    inclusions: ['Private vehicle', 'Fuel and tolls', 'Driver bata'],
    exclusions: ['Food', 'Entry tickets'], cancellation: DAY_TRIP_CANCELLATION,
    photos: ['mistyHills', 'lighthouse'],
    itinerary: [['Hills to beach', '7:00 am pickup, Ponmudi by 9:30, Golden Valley, lunch, Kovalam for sunset, drop by 8:00 pm.']],
    rating: 4.4, reviews: 40, bookings: 230, createdDaysAgo: 5,
  },
  {
    slug: 'bekal-kannur-theyyam-tour',
    title: 'Bekal & Kannur Theyyam Trail',
    summary: 'Bekal Fort, Valiyaparamba backwaters and a night Theyyam ritual with a local guide.',
    description: 'A North Malabar cultural journey timed with Theyyam season, combining Bekal Fort, a backwater kayak and Muzhappilangad drive-in beach.',
    destination: 'bekal', also: ['kannur'], operatorId: OP.malabar, categories: ['multi_day', 'couple', 'custom'], tripType: 'private',
    days: 4, nights: 3, price: 15499, group: [2, 6], vehicle: 'suv',
    transport: 'Private SUV from Kozhikode or Kannur airport.', accommodation: 'Beach resort and heritage homestay.',
    pickup: ['Kannur airport', 'Kozhikode railway station'], pickupDistricts: ['Kannur', 'Kozhikode', 'Kasaragod'],
    inclusions: ['Private SUV', '3 nights stay', 'Breakfast & dinner', 'Theyyam guide', 'Kayak session'],
    exclusions: ['Lunch', 'Entry tickets'],
    photos: ['beachCliff', 'palmBeach', 'backwaters'],
    itinerary: [
      ['Arrive Kannur', 'Pickup, St. Angelo Fort, Payyambalam beach.', ['Dinner'], 'Heritage homestay'],
      ['Theyyam night', 'Handloom village, night Theyyam with guide.', ['Breakfast', 'Dinner'], 'Heritage homestay'],
      ['Bekal', 'Bekal Fort, Valiyaparamba kayak.', ['Breakfast', 'Dinner'], 'Bekal beach resort'],
      ['Departure', 'Muzhappilangad beach drive, drop.', ['Breakfast']],
    ],
    rating: 4.8, reviews: 29, bookings: 70, createdDaysAgo: 60,
  },
  {
    slug: 'kumarakom-lake-luxury',
    title: 'Kumarakom Lake Resort Luxury Stay',
    summary: 'Two nights at a lakefront villa, bird sanctuary walk and sunset cruise.',
    description: 'Slow luxury on Vembanad: private pool villa, Kumarakom bird sanctuary at dawn, a sunset motor-boat cruise to Pathiramanal and an Ayurvedic spa session.',
    destination: 'kumarakom', operatorId: OP.greenleaf, categories: ['luxury', 'couple', 'honeymoon'], tripType: 'private',
    days: 3, nights: 2, price: 24999, group: [2, 3], vehicle: 'premium',
    transport: 'Chauffeured premium sedan from Kochi airport.', accommodation: 'Lakefront pool villa.',
    pickup: ['Kochi airport'], pickupDistricts: ['Ernakulam'],
    inclusions: ['Premium transfers', '2 nights villa', 'All meals', 'Sunset cruise', 'Spa session'],
    exclusions: ['Alcohol', 'Additional spa treatments'],
    photos: ['backwaters', 'canoe', 'houseboat'],
    itinerary: [
      ['Arrive', 'Airport pickup, villa check-in, lakeside dinner.', ['Lunch', 'Dinner'], 'Lakefront villa'],
      ['Birds & sunset', 'Bird sanctuary walk, spa, sunset cruise to Pathiramanal.', ['Breakfast', 'Lunch', 'Dinner'], 'Lakefront villa'],
      ['Departure', 'Leisure morning and transfer.', ['Breakfast']],
    ],
    rating: 4.9, reviews: 41, bookings: 85, createdDaysAgo: 150,
  },
  {
    slug: 'munroe-island-canoe-day',
    title: 'Munroe Island Sunrise Canoe',
    summary: 'Paddle village canals at sunrise and visit coir makers and prawn farms.',
    description: 'A gentle, eco-friendly morning in Kollam’s Munroe Island by country canoe with a local boatman, followed by a traditional breakfast at a village home.',
    destination: 'munroe-island', operatorId: OP.coastline, categories: ['one_day', 'family', 'budget'], tripType: 'group',
    days: 1, nights: 0, price: 899, group: [2, 10], vehicle: 'sedan',
    transport: 'Self-arrival or pickup from Kollam (add-on).', accommodation: 'Not applicable.',
    pickup: ['Munroe Island jetty', 'Kollam KSRTC (add-on)'], pickupDistricts: ['Kollam'],
    inclusions: ['Country canoe with boatman', 'Village breakfast', 'Coir-making demo'],
    exclusions: ['Transport to Munroe Island'], cancellation: DAY_TRIP_CANCELLATION,
    photos: ['canoe', 'backwaters'],
    itinerary: [['Sunrise canals', '6:30 am canoe, mangrove canals, breakfast, coir village, end 10:30 am.', ['Breakfast']]],
    rating: 4.6, reviews: 58, bookings: 260, createdDaysAgo: 2,
  },
  {
    slug: 'luxury-kerala-coach-tour',
    title: 'Luxury Coach Kerala Grand Tour',
    summary: 'A 6-day coach tour for large groups — Kochi, Munnar, Thekkady, Alleppey and Kovalam.',
    description: 'Built for corporate groups, associations and large families: Volvo multi-axle coach, 3-star+ hotels, a tour manager and all sightseeing.',
    destination: 'fort-kochi', also: ['munnar', 'thekkady', 'alleppey', 'kovalam'], operatorId: OP.coastline, categories: ['group', 'luxury', 'multi_day'], tripType: 'group',
    days: 6, nights: 5, price: 21999, group: [20, 41], vehicle: 'luxury_coach',
    transport: 'Volvo multi-axle luxury coach.', accommodation: '3-star and 4-star hotels, twin sharing.',
    pickup: ['Kochi airport', 'Ernakulam Junction'], drop: ['Thiruvananthapuram airport'], pickupDistricts: ['Ernakulam'],
    inclusions: ['Luxury coach', '5 nights stay', 'Breakfast & dinner', 'Tour manager', 'Shared houseboat cruise'],
    exclusions: ['Lunch', 'Entry tickets', 'Flights'],
    photos: ['teaHills', 'houseboat', 'lighthouse'],
    itinerary: [
      ['Kochi', 'Arrival and Fort Kochi tour.', ['Dinner'], 'Kochi'],
      ['Munnar', 'Drive to Munnar with stops.', ['Breakfast', 'Dinner'], 'Munnar'],
      ['Munnar', 'Full-day sightseeing.', ['Breakfast', 'Dinner'], 'Munnar'],
      ['Thekkady', 'Spice country and Periyar.', ['Breakfast', 'Dinner'], 'Thekkady'],
      ['Alleppey & Kovalam', 'Shared houseboat cruise, drive to Kovalam.', ['Breakfast', 'Lunch', 'Dinner'], 'Kovalam'],
      ['Departure', 'Padmanabhaswamy temple, drop at airport.', ['Breakfast']],
    ],
    rating: 4.5, reviews: 22, bookings: 48, createdDaysAgo: 1,
    dateOffsets: [18, 46, 74],
  },
];

const today = todayISO();

export const seedPackages: TravelPackage[] = seeds.map((s, i) => {
  const n = i + 1;
  const createdAt = new Date(Date.now() - s.createdDaysAgo * 86400000).toISOString();
  return {
    id: pkgId(n),
    slug: s.slug,
    title: s.title,
    summary: s.summary,
    description: s.description,
    destinationId: DEST[s.destination]!,
    additionalDestinationIds: (s.also ?? []).map((slug) => DEST[slug]!).filter(Boolean),
    operatorId: s.operatorId,
    categories: s.categories,
    tripType: s.tripType,
    durationDays: s.days,
    durationNights: s.nights,
    basePrice: s.price,
    discountPercent: s.discount ?? 0,
    minGroupSize: s.group[0],
    maxGroupSize: s.group[1],
    vehicleCategory: s.vehicle,
    transportDetails: s.transport,
    accommodation: s.accommodation,
    pickupPoints: s.pickup,
    dropPoints: s.drop ?? s.pickup,
    pickupDistricts: s.pickupDistricts,
    inclusions: s.inclusions,
    exclusions: s.exclusions,
    cancellationPolicy: s.cancellation ?? STANDARD_CANCELLATION,
    images: s.photos.map((p, j) => ({ id: childId('5', n, j + 1), url: photo(p), caption: null, sortOrder: j })),
    itinerary: s.itinerary.map(([title, description, meals, stay], j) => ({
      id: childId('6', n, j + 1),
      dayNumber: j + 1,
      title,
      description,
      meals: meals ?? [],
      stay: stay ?? null,
    })),
    availableDates: (s.dateOffsets ?? []).map((o) => addDays(today, o)),
    status: 'published',
    isFeatured: s.featured ?? false,
    isTrending: s.trending ?? false,
    rating: s.rating,
    reviewCount: s.reviews,
    bookingCount: s.bookings,
    createdAt: s.createdDaysAgo > 0 ? createdAt : DEMO_TIMESTAMP,
    updatedAt: createdAt,
  };
});

export const PKG = Object.fromEntries(seedPackages.map((p) => [p.slug, p.id])) as Record<string, string>;
