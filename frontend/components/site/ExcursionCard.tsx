import Link from "next/link";
import { Excursion } from "@/lib/api";
import { formatTime12h } from "@/lib/time";
import { mediaUrl } from "@/lib/media";

// Deterministic gradient per card (no real photography yet) — cycles through
// a small set of coastal tones so the grid still reads as designed, not random.
const GRADIENTS = [
  "from-teal-600 to-emerald-500",
  "from-sky-600 to-cyan-500",
  "from-amber-500 to-orange-500",
  "from-cyan-700 to-teal-500",
  "from-emerald-700 to-teal-600",
];

function gradientFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

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
  return (
    <Link
      href={`/excursions/${excursion.slug}`}
      className="group block overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-200/60"
    >
      <div className={`relative h-36 overflow-hidden bg-gradient-to-br ${gradientFor(excursion.id)}`}>
        {excursion.cardImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(excursion.cardImageUrl) ?? undefined}
            alt={excursion.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <svg
            className="absolute bottom-0 right-0 h-20 w-20 text-white/15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path d="M2 18c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0M2 13c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0" strokeLinecap="round" />
          </svg>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-700">
          {excursion.durationMinutes} min
        </span>
      </div>
      <div className="p-5">
        <h2 className="font-display text-lg font-bold text-stone-900 group-hover:text-teal-700">{excursion.title}</h2>
        <p className="mt-1.5 line-clamp-2 text-sm text-stone-500">{excursion.description}</p>
        {excursion.nextDeparture && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-teal-700">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Next departure: {formatNextDeparture(excursion.nextDeparture.date, excursion.nextDeparture.time)}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
          <span className="text-sm font-semibold text-stone-900">
            ${excursion.priceAdult} <span className="font-normal text-stone-400">/ adult</span>
          </span>
          <span className="flex items-center gap-1 text-sm font-medium text-teal-700">
            View &amp; book
            <svg className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
