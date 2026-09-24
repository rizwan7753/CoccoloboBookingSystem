import { rentalApi } from "@/lib/rentalApi";
import ChairCard from "@/components/site/ChairCard";
import ScrollReveal from "@/components/site/ScrollReveal";

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
    <main className="site-body">
      <section className="hero" style={{ minHeight: "auto", padding: "clamp(4rem,10vh,6rem) 0" }}>
        <div className="wrap hero-inner">
          <p className="hero-eyebrow">SAME-DAY BOOKING AVAILABLE</p>
          <h1 className="font-display" style={{ fontSize: "clamp(2rem,1.4rem+3.4vw,3.6rem)" }}>
            <span>Beach chairs &amp; loungers</span>
          </h1>
          <p className="hero-sub">Reserve your exact spot by the water — book for today or plan ahead.</p>
        </div>
      </section>

      <section className="section wrap">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-rule py-16 text-center opacity-60">
            No rentals available right now. Check back soon.
          </div>
        ) : (
          <div className="chair-grid">
            {items.map((item, i) => (
              <ScrollReveal key={item.id} delay={Math.min(i * 60, 300)}>
                <ChairCard
                  item={item}
                  remainingToday={availabilityByItem[i]?.remainingChairs ?? null}
                  timeSlots={detailsByItem[i]?.timeSlots ?? undefined}
                />
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
