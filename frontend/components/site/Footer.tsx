import Link from "next/link";
import { settingsApi } from "@/lib/settingsApi";
import { restaurantApi } from "@/lib/restaurantApi";
import { LEGAL_PAGES, LEGAL_CONTACT_EMAIL } from "./LegalPage";
import SocialIcons from "./SocialIcons";

// Mega-footer ported from coccolobo-beach-club.html. Data fetching (settings
// + restaurant menus for the "Eat" column) is unchanged from before.
export default async function Footer() {
  const [settings, menus] = await Promise.all([settingsApi.getSettings(), restaurantApi.listMenus().catch(() => [])]);
  const { name } = settings;
  const whatsappDigits = settings.whatsappNumber?.replace(/\D/g, "");

  return (
    <footer className="site-body bg-abyss pt-14 text-foam print:hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 max-w-3xl rounded-2xl border border-foam/20 px-6 py-5 text-[.96rem] opacity-90">
          <strong className="font-semibold">Advance bookings are recommended to avoid disappointment.</strong> Walk-ins are
          welcome subject to availability, but on busy days we recommend reserving your spot at {name} in advance.
        </div>

        {/* One row of five on desktop (brand, Book, Eat, Legal, Talk to us) —
            "Talk to us" gets extra width so the email address stays on one line. */}
        <div className="grid gap-x-8 gap-y-10 pb-12 sm:grid-cols-2 lg:[grid-template-columns:1.2fr_0.85fr_0.85fr_1.2fr_1.4fr]">
          <div>
            <h4 className="font-display mb-[.9rem] text-base font-bold">{name}</h4>
            <p className="mt-1.5 max-w-[26ch] text-[.94rem] opacity-80">
              Named for the sea grapes that hold the sand along this shore.
            </p>
            <SocialIcons settings={settings} />
          </div>

          <div>
            <h4 className="font-display mb-[.9rem] text-base font-bold">Book</h4>
            <ul className="flex flex-col text-[.94rem]">
              <li className="py-[.22rem]">
                <Link href="/excursions" className="opacity-80 transition hover:opacity-100 hover:underline hover:underline-offset-4">
                  Excursions
                </Link>
              </li>
              <li className="py-[.22rem]">
                <Link href="/beach-chairs" className="opacity-80 transition hover:opacity-100 hover:underline hover:underline-offset-4">
                  Beach chairs
                </Link>
              </li>
              <li className="py-[.22rem]">
                <Link href="/events" className="opacity-80 transition hover:opacity-100 hover:underline hover:underline-offset-4">
                  Events
                </Link>
              </li>
              <li className="py-[.22rem]">
                <Link href="/find-booking" className="opacity-80 transition hover:opacity-100 hover:underline hover:underline-offset-4">
                  Find my booking
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display mb-[.9rem] text-base font-bold">Eat</h4>
            <ul className="flex flex-col text-[.94rem]">
              {menus.length === 0 ? (
                <li className="py-[.22rem]">
                  <Link href="/coco-grill" className="opacity-80 transition hover:opacity-100 hover:underline hover:underline-offset-4">
                    Coco Grill
                  </Link>
                </li>
              ) : (
                menus.map((m) => (
                  <li key={m.id} className="py-[.22rem]">
                    <Link
                      href={`/coco-grill/${m.slug}`}
                      className="opacity-80 transition hover:opacity-100 hover:underline hover:underline-offset-4"
                    >
                      {m.title}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          <nav aria-label="Legal">
            <h4 className="font-display mb-[.9rem] text-base font-bold">Legal</h4>
            <ul className="flex flex-col text-[.94rem]">
              {LEGAL_PAGES.map((page) => (
                <li key={page.href} className="py-[.22rem]">
                  <Link href={page.href} className="opacity-80 transition hover:opacity-100 hover:underline hover:underline-offset-4">
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h4 className="font-display mb-[.9rem] text-base font-bold">Talk to us</h4>
            <ul className="flex flex-col text-[.94rem]">
              <li className="py-[.22rem]">
                <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="opacity-80 transition hover:opacity-100 hover:underline hover:underline-offset-4">
                  {LEGAL_CONTACT_EMAIL}
                </a>
              </li>
              {whatsappDigits && (
                <li className="py-[.22rem]">
                  <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className="opacity-80 transition hover:opacity-100 hover:underline hover:underline-offset-4">
                    WhatsApp {settings.whatsappNumber}
                  </a>
                </li>
              )}
              <li className="py-[.22rem]">
                <Link href="/find-booking" className="opacity-80 transition hover:opacity-100 hover:underline hover:underline-offset-4">
                  Find my booking
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-foam/[.18] py-6 text-[.85rem] opacity-60">
          © {new Date().getFullYear()} {name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
