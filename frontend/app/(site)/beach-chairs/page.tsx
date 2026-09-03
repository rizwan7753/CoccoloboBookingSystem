import Link from "next/link";
import { rentalApi } from "@/lib/rentalApi";
import { mediaUrl } from "@/lib/media";

export const revalidate = 60;

export const metadata = { title: "Beach Chairs" };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function BeachChairsPage() {
  const items = await rentalApi.listRentals().catch(() => []);
  const today = todayISO();
  // The list endpoint doesn't include time slots — fetch each item's detail
  // to find its first slot, then get availability scoped to that slot.
  const detailsByItem = await Promise.all(items.map((item) => rentalApi.getRental(item.slug).catch(() => null)));
  const availabilityByItem = await Promise.all(
    items.map((item, i) => {
      const firstSlot = detailsByItem[i]?.timeSlots?.[0];
      return firstSlot ? rentalApi.getAvailability(item.id, today, firstSlot.id).catch(() => null) : null;
    })
  );

  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-orange-500 to-amber-500">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 75% 30%, white 0, transparent 45%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <span className="animate-fade-in-up inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-widest text-amber-50">
            Same-day booking available
          </span>
          <h1
            className="animate-fade-in-up font-display mt-5 max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl"
            style={{ animationDelay: "80ms" }}
          >
            Beach chairs &amp; loungers
          </h1>
          <p className="animate-fade-in-up mt-4 max-w-xl text-lg text-amber-50/90" style={{ animationDelay: "160ms" }}>
            Reserve your exact spot by the water — no advance booking required, book for today or plan ahead.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 py-16 text-center text-stone-400">
            No rentals available right now. Check back soon.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => {
              const availability = availabilityByItem[i];
              return (
                <Link
                  key={item.id}
                  href={`/beach-chairs/${item.slug}`}
                  className="animate-fade-in-up group block overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-200/60"
                  style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                >
                  <div className="relative h-32 overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500">
                    {item.cardImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(item.cardImageUrl) ?? undefined}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <svg className="absolute bottom-2 right-3 h-16 w-16 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
                        <path d="M4 20 12 4l8 16M8 12h8M6 16h12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {availability && (
                      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-700">
                        {availability.remainingChairs} of {availability.totalChairs} left today
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-lg font-bold text-stone-900 group-hover:text-amber-700">{item.name}</h2>
                      <span className="whitespace-nowrap text-xs font-medium text-stone-400">
                        {Math.round(item.durationMinutes / 60)}h session
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-stone-500">{item.description}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                      <span className="text-sm font-semibold text-stone-900">
                        ${item.priceAdult} <span className="font-normal text-stone-400">/ adult</span>
                      </span>
                      <span className="text-sm font-medium text-amber-700">Reserve a spot →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
