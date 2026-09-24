import Link from "next/link";
import { settingsApi } from "@/lib/settingsApi";
import { restaurantApi } from "@/lib/restaurantApi";

// Mega-footer ported from coccolobo-beach-club.html. Data fetching (settings
// + restaurant menus for the "Eat" column) is unchanged from before.
export default async function Footer() {
  const [{ name }, menus] = await Promise.all([settingsApi.getSettings(), restaurantApi.listMenus().catch(() => [])]);

  return (
    <footer className="site-body bg-abyss pt-14 text-foam print:hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 max-w-3xl rounded-2xl border border-foam/20 px-6 py-5 text-[.96rem] opacity-90">
          <strong className="font-semibold">Advance booking is required.</strong> Every excursion has a cut-off the
          evening before and walk-ins are not accepted. Beach chairs are the exception and can be reserved the same
          day.
        </div>

        <div className="grid gap-10 pb-12 [grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))]">
          <div>
            <h4 className="font-display mb-[.9rem] text-base font-bold">{name}</h4>
            <p className="mt-1.5 max-w-[26ch] text-[.94rem] opacity-80">
              Named for the sea grapes that hold the sand along this shore.
            </p>
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
                  <Link href="/restaurant" className="opacity-80 transition hover:opacity-100 hover:underline hover:underline-offset-4">
                    Restaurant
                  </Link>
                </li>
              ) : (
                menus.map((m) => (
                  <li key={m.id} className="py-[.22rem]">
                    <Link
                      href={`/restaurant/${m.slug}`}
                      className="opacity-80 transition hover:opacity-100 hover:underline hover:underline-offset-4"
                    >
                      {m.title}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-display mb-[.9rem] text-base font-bold">Talk to us</h4>
            <ul className="flex flex-col text-[.94rem]">
              <li className="py-[.22rem]">
                <Link href="/find-booking" className="opacity-80 transition hover:opacity-100 hover:underline hover:underline-offset-4">
                  Find my booking
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-x-8 gap-y-2 border-t border-foam/[.18] py-6 text-[.85rem] opacity-60">
          <span>
            © {new Date().getFullYear()} {name}. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
