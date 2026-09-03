import { notFound } from "next/navigation";
import Link from "next/link";
import { eventApi } from "@/lib/eventApi";
import { settingsApi } from "@/lib/settingsApi";
import { mediaUrl } from "@/lib/media";
import EventBookingWidget from "@/components/EventBookingWidget";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [event, { name }] = await Promise.all([eventApi.getEvent(slug).catch(() => null), settingsApi.getSettings()]);
  if (!event) return {};
  return {
    title: `${event.title} — ${name}`,
    description: event.description.slice(0, 155),
  };
}

function formatEventDate(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await eventApi.getEvent(slug).catch(() => null);
  if (!event) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: `${event.eventDate.slice(0, 10)}T${event.startTime}`,
    location: event.venue ? { "@type": "Place", name: event.venue } : undefined,
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div
        className="relative h-56 overflow-hidden bg-gradient-to-br from-fuchsia-900 via-purple-800 to-indigo-800 bg-cover bg-center sm:h-72"
        style={event.headerImageUrl ? { backgroundImage: `url(${mediaUrl(event.headerImageUrl)})` } : undefined}
      >
        {event.headerImageUrl && <div className="pointer-events-none absolute inset-0 bg-black/35" />}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 75% 30%, white 0, transparent 45%)" }}
        />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-8 sm:px-6">
          <Link href="/events" className="mb-3 flex w-fit items-center gap-1 text-sm text-fuchsia-100 hover:text-white">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All events
          </Link>
          <p className="animate-fade-in-up text-sm font-medium text-fuchsia-100">{formatEventDate(event.eventDate)}</p>
          <h1
            className="animate-fade-in-up font-display max-w-2xl text-3xl font-bold text-white sm:text-4xl"
            style={{ animationDelay: "80ms" }}
          >
            {event.title}
          </h1>
          <p className="animate-fade-in-up mt-2 text-sm text-fuchsia-100" style={{ animationDelay: "160ms" }}>
            {event.startTime}
            {event.endTime ? ` – ${event.endTime}` : ""}
            {event.venue ? ` · ${event.venue}` : ""}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="whitespace-pre-line text-stone-600 leading-relaxed">{event.description}</p>

            {event.venue && (
              <div className="animate-fade-in-up mt-8 rounded-xl border border-stone-200 p-4 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-stone-200/60">
                <div className="flex items-center gap-2 text-stone-900">
                  <svg className="h-4 w-4 text-fuchsia-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <h2 className="text-sm font-semibold">Venue</h2>
                </div>
                <p className="mt-2 text-sm text-stone-600">{event.venue}</p>
                {event.mapUrl && (
                  <a href={event.mapUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-fuchsia-700 underline underline-offset-2">
                    View on map
                  </a>
                )}
              </div>
            )}

            {event.holidayLabel ? (
              <div className="mt-8 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="text-sm text-amber-900">
                  <p className="font-semibold">This event is closed for {event.holidayLabel}.</p>
                  <p className="mt-0.5">Tickets are not available for this date.</p>
                </div>
              </div>
            ) : (
              <div className="mt-8 flex gap-3 rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-4">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-fuchsia-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="text-sm text-fuchsia-900">
                  <p className="font-semibold">Tickets stay on sale right up to the event — no advance cutoff.</p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {event.holidayLabel ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-center text-sm text-stone-500">
                Ticket sales are closed for this date.
              </div>
            ) : (
              <EventBookingWidget event={event} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
