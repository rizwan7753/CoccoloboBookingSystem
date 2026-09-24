import Link from "next/link";
import { RentalItem, RentalTimeSlot } from "@/lib/rentalApi";
import { mediaUrl } from "@/lib/media";
import { CHAIR_PLACEHOLDER_PHOTOS, pickPhoto } from "@/lib/placeholderPhotos";
import { formatTime12h } from "@/lib/time";
import Medal from "./Medal";
import { ChairQuickAdd } from "./QuickAddToCart";

export default function ChairCard({
  item,
  remainingToday,
  timeSlots,
}: {
  item: RentalItem;
  remainingToday?: number | null;
  timeSlots?: RentalTimeSlot[];
}) {
  const photo = mediaUrl(item.cardImageUrl) ?? pickPhoto(CHAIR_PLACEHOLDER_PHOTOS, item.id);
  const hours = Math.round((item.durationMinutes / 60) * 10) / 10;
  const activeSlots = timeSlots?.filter((t) => t.isActive) ?? [];

  return (
    <article className="chair site-body">
      <Medal photo={photo} alt={item.name} size="4.25rem" />
      <h3 className="font-display">{item.name}</h3>
      <p className="price font-display">${item.priceAdult}</p>
      <p className="sub">
        {hours}-hour session · per adult
        {typeof remainingToday === "number" && <> · {remainingToday} left today</>}
      </p>
      {activeSlots.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {activeSlots.map((t) => (
            <span
              key={t.id}
              className="rounded-full border border-rule bg-foam px-2.5 py-1 text-xs font-medium text-abyss"
            >
              {formatTime12h(t.startTime)} – {formatTime12h(t.endTime)}
            </span>
          ))}
        </div>
      )}
      <p className="body max-w-[32ch]">{item.description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <Link href={`/beach-chairs/${item.slug}`} className="btn self-start">
          Reserve a spot
        </Link>
        <ChairQuickAdd item={item} photo={photo} />
      </div>
    </article>
  );
}
