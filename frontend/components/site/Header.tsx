import Link from "next/link";
import { settingsApi } from "@/lib/settingsApi";
import { restaurantApi } from "@/lib/restaurantApi";
import MobileNav from "./MobileNav";

export default async function Header() {
  const [{ name }, menus] = await Promise.all([settingsApi.getSettings(), restaurantApi.listMenus().catch(() => [])]);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur print:hidden">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-teal-800">{name}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-stone-600 sm:flex">
          <Link href="/" className="transition hover:text-teal-700">
            Excursions
          </Link>
          <Link href="/beach-chairs" className="transition hover:text-teal-700">
            Beach Chairs
          </Link>
          <Link href="/events" className="transition hover:text-teal-700">
            Events
          </Link>
          <div className="group relative">
            <Link href="/restaurant" className="flex items-center gap-1 py-2 transition hover:text-teal-700">
              Restaurant
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div className="invisible absolute left-1/2 top-full w-56 -translate-x-1/2 pt-1 opacity-0 transition group-hover:visible group-hover:opacity-100">
              <div className="rounded-xl border border-stone-200 bg-white p-2 shadow-lg shadow-stone-200/60">
                {menus.map((m) => (
                  <Link
                    key={m.id}
                    href={`/restaurant/${m.slug}`}
                    className="block rounded-lg px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-50 hover:text-teal-700"
                  >
                    {m.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
        <MobileNav restaurantMenus={menus.map((m) => ({ title: m.title, slug: m.slug }))} />
      </div>
    </header>
  );
}
