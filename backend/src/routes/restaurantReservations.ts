import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { parseDateOnly } from "../lib/dateOnly";
import { nextBookingCode } from "../lib/bookingCode";
import { sendRestaurantReservationAcknowledgement, sendRestaurantReservationNotification } from "../services/emailService";

const router = Router();

const createReservationSchema = z.object({
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  partySize: z.number().int().min(1),
  date: z.string(),
  time: z.string(),
  specialRequests: z.string().optional(),
});

// POST /api/restaurant-reservations — a plain enquiry: no payment, no
// capacity check, no live table count. Staff follow up manually to confirm.
router.post("/", async (req, res) => {
  const parsed = createReservationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const location = await prisma.location.findFirst();
  if (!location) return res.status(500).json({ error: "No location configured" });

  const date = parseDateOnly(parsed.data.date);
  const reservation = await prisma.$transaction(async (tx) => {
    const bookingCode = await nextBookingCode(tx, "RES", date);
    return tx.restaurantReservation.create({
      data: {
        locationId: location.id,
        bookingCode,
        guestName: parsed.data.guestName,
        guestEmail: parsed.data.guestEmail,
        guestPhone: parsed.data.guestPhone,
        partySize: parsed.data.partySize,
        date,
        time: parsed.data.time,
        specialRequests: parsed.data.specialRequests,
      },
    });
  });

  await Promise.all([
    sendRestaurantReservationAcknowledgement(reservation),
    sendRestaurantReservationNotification(reservation),
  ]);

  res.status(201).json({ id: reservation.id, bookingCode: reservation.bookingCode });
});

export default router;
