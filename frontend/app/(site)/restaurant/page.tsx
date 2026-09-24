import Link from "next/link";
import { restaurantApi } from "@/lib/restaurantApi";
import { mediaUrl } from "@/lib/media";
import ReservationForm from "@/components/site/ReservationForm";

export const revalidate = 60;

export const metadata = { title: "Restaurant" };

export default async function RestaurantPage() {
  const menus = await restaurantApi.listMenus().catch(() => []);

  return (
    <main className="site-body">
      <section className="relative overflow-hidden bg-gradient-to-br from-abyss via-deep to-abyss">
        <div className="wrap relative py-16 sm:py-20">
          <span className="animate-fade-in-up inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-widest text-shallow">
            Dine with us
          </span>
          <h1 className="animate-fade-in-up font-display mt-5 max-w-4xl text-4xl text-foam sm:text-5xl" style={{ animationDelay: "80ms" }}>
            Our Restaurant
          </h1>
          <p className="animate-fade-in-up mt-4 max-w-xl text-lg text-foam/85" style={{ animationDelay: "160ms" }}>
            Browse our menus, then reserve a table — no card required, we&apos;ll confirm your booking by phone or email.
          </p>
          <a href="#reserve" className="btn btn-light animate-fade-in-up mt-6 inline-block" style={{ animationDelay: "220ms" }}>
            Reserve a table
          </a>
        </div>
      </section>

      <section className="section wrap">
        {menus.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-rule py-16 text-center opacity-60">Menus coming soon.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {menus.map((menu, i) => (
              <Link
                key={menu.id}
                href={`/restaurant/${menu.slug}`}
                className="card animate-fade-in-up group block no-underline"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <div className="card-visual" style={{ aspectRatio: "16/9", background: "linear-gradient(160deg,var(--deep),var(--abyss))" }}>
                  {menu.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(menu.imageUrl) ?? undefined} alt={menu.title} loading="lazy" decoding="async" />
                  ) : (
                    <svg className="absolute bottom-2 right-3 z-[2] h-16 w-16 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
                      <path d="M8 2v6a2 2 0 0 0 2 2v12M8 2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2M16 2v20M16 2a4 4 0 0 1 4 4v4a2 2 0 0 1-2 2h-2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="card-body">
                  <h2 className="font-display text-lg group-hover:underline">{menu.title}</h2>
                  {menu.timings && (
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium opacity-60">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {menu.timings}
                    </p>
                  )}
                  <p className="line-clamp-2">{menu.description || menu.sections.map((s) => s.heading).join(" · ") || "Menu coming soon"}</p>
                  <div className="mt-auto border-t border-rule pt-3">
                    <span className="text-sm font-medium text-coral-ink">View menu →</span>
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
