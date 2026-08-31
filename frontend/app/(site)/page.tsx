import { api } from "@/lib/api";
import { settingsApi } from "@/lib/settingsApi";
import ExcursionCard from "@/components/site/ExcursionCard";

export const revalidate = 60; // ISR: excursion list changes rarely

export default async function HomePage() {
  const [excursions, { name }] = await Promise.all([api.listExcursions().catch(() => []), settingsApi.getSettings()]);

  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-800">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0, transparent 40%), radial-gradient(circle at 80% 60%, white 0, transparent 35%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-teal-100">
            Advance booking required
          </span>
          <h1 className="font-display mt-5 max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
            Excursions &amp; activities at {name}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-teal-100/90">
            Reserve your spot ahead of time — every excursion has a booking cut-off, so plan your stay and lock in
            your adventure before the evening before.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold text-stone-900">Upcoming excursions</h2>
          <span className="text-sm text-stone-400">{excursions.length} experience{excursions.length === 1 ? "" : "s"}</span>
        </div>

        {excursions.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-stone-300 py-16 text-center text-stone-400">
            No excursions available right now. Check back soon.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {excursions.map((ex) => (
              <ExcursionCard key={ex.id} excursion={ex} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
