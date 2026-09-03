import Link from "next/link";
import { settingsApi } from "@/lib/settingsApi";
import MobileNav from "./MobileNav";

export default async function Header() {
  const { name } = await settingsApi.getSettings();

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
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}
