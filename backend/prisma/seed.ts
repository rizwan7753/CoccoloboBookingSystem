import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  const location = await prisma.location.upsert({
    where: { id: "carambola-main" },
    update: { name: "Cocolobo Beach Club" },
    create: {
      id: "carambola-main",
      name: "Cocolobo Beach Club",
      timezone: "America/St_Thomas",
      currency: "USD",
    },
  });

  // One demo user per role (spec §14) so RBAC can be exercised locally without
  // having to create accounts by hand. Same password for all — change before
  // anything beyond local dev.
  const demoPassword = await hashPassword("ChangeMe123!");
  const demoUsers = [
    { email: "admin@carambola.example", name: "Cocolobo Admin", role: "SUPER_ADMIN" as const },
    { email: "manager@carambola.example", name: "Location Manager", role: "LOCATION_MANAGER" as const },
    { email: "staff@carambola.example", name: "Booking Staff", role: "BOOKING_STAFF" as const },
    { email: "finance@carambola.example", name: "Finance User", role: "FINANCE" as const },
  ];

  for (const u of demoUsers) {
    await prisma.adminUser.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: { ...u, locationId: location.id, passwordHash: demoPassword },
    });
  }
  const admin = { email: demoUsers[0].email };

  // Real tour catalog from carambolabeachclub.com/our-tours/ (fetched 2026-08-28).
  // The two Cabana packages are priced as a flat rate for up to N guests, not
  // per-adult — they use pricingType: FLAT_RATE (priceAdult holds the flat
  // total; capacityDefault still caps the guest count via the normal slot
  // capacity check, same as every other excursion).
  const allDays = [0, 1, 2, 3, 4, 5, 6];
  const tours: {
    slug: string;
    title: string;
    description: string;
    included: string;
    excluded: string;
    durationMinutes: number;
    priceAdult: number;
    capacityDefault: number;
    time: string;
    pricingType?: "PER_GUEST" | "FLAT_RATE";
  }[] = [
    {
      slug: "day-pass",
      title: "Day Pass to Cocolobo Beach Club",
      description: "A full day of beach access at Cocolobo Beach Club — chair, umbrella, and all facility amenities included.",
      included: "Beach chair, umbrella, facility amenities, WiFi access, towel, welcome rum punch",
      excluded: "Food and drinks sold separately",
      durationMinutes: 360,
      priceAdult: 45,
      capacityDefault: 50,
      time: "10:00",
    },
    {
      slug: "foodie-and-beach",
      title: "Foodie & Beach",
      description:
        "Experience authentic Kittitian cuisine with tastings of local dishes like Goat Water, Cook Up, Saltfish & Dumpling, and Steamed Fish & Turn Corn, plus desserts and beverages. Includes a recipe card. Minimum 4, maximum 40 guests.",
      included: "Tasting portions of local dishes, chair, umbrella, facility amenities, WiFi access",
      excluded: "Food and drinks outside package sold separately",
      durationMinutes: 240,
      priceAdult: 75,
      capacityDefault: 40,
      time: "11:30",
    },
    {
      slug: "sushi-class-101-beach-break",
      title: "Sushi Class 101 Beach Break",
      description:
        "Learn sushi-making traditions guided by a sushi chef — create your own 8-piece roll, then enjoy 2 hours of beach time. Minimum 4, maximum 40 guests.",
      included: "Beach chair, umbrella, facility amenities, WiFi access, one glass of sake, one glass of house wine, one sushi roll",
      excluded: "Food and drinks sold separately",
      durationMinutes: 210,
      priceAdult: 75,
      capacityDefault: 40,
      time: "10:00",
    },
    {
      slug: "wine-tasting-and-beach",
      title: "Wine Tasting and Beach",
      description:
        "Sample wines from Opus Fine Wine & Spirits' portfolio while enjoying beachfront ambience. Minimum 4, maximum 40 guests.",
      included: "Beach chair, umbrella, facility amenities, WiFi access, 3 glasses of wine (red, white, rosé), hors d'oeuvres, cheese platter",
      excluded: "Food and drinks sold separately",
      durationMinutes: 210,
      priceAdult: 80,
      capacityDefault: 40,
      time: "11:30",
    },
    {
      slug: "carambola-vip-experience",
      title: "Cocolobo VIP Experience",
      description:
        "A luxury beach experience with a dedicated server attending to all your needs. Open bar: Johnnie Walker Black, Absolut Vodka, Beefeater Gin, Mount Gay Rum, local beers, red/white house wines, rum punch, sodas, juices, bottled water. Start time flexible. Minimum 6, maximum 80 guests.",
      included: "Open bar with premium liquor brands, chair, umbrella, facility amenities, WiFi access, dedicated server",
      excluded: "Food and drinks outside package sold separately",
      durationMinutes: 210,
      priceAdult: 100,
      capacityDefault: 80,
      time: "10:00",
    },
    {
      slug: "carambola-cabana",
      title: "Cocolobo Cabana",
      description:
        "A private shaded cabana with premium comfort for up to 4 guests, with a dedicated server and open bar. Flat rate for up to 4 persons.",
      included:
        "Day VIP passes for up to 4 persons, private shaded space, open bar (Johnnie Walker Black, Absolut Vodka, Beefeater Gin, Mount Gay Rum, local beers, house wines, rum punch, sodas, juices, bottled water), dedicated server",
      excluded: "Food and drinks outside package sold separately",
      durationMinutes: 360,
      priceAdult: 400,
      capacityDefault: 4,
      time: "10:00",
      pricingType: "FLAT_RATE",
    },
    {
      slug: "carambola-all-inclusive-cabana",
      title: "Cocolobo All Inclusive Cabana",
      description:
        "The full cabana experience for up to 4 guests, adding a lunch menu with enhanced offerings on top of the open bar and dedicated server. Flat rate for up to 4 persons.",
      included:
        "Day VIP passes for up to 4 persons, private shaded space, open bar, cabana lunch menu with enhanced offerings, dedicated server",
      excluded: "Food and drinks outside package sold separately",
      durationMinutes: 360,
      priceAdult: 560,
      capacityDefault: 4,
      time: "10:00",
      pricingType: "FLAT_RATE",
    },
  ];

  for (const t of tours) {
    await prisma.excursion.upsert({
      where: { slug: t.slug },
      update: {
        title: t.title,
        description: t.description,
        meetingPoint: "Cocolobo Beach Club",
        pricingType: t.pricingType ?? "PER_GUEST",
      },
      create: {
        locationId: location.id,
        title: t.title,
        slug: t.slug,
        description: t.description,
        included: t.included,
        excluded: t.excluded,
        durationMinutes: t.durationMinutes,
        meetingPoint: "Cocolobo Beach Club",
        images: [],
        pricingType: t.pricingType ?? "PER_GUEST",
        priceAdult: t.priceAdult,
        capacityDefault: t.capacityDefault,
        cutoffTime: "21:00",
        status: "ACTIVE",
        departureTimes: {
          create: [{ time: t.time, daysOfWeek: allDays }],
        },
      },
    });
  }
  const excursion = { title: `${tours.length} tours from carambolabeachclub.com` };

  const rentalItem = await prisma.rentalItem.upsert({
    where: { slug: "beach-chair" },
    update: { durationMinutes: 240 },
    create: {
      locationId: location.id,
      name: "Beach Chair",
      slug: "beach-chair",
      description: "Reserve a beach chair by the water — available same-day, no advance booking required.",
      durationMinutes: 240, // 4-hour session — time slots below are generated from this
      priceAdult: 15,
      priceChild: 0,
      status: "ACTIVE",
    },
  });

  // Two rows, 5 chairs each — a booking can take more than one chair from a
  // row's pool (up to however many remain that day). Replaces any older
  // one-spot-per-chair seed data from before spot quantities existed.
  await prisma.rentalBooking.deleteMany({ where: { rentalItemId: rentalItem.id } });
  await prisma.rentalSpot.deleteMany({ where: { rentalItemId: rentalItem.id } });
  for (const code of ["Row A", "Row B"]) {
    await prisma.rentalSpot.create({
      data: { rentalItemId: rentalItem.id, code, quantity: 5 },
    });
  }

  // Time slots generated from the item's durationMinutes across a 9am-5pm
  // operating window (same logic as the admin "generate slots" tool) — the
  // same physical chair can be booked separately in each (capacity resets
  // per slot, not shared across the whole day).
  await prisma.rentalTimeSlot.deleteMany({ where: { rentalItemId: rentalItem.id } });
  function formatTime12h(time: string): string {
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
  }
  function addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(":").map(Number);
    const total = h * 60 + m + minutes;
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }
  const OPERATING_START = 9 * 60; // 09:00
  const OPERATING_END = 17 * 60; // 17:00
  for (let cursor = OPERATING_START; cursor + rentalItem.durationMinutes <= OPERATING_END; cursor += rentalItem.durationMinutes) {
    const startTime = `${String(Math.floor(cursor / 60)).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`;
    const endTime = addMinutes(startTime, rentalItem.durationMinutes);
    await prisma.rentalTimeSlot.create({
      data: {
        rentalItemId: rentalItem.id,
        label: `${formatTime12h(startTime)} - ${formatTime12h(endTime)}`,
        startTime,
        endTime,
      },
    });
  }

  // Demo one-off event with two ticket tiers.
  const event = await prisma.event.upsert({
    where: { slug: "full-moon-beach-party" },
    update: { venue: "Cocolobo Beach Club main lawn" },
    create: {
      locationId: location.id,
      title: "Full Moon Beach Party",
      slug: "full-moon-beach-party",
      description:
        "A beachfront night of live music, fire dancers, and cocktails under the full moon. Limited tickets — advance purchase recommended, but sales stay open right up to the event.",
      eventDate: new Date("2026-09-26T00:00:00.000Z"),
      startTime: "19:00",
      endTime: "23:00",
      venue: "Cocolobo Beach Club main lawn",
      status: "ACTIVE",
    },
  });

  const tierDefs = [
    { name: "General Admission", description: "Entry, live music, beach access", price: 35, capacity: 150 },
    { name: "VIP", description: "Entry, reserved lounge seating, one welcome cocktail, early entry", price: 90, capacity: 30 },
  ];
  for (const t of tierDefs) {
    await prisma.eventTicketTier.upsert({
      where: { eventId_name: { eventId: event.id, name: t.name } },
      update: {},
      create: { eventId: event.id, ...t },
    });
  }

  console.log("Seeded:", {
    location: location.name,
    admin: admin.email,
    excursion: excursion.title,
    rental: rentalItem.name,
    event: event.title,
  });
  console.log("Demo logins (all password ChangeMe123!):");
  for (const u of demoUsers) console.log(`  ${u.role.padEnd(16)} -> ${u.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
