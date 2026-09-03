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
  html?: string;
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
    await cachedTransport.transporter.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
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
  if (method === "offline") return "Bank transfer / offline payment";
  if (method === "nmi") return "Card";
  return "Card (Stripe)";
}

async function getLocationName(): Promise<string> {
  const location = await prisma.location.findFirst();
  return location?.name || "Your stay";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Row = { label: string; value: string };

/** Shared table-based HTML shell — inline styles throughout since email
 *  clients strip <style> blocks and ignore flex/grid. `accent` ties each
 *  booking type to the same color used for it on the site (teal for
 *  excursions, amber for beach chairs, fuchsia for events). */
function renderEmailShell(params: {
  accent: string;
  locationName: string;
  eyebrow: string;
  heading: string;
  intro: string;
  rows: Row[];
  extraHtml?: string;
  bookingId: string;
}): string {
  const rowsHtml = params.rows
    .map(
      (r) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;color:#a8a29e;font-size:13px;font-family:Helvetica,Arial,sans-serif;">${escapeHtml(r.label)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;color:#292524;font-size:13px;font-weight:600;font-family:Helvetica,Arial,sans-serif;text-align:right;">${escapeHtml(r.value)}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4;">
            <tr>
              <td style="background:${params.accent};padding:28px 32px;">
                <p style="margin:0;color:rgba(255,255,255,0.85);font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">${escapeHtml(params.locationName)}</p>
                <p style="margin:2px 0 0;color:rgba(255,255,255,0.7);font-size:11px;font-family:Helvetica,Arial,sans-serif;">${escapeHtml(params.eyebrow)}</p>
                <h1 style="margin:10px 0 0;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;">${escapeHtml(params.heading)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px;">
                <p style="margin:0 0 20px;color:#44403c;font-size:15px;line-height:1.6;font-family:Helvetica,Arial,sans-serif;">${params.intro}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  ${rowsHtml}
                </table>
                ${params.extraHtml ?? ""}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px;">
                <p style="margin:0;color:#a8a29e;font-size:12px;font-family:Helvetica,Arial,sans-serif;">Booking reference: ${escapeHtml(params.bookingId)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendBookingConfirmationEmail(booking: Booking, excursion: Excursion) {
  const [slot, locationName] = await Promise.all([
    prisma.departureSlot.findUnique({ where: { id: booking.slotId } }),
    getLocationName(),
  ]);
  const dateTime = slot ? `${slot.date.toISOString().slice(0, 10)} at ${slot.time}` : undefined;
  const refCode = booking.bookingCode ?? booking.id;

  const rows: Row[] = [
    ...(dateTime ? [{ label: "Date & time", value: dateTime }] : []),
    { label: "Guests", value: `${booking.totalGuests} (${booking.adultCount} adult, ${booking.childCount} child)` },
    ...(booking.roomNumber ? [{ label: "Room/Villa", value: booking.roomNumber }] : []),
    { label: "Payment method", value: formatPaymentMethod(booking.paymentMethod) },
    { label: "Total paid", value: `$${booking.amountTotal}` },
  ];
  const extras = [
    excursion.meetingPoint ? `Meeting point: ${excursion.meetingPoint}` : "",
    excursion.whatToBring ? `What to bring: ${excursion.whatToBring}` : "",
  ].filter(Boolean);

  await sendEmail({
    to: booking.guestEmail,
    subject: `Booking confirmed: ${excursion.title}`,
    text: [
      `Hi ${booking.guestName},`,
      ``,
      `Your booking for "${excursion.title}" is confirmed.`,
      ...rows.map((r) => `${r.label}: ${r.value}`),
      ...extras,
      `Booking reference: ${refCode}`,
    ]
      .filter(Boolean)
      .join("\n"),
    html: renderEmailShell({
      accent: "#0f766e",
      locationName,
      eyebrow: "Booking confirmed",
      heading: excursion.title,
      intro: `Hi ${escapeHtml(booking.guestName)}, your booking is confirmed — see the details below. A great time on the water awaits!`,
      rows,
      bookingId: refCode,
      extraHtml:
        extras.length > 0
          ? `<div style="margin-top:20px;padding:16px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;">
              ${extras
                .map((e) => `<p style="margin:0 0 4px;color:#134e4a;font-size:13px;line-height:1.6;font-family:Helvetica,Arial,sans-serif;">${escapeHtml(e)}</p>`)
                .join("")}
            </div>`
          : undefined,
    }),
  });
}

export async function sendRentalBookingConfirmationEmail(
  booking: RentalBooking,
  item: RentalItem,
  spot: RentalSpot,
  timeSlot: RentalTimeSlot
) {
  const locationName = await getLocationName();
  const refCode = booking.bookingCode ?? booking.id;
  const rows: Row[] = [
    { label: "Date", value: booking.date.toISOString().slice(0, 10) },
    { label: "Time slot", value: `${timeSlot.label} (${timeSlot.startTime}-${timeSlot.endTime})` },
    { label: "Spot", value: spot.code },
    { label: "Guests", value: `${booking.adultCount + booking.childCount} (${booking.adultCount} adult, ${booking.childCount} child)` },
    { label: "Chairs reserved", value: String(booking.quantity) },
    ...(booking.roomNumber ? [{ label: "Room/Villa", value: booking.roomNumber }] : []),
    { label: "Payment method", value: formatPaymentMethod(booking.paymentMethod) },
    { label: "Total paid", value: `$${booking.amountTotal}` },
  ];

  await sendEmail({
    to: booking.guestEmail,
    subject: `Booking confirmed: ${item.name} (${spot.code})`,
    text: [
      `Hi ${booking.guestName},`,
      ``,
      `Your reservation for "${item.name}" — ${spot.code} — is confirmed.`,
      ...rows.map((r) => `${r.label}: ${r.value}`),
      `Booking reference: ${refCode}`,
    ]
      .filter(Boolean)
      .join("\n"),
    html: renderEmailShell({
      accent: "#d97706",
      locationName,
      eyebrow: "Booking confirmed",
      heading: item.name,
      intro: `Hi ${escapeHtml(booking.guestName)}, your spot is reserved — see you by the water!`,
      rows,
      bookingId: refCode,
    }),
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
  const locationName = await getLocationName();
  const rows: Row[] = [
    ...(params.details ?? []).map((d) => {
      const [label, ...rest] = d.split(":");
      return rest.length > 0 ? { label: label.trim(), value: rest.join(":").trim() } : { label: "Detail", value: d };
    }),
    { label: "Amount due", value: `$${params.amountTotal}` },
    { label: "Payment method", value: formatPaymentMethod("offline") },
  ];

  const instructionsHtml = params.instructions
    ? `<div style="margin-top:20px;padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
        <p style="margin:0 0 6px;color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;font-family:Helvetica,Arial,sans-serif;">Payment instructions</p>
        <p style="margin:0;white-space:pre-line;color:#78350f;font-size:13px;line-height:1.6;font-family:Helvetica,Arial,sans-serif;">${escapeHtml(params.instructions)}</p>
      </div>`
    : "";
  const receiptHtml = params.receiptEmail
    ? `<p style="margin:14px 0 0;color:#44403c;font-size:13px;line-height:1.6;font-family:Helvetica,Arial,sans-serif;">
        Once paid, send your receipt — referencing booking ID <strong>${escapeHtml(params.bookingId)}</strong> — to
        <a href="mailto:${escapeHtml(params.receiptEmail)}" style="color:#d97706;font-weight:600;">${escapeHtml(params.receiptEmail)}</a>.
      </p>`
    : "";

  await sendEmail({
    to: params.guestEmail,
    subject: `Booking received: ${params.title}`,
    text: [
      `Hi ${params.guestName},`,
      ``,
      `We've received your booking for "${params.title}" — it's held for you, but not yet confirmed.`,
      ...rows.map((r) => `${r.label}: ${r.value}`),
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
    html: renderEmailShell({
      accent: "#78716c",
      locationName,
      eyebrow: "Booking received — pending payment",
      heading: params.title,
      intro: `Hi ${escapeHtml(params.guestName)}, we've held your spot. We'll confirm by email as soon as your payment is verified.`,
      rows,
      bookingId: params.bookingId,
      extraHtml: instructionsHtml + receiptHtml || undefined,
    }),
  });
}

export async function sendEventBookingConfirmationEmail(booking: EventBooking, event: Event, tier: EventTicketTier) {
  const locationName = await getLocationName();
  const refCode = booking.bookingCode ?? booking.id;
  const rows: Row[] = [
    { label: "Tickets", value: `${booking.quantity} x ${tier.name}` },
    { label: "Date & time", value: `${event.eventDate.toISOString().slice(0, 10)} at ${event.startTime}` },
    ...(event.venue ? [{ label: "Venue", value: event.venue }] : []),
    ...(booking.roomNumber ? [{ label: "Room/Villa", value: booking.roomNumber }] : []),
    { label: "Payment method", value: formatPaymentMethod(booking.paymentMethod) },
    { label: "Total paid", value: `$${booking.amountTotal}` },
  ];

  await sendEmail({
    to: booking.guestEmail,
    subject: `Tickets confirmed: ${event.title}`,
    text: [
      `Hi ${booking.guestName},`,
      ``,
      `Your tickets for "${event.title}" are confirmed.`,
      ...rows.map((r) => `${r.label}: ${r.value}`),
      `Booking reference: ${refCode}`,
    ]
      .filter(Boolean)
      .join("\n"),
    html: renderEmailShell({
      accent: "#a21caf",
      locationName,
      eyebrow: "Tickets confirmed",
      heading: event.title,
      intro: `Hi ${escapeHtml(booking.guestName)}, your tickets are confirmed — we'll see you there!`,
      rows,
      bookingId: refCode,
    }),
  });
}
