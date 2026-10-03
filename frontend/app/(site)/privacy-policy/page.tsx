import Link from "next/link";
import { settingsApi } from "@/lib/settingsApi";
import LegalPage, { LEGAL_CONTACT_EMAIL } from "@/components/site/LegalPage";

export const metadata = { title: "Privacy Policy" };

export default async function PrivacyPolicyPage() {
  const { name } = await settingsApi.getSettings();
  const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

  return (
    <LegalPage title="Privacy Policy" current="/privacy-policy">
      <p>
        This policy explains what personal information {name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;), located on South Friars Bay, St.
        Kitts, collects when you use this website, why we collect it, and the choices you have. We only collect what we need to take
        and manage your bookings.
      </p>

      <h2>Information we collect</h2>
      <h3>When you make a booking or reservation</h3>
      <ul>
        <li>Your name and email address</li>
        <li>Your phone number and room or villa number, if you choose to give them</li>
        <li>
          The details of your booking — what you booked, the date and time, the number of adults and children or tickets, and any
          special requests you add
        </li>
        <li>The payment method you chose and the status of your payment</li>
      </ul>
      <h3>When you leave a review</h3>
      <ul>
        <li>The name you enter, your rating and review text, and your email address if you provide one</li>
      </ul>
      <h3>Payment card details</h3>
      <p>
        Card payments are handled directly by our payment processors (Stripe and NMI). Your card number is entered into their secure
        payment forms and sent to them — it is never stored on our servers. If you choose to pay by bank transfer, we receive the
        payment receipt you email to us.
      </p>

      <h2>How we use your information</h2>
      <ul>
        <li>To take, confirm and manage your bookings, orders and table reservations</li>
        <li>To send you booking confirmations, payment instructions and updates about your booking</li>
        <li>To let our team prepare for your visit and contact you about it if needed</li>
        <li>To process payments and refunds</li>
        <li>To review and, if approved, publish reviews you submit (your email address is never shown publicly)</li>
        <li>To keep accounting and business records we are required to keep</li>
      </ul>
      <p>We do not sell your personal information, and we do not use it for advertising.</p>

      <h2>Who we share it with</h2>
      <p>We share your information only with service providers who help us run the booking system, and only as far as needed:</p>
      <ul>
        <li>Payment processors (Stripe and NMI), to take card payments and issue refunds</li>
        <li>Our email provider, to send booking emails</li>
        <li>Our website hosting provider, which stores the booking system and its data</li>
      </ul>
      <p>We may also disclose information where the law requires it.</p>

      <h2>How long we keep it</h2>
      <p>
        We keep booking information for as long as needed to provide your booking and afterwards for as long as we are required to
        for accounting, tax and legal purposes. Reviews stay published until they are removed.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask us for a copy of the personal information we hold about you, ask us to correct it, or ask us to delete it where
        we are not required to keep it. To make a request, email {mail}. We will respond as required by applicable data protection
        laws, including those of St. Kitts and Nevis.
      </p>

      <h2>Cookies and browser storage</h2>
      <p>
        We do not use advertising or tracking cookies. See our <Link href="/cookie-policy">Cookie Policy</Link> for the small amount
        of information stored in your browser to make the site work.
      </p>

      <h2>Security</h2>
      <p>
        The site is served over an encrypted (HTTPS) connection, card details are handled only by our payment processors, and access
        to booking information is limited to authorised staff accounts.
      </p>

      <h2>Changes to this policy</h2>
      <p>If we change this policy we will update it on this page and change the &ldquo;last updated&rdquo; date above.</p>

      <h2>Contact us</h2>
      <p>
        Questions about your privacy? Email {mail}.
      </p>
    </LegalPage>
  );
}
