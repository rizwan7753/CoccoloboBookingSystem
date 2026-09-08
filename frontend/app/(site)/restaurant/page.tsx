import Link from "next/link";
import { restaurantApi } from "@/lib/restaurantApi";
import { mediaUrl } from "@/lib/media";
import ReservationForm from "@/components/site/ReservationForm";

export const revalidate = 60;

export const metadata = { title: "Restaurant" };

export default async function RestaurantPage() {
  const menus = await restaurantApi.listMenus().catch(() => []);

  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 75% 30%, white 0, transparent 45%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <span className="animate-fade-in-up inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-widest text-rose-50">
            Dine with us
          </span>
          <h1
            className="animate-fade-in-up font-display mt-5 max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl"
            style={{ animationDelay: "80ms" }}
          >
            Our Restaurant
          </h1>
          <p className="animate-fade-in-up mt-4 max-w-xl text-lg text-rose-50/90" style={{ animationDelay: "160ms" }}>
            Browse our menus, then reserve a table — no card required, we&apos;ll confirm your booking by phone or email.
          </p>
          <a
            href="#reserve"
            className="animate-fade-in-up mt-6 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-stone-900 transition hover:bg-rose-50"
            style={{ animationDelay: "220ms" }}
          >
            Reserve a table
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {menus.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 py-16 text-center text-stone-400">
            Menus coming soon.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {menus.map((menu, i) => (
              <Link
                key={menu.id}
                href={`/restaurant/${menu.slug}`}
                className="animate-fade-in-up group block overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-200/60"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-amber-900 to-stone-800">
                  {menu.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(menu.imageUrl) ?? undefined}
                      alt={menu.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <svg className="absolute bottom-2 right-3 h-16 w-16 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
                      <path d="M8 2v6a2 2 0 0 0 2 2v12M8 2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2M16 2v20M16 2a4 4 0 0 1 4 4v4a2 2 0 0 1-2 2h-2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="font-display text-lg font-bold text-stone-900 group-hover:text-rose-800">{menu.title}</h2>
                  {menu.timings && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-stone-400">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {menu.timings}
                    </p>
                  )}
                  <p className="mt-2 line-clamp-2 text-sm text-stone-500">
                    {menu.description || menu.sections.map((s) => s.heading).join(" · ") || "Menu coming soon"}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                    <span className="text-sm font-medium text-rose-800">View menu →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-16">
          <ReservationForm menus={menus.map((m) => ({ slug: m.slug, title: m.title }))} />
        </div>
      </section>
    </main>
  );
}
