import Link from "next/link";
import { EventItem } from "@/lib/eventApi";
import { formatTime12h } from "@/lib/time";
import { mediaUrl } from "@/lib/media";
import { EVENT_PLACEHOLDER_PHOTOS, pickPhoto } from "@/lib/placeholderPhotos";
import { EventQuickAdd } from "./QuickAddToCart";

/** Two columns: the event's brochure (flyer) on the left, shown whole since
 *  flyers carry text, and the event details on the right. Events without a
 *  brochure show their card photo there instead, cropped to fill. */
export default function EventCard({ event }: { event: EventItem }) {
  const photo = mediaUrl(event.cardImageUrl) ?? pickPhoto(EVENT_PLACEHOLDER_PHOTOS, event.id);
  const brochure = mediaUrl(event.brochureUrl);
  const date = new Date(`${event.eventDate.slice(0, 10)}T00:00:00`);
  const day = date.getDate();
  const month = date.toLocaleDateString(undefined, { month: "short" });
  const weekday = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <article className="event site-body">
      <div className={`event-visual${brochure ? "" : " event-visual--photo"}`}>
        {brochure ? (
          <a href={brochure} target="_blank" rel="noreferrer" aria-label={`Open the ${event.title} brochure full size`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brochure} alt={`${event.title} brochure`} loading="lazy" decoding="async" />
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={event.title} loading="lazy" decoding="async" />
        )}
      </div>

      <div className="event-content">
        <p className="event-date">
          <span className="d">{day}</span>
          <span className="m">{month}</span>
        </p>
        <h3 className="font-display">{event.title}</h3>
        <p className="when">
          {weekday}
          {event.startTime && <>, from {formatTime12h(event.startTime)}</>}
          {event.venue && <> · {event.venue}</>}
        </p>
        <p className="body line-clamp-4">{event.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/events/${event.slug}`} className="btn">
            Get tickets
          </Link>
          <EventQuickAdd event={event} photo={photo} />
          {brochure && (
            <a href={brochure} target="_blank" rel="noreferrer" className="text-sm font-medium text-coral-ink underline underline-offset-2">
              View brochure
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
