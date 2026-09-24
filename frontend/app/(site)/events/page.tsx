import { eventApi } from "@/lib/eventApi";
import { settingsApi } from "@/lib/settingsApi";
import EventCard from "@/components/site/EventCard";
import ScrollReveal from "@/components/site/ScrollReveal";

export const revalidate = 60;

export const metadata = { title: "Events" };

export default async function EventsPage() {
  const [events, { name }] = await Promise.all([eventApi.listEvents().catch(() => []), settingsApi.getSettings()]);

  return (
    <main className="site-body">
      <section className="hero" style={{ minHeight: "auto", padding: "clamp(4rem,10vh,6rem) 0" }}>
        <div className="wrap hero-inner">
          <p className="hero-eyebrow">TICKETS AVAILABLE NOW</p>
          <h1 className="font-display" style={{ fontSize: "clamp(2rem,1.4rem+3.4vw,3.6rem)" }}>
            <span>Upcoming events at {name}</span>
          </h1>
          <p className="hero-sub">Parties, live music, and one-off nights on the beach — ticket sales stay open right up to each event.</p>
        </div>
      </section>

      <section className="section wrap">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-rule py-16 text-center opacity-60">
            No upcoming events right now. Check back soon.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {events.map((event, i) => (
              <ScrollReveal key={event.id} delay={Math.min(i * 60, 300)}>
                <EventCard event={event} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
