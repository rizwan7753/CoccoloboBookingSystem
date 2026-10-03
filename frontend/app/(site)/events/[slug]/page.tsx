import { notFound } from "next/navigation";
import Link from "next/link";
import { eventApi } from "@/lib/eventApi";
import { settingsApi } from "@/lib/settingsApi";
import { mediaUrl } from "@/lib/media";
import EventBookingWidget from "@/components/EventBookingWidget";
import ItemReviews from "@/components/site/ItemReviews";

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
    <main className="site-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div
        className="relative h-56 overflow-hidden bg-gradient-to-br from-abyss via-deep to-aqua bg-cover bg-center sm:h-72"
        style={event.headerImageUrl ? { backgroundImage: `url(${mediaUrl(event.headerImageUrl)})` } : undefined}
      >
        {event.headerImageUrl && <div className="pointer-events-none absolute inset-0 bg-black/35" />}
        <div className="wrap relative flex h-full flex-col justify-end pb-8">
          <Link href="/events" className="mb-3 flex w-fit items-center gap-1 text-sm text-shallow hover:text-foam">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All events
          </Link>
          <p className="animate-fade-in-up text-sm font-medium text-shallow">{formatEventDate(event.eventDate)}</p>
          <h1 className="animate-fade-in-up font-display max-w-4xl text-3xl text-foam sm:text-4xl" style={{ animationDelay: "80ms" }}>
            {event.title}
          </h1>
          <p className="animate-fade-in-up mt-2 text-sm text-foam/85" style={{ animationDelay: "160ms" }}>
            {event.startTime}
            {event.endTime ? ` – ${event.endTime}` : ""}
            {event.venue ? ` · ${event.venue}` : ""}
          </p>
        </div>
      </div>

      <div className="wrap py-12">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="whitespace-pre-line leading-relaxed opacity-85">{event.description}</p>

            {event.brochureUrl && (
              <figure className="mt-8">
                <a href={mediaUrl(event.brochureUrl) ?? undefined} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-rule bg-abyss">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(event.brochureUrl) ?? undefined} alt={`${event.title} brochure`} className="mx-auto block h-auto w-full" />
                </a>
                <figcaption className="mt-2 text-sm opacity-70">
                  Event brochure ·{" "}
                  <a href={mediaUrl(event.brochureUrl) ?? undefined} target="_blank" rel="noreferrer" className="font-medium text-coral-ink underline underline-offset-2">
                    Open full size
                  </a>
                </figcaption>
              </figure>
            )}

            {event.venue && (
              <div className="animate-fade-in-up mt-8 rounded-xl border border-rule bg-shell p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center gap-2 text-abyss">
                  <svg className="h-4 w-4 text-coral-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <h2 className="font-display text-sm font-semibold">Venue</h2>
                </div>
                <p className="mt-2 text-sm opacity-80">{event.venue}</p>
                {event.mapUrl && (
                  <a href={event.mapUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-coral-ink underline underline-offset-2">
                    View on map
                  </a>
                )}
              </div>
            )}

            {event.holidayLabel ? (
              <div className="mt-8 flex gap-3 rounded-xl border border-rule bg-sand p-4">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-coral-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="text-sm text-abyss">
                  <p className="font-semibold">This event is closed for {event.holidayLabel}.</p>
                  <p className="mt-0.5">Tickets are not available for this date.</p>
                </div>
              </div>
            ) : (
              <div className="mt-8 flex gap-3 rounded-xl border border-rule bg-foam p-4">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-aqua-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="text-sm text-abyss">
                  <p className="font-semibold">Tickets stay on sale right up to the event — no advance cutoff.</p>
                </div>
              </div>
            )}

            <ItemReviews itemType="EVENT" itemId={event.id} itemTitle={event.title} />
          </div>

          <div className="lg:col-span-1">
            {event.holidayLabel ? (
              <div className="rounded-2xl border border-rule bg-foam p-5 text-center text-sm opacity-70">
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
