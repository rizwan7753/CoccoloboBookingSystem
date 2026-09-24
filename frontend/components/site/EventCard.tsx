import Link from "next/link";
import { EventItem } from "@/lib/eventApi";
import { formatTime12h } from "@/lib/time";
import { mediaUrl } from "@/lib/media";
import { EVENT_PLACEHOLDER_PHOTOS, pickPhoto } from "@/lib/placeholderPhotos";
import Medal from "./Medal";
import { EventQuickAdd } from "./QuickAddToCart";

export default function EventCard({ event }: { event: EventItem }) {
  const photo = mediaUrl(event.cardImageUrl) ?? pickPhoto(EVENT_PLACEHOLDER_PHOTOS, event.id);
  const date = new Date(`${event.eventDate.slice(0, 10)}T00:00:00`);
  const day = date.getDate();
  const month = date.toLocaleDateString(undefined, { month: "short" });
  const weekday = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <article className="event site-body">
      <Medal photo={photo} alt={event.venue ?? event.title} size="5.5rem" />
      <p className="event-date">
        <span className="d">{day}</span>
        <span className="m">{month}</span>
      </p>
      <div>
        <h3 className="font-display">{event.title}</h3>
        <p className="when">
          {weekday}
          {event.startTime && <>, from {formatTime12h(event.startTime)}</>}
        </p>
        <p className="body line-clamp-3">{event.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/events/${event.slug}`} className="btn">
            Get tickets
          </Link>
          <EventQuickAdd event={event} photo={photo} />
        </div>
      </div>
    </article>
  );
}
