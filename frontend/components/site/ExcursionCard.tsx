import Link from "next/link";
import { Excursion } from "@/lib/api";
import { formatDuration, formatTime12h } from "@/lib/time";
import { mediaUrl } from "@/lib/media";
import { EXCURSION_PLACEHOLDER_PHOTOS, pickPhoto } from "@/lib/placeholderPhotos";
import { ExcursionQuickAdd } from "./QuickAddToCart";

function formatNextDeparture(date: string, time: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const label =
    date === today
      ? "Today"
      : date === tomorrow
        ? "Tomorrow"
        : new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return `${label} · ${formatTime12h(time)}`;
}

export default function ExcursionCard({ excursion }: { excursion: Excursion }) {
  const photo = mediaUrl(excursion.cardImageUrl) ?? pickPhoto(EXCURSION_PLACEHOLDER_PHOTOS, excursion.id);
  const href = `/excursions/${excursion.slug}`;

  return (
    <article className="card site-body">
      <div className="card-visual">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={excursion.title} loading="lazy" decoding="async" />
        <span className="card-dur">{formatDuration(excursion.durationMinutes)}</span>
      </div>
      <div className="card-body">
        <h3 className="font-display">
          <Link href={href} className="no-underline hover:underline">
            {excursion.title}
          </Link>
        </h3>
        <p className="line-clamp-2">{excursion.description}</p>
        {excursion.nextDeparture && (
          <p className="mb-3 -mt-2 flex items-center gap-1.5 text-xs font-medium text-aqua-ink">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Next departure: {formatNextDeparture(excursion.nextDeparture.date, excursion.nextDeparture.time)}
          </p>
        )}
        <p className="card-price">
          ${excursion.priceAdult}
          <small>{excursion.pricingType === "FLAT_RATE" ? "flat rate" : "per adult"}</small>
        </p>
        <div className="card-actions">
          <Link href={href} className="btn">
            Book
          </Link>
          <Link href={href} className="btn btn-ghost">
            Details
          </Link>
          <ExcursionQuickAdd excursion={excursion} photo={photo} />
        </div>
      </div>
    </article>
  );
}
