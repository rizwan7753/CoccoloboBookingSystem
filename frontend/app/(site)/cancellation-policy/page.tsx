import { settingsApi } from "@/lib/settingsApi";
import LegalPage, { LEGAL_CONTACT_EMAIL } from "@/components/site/LegalPage";

export const metadata = { title: "Cancellation & Refund Policy" };

export default async function CancellationPolicyPage() {
  const { name } = await settingsApi.getSettings();
  const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

  return (
    <LegalPage title="Cancellation & Refund Policy" current="/cancellation-policy">
      <p>
        We know plans change. This policy explains how to cancel a booking with {name} and what you&apos;ll get back. It applies to
        beach chairs and beach day packages, experiences and event tickets booked on this website.
      </p>

      <h2>Cancelling 48 hours or more before your booking</h2>
      <p>
        <strong>Full refund.</strong> If you cancel at least 48 hours before the start time of your booking, we will refund the full
        amount you paid.
      </p>

      <h2>Cancelling less than 48 hours before, or not showing up</h2>
      <p>
        <strong>No refund.</strong> Cancellations made less than 48 hours before the start time, and bookings where guests do not
        arrive, are not refunded — by then the places have been held for you and food and staff are being prepared.
      </p>

      <h2>Bookings with more than one item</h2>
      <p>
        If you booked several things in one order, the 48-hour rule applies to each item separately, based on that item&apos;s own date
        and start time.
      </p>

      <h2>How to cancel</h2>
      <p>
        Email {mail} with your name and booking code (it&apos;s in your confirmation email, and starts with &ldquo;COCO_&rdquo;). The
        time we receive your email is the time used for the 48-hour rule. We&apos;ll reply to confirm the cancellation.
      </p>

      <h2>Changing your booking</h2>
      <p>
        If you&apos;d rather move your booking than cancel it, contact us at least 48 hours before your booking and we&apos;ll do our best
        to move it to another date, subject to availability.
      </p>

      <h2>How refunds are paid</h2>
      <ul>
        <li>Card payments are refunded to the card you paid with. Depending on your bank, it can take 5–10 business days to appear.</li>
        <li>Bank transfer payments are refunded by bank transfer to the account you give us.</li>
      </ul>

      <h2>Unpaid bookings</h2>
      <p>
        A bank transfer booking that hasn&apos;t been paid yet can be cancelled at any time at no cost — just let us know so we can release
        the places for other guests.
      </p>

      <h2>If we cancel</h2>
      <p>
        If we have to cancel your booking — for example because of weather, safety or a closure — you will receive a full refund
        whatever the timing, or a new date if you prefer.
      </p>

      <h2>Table reservations</h2>
      <p>
        Coco Grill table reservations don&apos;t involve a payment, so there&apos;s nothing to refund — but if you can&apos;t make it, please
        let us know so we can offer the table to someone else.
      </p>

      <h2>Questions</h2>
      <p>Email {mail} and we&apos;ll be happy to help.</p>
    </LegalPage>
  );
}
