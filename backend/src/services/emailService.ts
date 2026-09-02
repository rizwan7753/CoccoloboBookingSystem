import nodemailer from "nodemailer";
import {
  Booking,
  Excursion,
  RentalBooking,
  RentalItem,
  RentalSpot,
  RentalTimeSlot,
  Event,
  EventBooking,
  EventTicketTier,
} from "@prisma/client";
import { prisma } from "../lib/prisma";

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

// Reused across requests — avoids reconnecting for every email. Rebuilt
// automatically if the admin changes SMTP settings (see invalidateTransport).
let cachedTransport: { host: string; port: number; transporter: nodemailer.Transporter } | null = null;

/** Call after admin/settings updates SMTP config so the next send picks up the change. */
export function invalidateEmailTransport() {
  cachedTransport = null;
}

/**
 * Sends via the SMTP settings configured in the admin Settings page
 * (Location.smtp*). Falls back to logging the message to the console when
 * SMTP hasn't been configured yet, so notifications never hard-fail —
 * they're just visibly stubbed until an admin sets it up.
 */
export async function sendEmail(message: EmailMessage) {
  const location = await prisma.location.findFirst();
  const { smtpHost, smtpPort, smtpUsername, smtpPassword, smtpFromEmail, smtpFromName, smtpSecure } = location ?? {};

  if (!smtpHost || !smtpPort || !smtpFromEmail) {
    // eslint-disable-next-line no-console
    console.log("[email:stub] SMTP not configured (see Admin > Settings). Would send:\n", message);
    return;
  }

  if (!cachedTransport || cachedTransport.host !== smtpHost || cachedTransport.port !== smtpPort) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: smtpUsername ? { user: smtpUsername, pass: smtpPassword ?? undefined } : undefined,
    });
    cachedTransport = { host: smtpHost, port: smtpPort, transporter };
  }

  const from = smtpFromName ? `"${smtpFromName}" <${smtpFromEmail}>` : smtpFromEmail;
  try {
    await cachedTransport.transporter.sendMail({ from, to: message.to, subject: message.subject, text: message.text });
    // eslint-disable-next-line no-console
    console.log(`[email] Sent via SMTP to ${message.to}`);
  } catch (err) {
    // A delivery failure (bounce, bad address, SMTP hiccup) must never fail
    // the caller — by the time this runs, the booking/payment state it's
    // reporting on has already been correctly persisted. Log and move on.
    // eslint-disable-next-line no-console
    console.error(`[email] Failed to send to ${message.to}:`, err);
  }
}

function formatPaymentMethod(method?: string | null): string {
  return method === "offline" ? "Bank transfer / offline payment" : "Card (Stripe)";
}

export async function sendBookingConfirmationEmail(booking: Booking, excursion: Excursion) {
  const slot = await prisma.departureSlot.findUnique({ where: { id: booking.slotId } });
  await sendEmail({
    to: booking.guestEmail,
    subject: `Booking confirmed: ${excursion.title}`,
    text: [
      `Hi ${booking.guestName},`,
      ``,
      `Your booking for "${excursion.title}" is confirmed.`,
      slot ? `Date & time: ${slot.date.toISOString().slice(0, 10)} at ${slot.time}` : "",
      `Guests: ${booking.totalGuests} (Adults: ${booking.adultCount}, Children: ${booking.childCount})`,
      booking.roomNumber ? `Room/Villa: ${booking.roomNumber}` : "",
      `Payment method: ${formatPaymentMethod(booking.paymentMethod)}`,
      `Total paid: $${booking.amountTotal}`,
      excursion.meetingPoint ? `Meeting point: ${excursion.meetingPoint}` : "",
      excursion.whatToBring ? `What to bring: ${excursion.whatToBring}` : "",
      `Booking reference: ${booking.id}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function sendRentalBookingConfirmationEmail(
  booking: RentalBooking,
  item: RentalItem,
  spot: RentalSpot,
  timeSlot: RentalTimeSlot
) {
  await sendEmail({
    to: booking.guestEmail,
    subject: `Booking confirmed: ${item.name} (${spot.code})`,
    text: [
      `Hi ${booking.guestName},`,
      ``,
      `Your reservation for "${item.name}" — ${spot.code} — is confirmed.`,
      `Date: ${booking.date.toISOString().slice(0, 10)}`,
      `Time slot: ${timeSlot.label} (${timeSlot.startTime}-${timeSlot.endTime})`,
      `Spot: ${spot.code}`,
      `Guests: ${booking.adultCount + booking.childCount} (Adults: ${booking.adultCount}, Children: ${booking.childCount})`,
      `Chairs reserved: ${booking.quantity}`,
      booking.roomNumber ? `Room/Villa: ${booking.roomNumber}` : "",
      `Payment method: ${formatPaymentMethod(booking.paymentMethod)}`,
      `Total paid: $${booking.amountTotal}`,
      `Booking reference: ${booking.id}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

/** Sent instead of a confirmation email when a guest chooses offline payment
 *  (bank deposit/transfer) — the booking stays PENDING until staff manually
 *  marks it paid, so this sets expectations rather than confirming anything.
 *  `details` carries the booking-type-specific lines (departure date/time for
 *  an excursion; date/spot/time-slot for a rental; event date/tier for an
 *  event) so this one function stays reusable across all three flows. */
export async function sendOfflinePaymentPendingEmail(params: {
  guestEmail: string;
  guestName: string;
  title: string;
  amountTotal: string | number | { toString(): string };
  bookingId: string;
  details?: string[];
  instructions?: string | null;
  receiptEmail?: string | null;
}) {
  await sendEmail({
    to: params.guestEmail,
    subject: `Booking received: ${params.title}`,
    text: [
      `Hi ${params.guestName},`,
      ``,
      `We've received your booking for "${params.title}" — it's held for you, but not yet confirmed.`,
      ...(params.details ?? []),
      `Amount due: $${params.amountTotal}`,
      `Payment method: ${formatPaymentMethod("offline")}`,
      `Booking reference: ${params.bookingId}`,
      ``,
      params.instructions ? `Pay to the below details:\n${params.instructions}` : "",
      params.receiptEmail
        ? `\nOnce paid, please send your payment receipt — referencing booking ID ${params.bookingId} — to ${params.receiptEmail}.`
        : "",
      ``,
      `We'll confirm your booking by email as soon as payment is verified.`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function sendEventBookingConfirmationEmail(booking: EventBooking, event: Event, tier: EventTicketTier) {
  await sendEmail({
    to: booking.guestEmail,
    subject: `Tickets confirmed: ${event.title}`,
    text: [
      `Hi ${booking.guestName},`,
      ``,
      `Your tickets for "${event.title}" are confirmed.`,
      `${booking.quantity} x ${tier.name} - ${event.eventDate.toISOString().slice(0, 10)} at ${event.startTime}`,
      event.venue ? `Venue: ${event.venue}` : "",
      booking.roomNumber ? `Room/Villa: ${booking.roomNumber}` : "",
      `Payment method: ${formatPaymentMethod(booking.paymentMethod)}`,
      `Total paid: $${booking.amountTotal}`,
      `Booking reference: ${booking.id}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
