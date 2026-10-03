import { settingsApi } from "@/lib/settingsApi";
import LegalPage, { LEGAL_CONTACT_EMAIL } from "@/components/site/LegalPage";

export const metadata = { title: "Cookie Policy" };

export default async function CookiePolicyPage() {
  const { name } = await settingsApi.getSettings();
  const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

  return (
    <LegalPage title="Cookie Policy" current="/cookie-policy">
      <p>
        The {name} website keeps this simple: <strong>we do not use advertising or tracking cookies</strong>, and we don&apos;t use
        analytics that follow you around the web. This page explains the small amount of information that is stored in your browser
        to make the site work.
      </p>

      <h2>What we store in your browser</h2>
      <p>We use your browser&apos;s local storage (similar to a cookie, but it stays on your device) for:</p>
      <ul>
        <li>
          <strong>Your cart</strong> — the items you add to your cart, so they&apos;re still there if you refresh the page or come back
          later. It&apos;s cleared when you place your order.
        </li>
        <li>
          <strong>Closed announcements</strong> — if you close the announcement bar at the top of the page, we remember that so it
          stays closed.
        </li>
      </ul>
      <p>
        Staff who sign in to our booking admin area also have their login session stored this way. None of this information is used
        to track you or shared with anyone.
      </p>

      <h2>Payment providers</h2>
      <p>
        When you pay by card, the secure payment form is provided by our payment processor (Stripe or NMI). They may set their own
        strictly necessary cookies during checkout to process the payment safely and prevent fraud. These are covered by their own
        privacy policies.
      </p>

      <h2>Managing this</h2>
      <p>
        You can clear stored site data at any time in your browser settings. The site will still work, but your cart will be emptied
        and any announcement you closed will reappear.
      </p>

      <h2>Changes</h2>
      <p>If we ever add cookies that aren&apos;t strictly needed — for example, for analytics — we will update this page first.</p>

      <h2>Contact us</h2>
      <p>Questions? Email {mail}.</p>
    </LegalPage>
  );
}
