import { api } from "@/lib/api";
import { settingsApi } from "@/lib/settingsApi";
import ExcursionCard from "@/components/site/ExcursionCard";
import ScrollReveal from "@/components/site/ScrollReveal";

export const revalidate = 60;

export const metadata = { title: "Excursions" };

export default async function ExcursionsPage() {
  const [excursions, { name }] = await Promise.all([api.listExcursions().catch(() => []), settingsApi.getSettings()]);

  return (
    <main className="site-body">
      <section className="hero" style={{ minHeight: "auto", padding: "clamp(4rem,10vh,6rem) 0" }}>
        <div className="wrap hero-inner">
          <p className="hero-eyebrow">EXCURSIONS &amp; ACTIVITIES</p>
          <h1 className="font-display" style={{ fontSize: "clamp(2rem,1.4rem+3.4vw,3.6rem)" }}>
            <span>Ways to spend the day at {name}</span>
          </h1>
          <p className="hero-sub">Each has its own duration, group minimum and booking cut-off. All of them close the evening before.</p>
        </div>
      </section>

      <section className="section wrap">
        {excursions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-rule py-16 text-center opacity-60">
            No excursions available right now. Check back soon.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {excursions.map((excursion, i) => (
              <ScrollReveal key={excursion.id} delay={Math.min(i * 60, 300)}>
                <ExcursionCard excursion={excursion} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
