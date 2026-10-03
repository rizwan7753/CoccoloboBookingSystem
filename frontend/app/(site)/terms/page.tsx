import Link from "next/link";
import { settingsApi } from "@/lib/settingsApi";
import LegalPage, { LEGAL_CONTACT_EMAIL } from "@/components/site/LegalPage";

export const metadata = { title: "Terms & Conditions" };

export default async function TermsPage() {
  const { name } = await settingsApi.getSettings();
  const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

  return (
    <LegalPage title="Terms & Conditions" current="/terms">
      <p>
        These terms apply to bookings made through this website with {name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;), South Friars Bay,
        St. Kitts, including beach chairs and beach day packages, experiences, event tickets and table reservations. By making a
        booking you agree to them.
      </p>

      <h2>Making a booking</h2>
      <ul>
        <li>
          A booking is confirmed once payment is complete (or, for bank transfer, once we receive your payment) and we have sent you a
          confirmation email with your booking code. Keep this code — you can look up your booking any time on{" "}
          <Link href="/find-booking">Find my booking</Link>.
        </li>
        <li>Online booking for experiences closes at 9:00 PM the evening before the booking date.</li>
        <li>Some experiences have a minimum and maximum group size, shown on their page; bookings outside those limits can&apos;t be accepted.</li>
        <li>Beach chair and beach day bookings are for the session time shown and reserve a place in the area you choose.</li>
        <li>
          Table reservations at Coco Grill are requests — we confirm them by phone or email, and no payment is taken when you
          request one.
        </li>
        <li>Walk-in guests are welcome subject to availability, but we can only guarantee a place for advance bookings.</li>
        <li>Please make sure the details you give us (especially your email address) are correct, so we can reach you about your booking.</li>
      </ul>

      <h2>Prices and payment</h2>
      <ul>
        <li>Prices are shown in US dollars. The price that applies is the one shown when you book.</li>
        <li>You can pay by card through our secure payment providers or, where offered, by bank transfer.</li>
        <li>
          Bank transfer bookings are held as pending until we receive your payment. Please send your receipt, quoting your booking
          code, as described in your booking email.
        </li>
        <li>If a card payment is not completed, the places held for your booking may be released after a short time.</li>
      </ul>

      <h2>Cancellations and refunds</h2>
      <p>
        Cancelling, changes and refunds are covered by our <Link href="/cancellation-policy">Cancellation &amp; Refund Policy</Link>,
        which forms part of these terms.
      </p>

      <h2>If we have to cancel</h2>
      <p>
        We may need to close or cancel a booking because of weather, safety concerns, public holidays or other circumstances outside
        our control. If we cancel your booking, we will offer you a full refund or, if you prefer, a new date.
      </p>

      <h2>During your visit</h2>
      <ul>
        <li>Please follow the instructions of our team and any posted safety signs.</li>
        <li>Swimming and water activities are at your own risk.</li>
        <li>Children must be supervised by a responsible adult at all times.</li>
        <li>Alcohol is served only to guests of legal drinking age, and we may refuse service at our discretion.</li>
        <li>Please look after your belongings; we are not responsible for lost or stolen items except where caused by our negligence.</li>
        <li>We may ask anyone whose behaviour puts others at risk or disturbs other guests to leave, without a refund.</li>
      </ul>

      <h2>Reviews</h2>
      <p>
        If you submit a review, you allow us to publish it on this website. Reviews are checked before they appear, and we may decline
        reviews that are offensive, unrelated to your visit or otherwise inappropriate.
      </p>

      <h2>Our liability</h2>
      <p>
        To the extent permitted by law, our liability to you in connection with a booking is limited to the amount you paid for it.
        Nothing in these terms limits any liability that cannot be limited by law.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of St. Kitts and Nevis.</p>

      <h2>Contact us</h2>
      <p>Questions about these terms or your booking? Email {mail}.</p>
    </LegalPage>
  );
}
