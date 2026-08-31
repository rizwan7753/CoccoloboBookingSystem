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
  await cachedTransport.transporter.sendMail({ from, to: message.to, subject: message.subject, text: message.text });
  // eslint-disable-next-line no-console
  console.log(`[email] Sent via SMTP to ${message.to}`);
}

export async function sendBookingConfirmationEmail(booking: Booking, excursion: Excursion) {
  await sendEmail({
    to: booking.guestEmail,
    subject: `Booking confirmed: ${excursion.title}`,
    text: [
      `Hi ${booking.guestName},`,
      ``,
      `Your booking for "${excursion.title}" is confirmed.`,
      `Guests: ${booking.totalGuests} (Adults: ${booking.adultCount}, Children: ${booking.childCount})`,
      `Total paid: $${booking.amountTotal}`,
      excursion.meetingPoint ? `Meeting point: ${excursion.meetingPoint}` : "",
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
      `Your reservation for "${item.name}" — ${spot.code} — is confirmed for ${booking.date.toISOString().slice(0, 10)}, ${timeSlot.label} (${timeSlot.startTime}-${timeSlot.endTime}).`,
      `Guests: ${booking.adultCount + booking.childCount} (Adults: ${booking.adultCount}, Children: ${booking.childCount})`,
      `Total paid: $${booking.amountTotal}`,
      `Booking reference: ${booking.id}`,
    ].join("\n"),
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
      `Total paid: $${booking.amountTotal}`,
      `Booking reference: ${booking.id}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
