import Link from "next/link";
import { eventApi } from "@/lib/eventApi";
import { settingsApi } from "@/lib/settingsApi";
import { mediaUrl } from "@/lib/media";

export const revalidate = 60;

export const metadata = { title: "Events" };

function formatEventDate(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function EventsPage() {
  const [events, { name }] = await Promise.all([eventApi.listEvents().catch(() => []), settingsApi.getSettings()]);

  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-fuchsia-900 via-purple-800 to-indigo-800">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 75% 30%, white 0, transparent 45%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <span className="animate-fade-in-up inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-widest text-fuchsia-50">
            Tickets available now
          </span>
          <h1
            className="animate-fade-in-up font-display mt-5 max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl"
            style={{ animationDelay: "80ms" }}
          >
            Upcoming events at {name}
          </h1>
          <p className="animate-fade-in-up mt-4 max-w-xl text-lg text-fuchsia-50/90" style={{ animationDelay: "160ms" }}>
            Parties, live music, and one-off nights on the beach — ticket sales stay open right up to each event.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 py-16 text-center text-stone-400">
            No upcoming events right now. Check back soon.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="animate-fade-in-up group block overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-200/60"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-fuchsia-600 to-purple-600">
                  {event.cardImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(event.cardImageUrl) ?? undefined}
                      alt={event.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <svg className="absolute bottom-2 right-3 h-16 w-16 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
                      <path d="M9 18V5l12-2v13M9 9l12-2M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-700">
                    {event.startTime}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-fuchsia-700">{formatEventDate(event.eventDate)}</p>
                  <h2 className="font-display mt-1 text-lg font-bold text-stone-900 group-hover:text-fuchsia-700">{event.title}</h2>
                  <p className="mt-1.5 line-clamp-2 text-sm text-stone-500">{event.description}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                    <span className="text-sm font-medium text-fuchsia-700">Get tickets →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
