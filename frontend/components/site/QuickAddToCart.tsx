"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "./CartContext";
import { Excursion } from "@/lib/api";
import { rentalApi, RentalItem, RentalTimeSlot } from "@/lib/rentalApi";
import { eventApi, EventItem, TierAvailability } from "@/lib/eventApi";
import { mediaUrl } from "@/lib/media";
import { formatTimeRange, formatTime12h, formatDuration } from "@/lib/time";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Sunday=0..Saturday=6, matching the backend's dayOfWeek convention — see
 *  backend/src/lib/dateOnly.ts. Dates are plain "YYYY-MM-DD" strings, parsed
 *  as UTC midnight so this doesn't drift with the viewer's timezone. */
function dayOfWeek(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

const fieldClass = "w-full rounded-lg border border-rule bg-white px-3 py-2 text-sm text-abyss focus:border-coral focus:outline-none";

/**
 * Popup used by every card's "Add to cart" button — item details (photo,
 * title, description) on the left, date/time/tier fields on the right, so a
 * guest can pick exactly what they want without leaving the listing page.
 */
function QuickAddModal({
  open,
  onClose,
  photo,
  title,
  description,
  meta,
  children,
  onConfirm,
  confirmDisabled,
  confirmLabel = "Add to cart",
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  photo: string | null;
  title: string;
  description?: string;
  meta?: string;
  children: React.ReactNode;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  confirmLabel?: string;
  loading: boolean;
  error: string | null;
}) {
  if (!open) return null;

  // Rendered into document.body via a portal — a plain `position: fixed`
  // here would otherwise be trapped inside the card, since `.card:hover`
  // sets a CSS transform and any transformed ancestor becomes the
  // containing block for its "fixed" descendants (and, inside the
  // scroll-snap carousel, clips them too).
  return createPortal(
    <>
      <div onClick={onClose} aria-hidden="true" className="fixed inset-0 z-[60] bg-abyss/55" />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Add ${title} to cart`}>
        <div className="site-body relative grid w-full max-w-2xl overflow-hidden rounded-2xl bg-shell shadow-2xl sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-abyss hover:bg-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Left: item details */}
          <div className="relative flex flex-col">
            <div className="relative aspect-[4/3] sm:aspect-auto sm:h-full sm:min-h-[16rem]">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt={title} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-deep to-aqua" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-abyss/80 via-abyss/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-display text-xl text-foam">{title}</h3>
                {meta && <p className="mt-1 text-sm text-foam/85">{meta}</p>}
              </div>
            </div>
            {description && <p className="p-5 text-sm opacity-75 sm:hidden">{description}</p>}
          </div>

          {/* Right: date/time/tier fields */}
          <div className="flex flex-col p-6">
            {description && <p className="mb-4 hidden text-sm opacity-75 sm:block">{description}</p>}
            <div className="flex flex-col gap-3">{children}</div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-auto flex gap-2 pt-5">
              <button type="button" disabled={loading || confirmDisabled} onClick={onConfirm} className="btn flex-1 justify-center">
                {loading ? "Adding…" : confirmLabel}
              </button>
              <button type="button" onClick={onClose} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium uppercase tracking-wide opacity-60">
      {label}
      <div className="mt-1 normal-case tracking-normal">{children}</div>
    </label>
  );
}

function TriggerButton({ onClick, added, disabled }: { onClick: () => void; added: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "No upcoming departures available" : undefined}
      className="btn btn-ghost disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {added ? "Added ✓" : "Add to cart"}
    </button>
  );
}

export function ExcursionQuickAdd({ excursion, photo }: { excursion: Excursion; photo?: string | null }) {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [date, setDate] = useState(excursion.nextDeparture?.date ?? todayISO());
  const [time, setTime] = useState(excursion.nextDeparture?.time ?? "");
  const [adultCount, setAdultCount] = useState(1);

  const timesForDate = (excursion.departureTimes ?? []).filter((dt) => dt.daysOfWeek.includes(dayOfWeek(date)));

  useEffect(() => {
    if (!timesForDate.some((t) => t.time === time)) setTime(timesForDate[0]?.time ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const price = excursion.pricingType === "FLAT_RATE" ? Number(excursion.priceAdult) : Number(excursion.priceAdult) * adultCount;

  if (!excursion.nextDeparture) {
    return <TriggerButton onClick={() => {}} added={false} disabled />;
  }

  return (
    <>
      <TriggerButton onClick={() => setOpen(true)} added={added} />
      <QuickAddModal
        open={open}
        onClose={() => setOpen(false)}
        photo={photo ?? mediaUrl(excursion.cardImageUrl)}
        title={excursion.title}
        description={excursion.description}
        meta={`${formatDuration(excursion.durationMinutes)} · $${excursion.priceAdult}${excursion.pricingType === "FLAT_RATE" ? " flat rate" : " / adult"}`}
        loading={false}
        error={timesForDate.length === 0 ? "No departures on this date." : null}
        confirmDisabled={!time}
        onConfirm={() => {
          cart.addItem(
            { type: "excursion", excursionId: excursion.id, date, time, adultCount, childCount: 0 },
            { title: excursion.title, subtitle: `${date} · ${time} · ${adultCount} adult${adultCount === 1 ? "" : "s"}`, price, photo: photo ?? mediaUrl(excursion.cardImageUrl) }
          );
          setAdded(true);
          setOpen(false);
          setTimeout(() => setAdded(false), 2500);
        }}
      >
        <Field label="Date">
          <input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Time">
          <select value={time} onChange={(e) => setTime(e.target.value)} className={fieldClass}>
            {timesForDate.map((t) => (
              <option key={t.time} value={t.time}>
                {formatTimeRange(t.time, excursion.durationMinutes)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Adults">
          <input type="number" min={1} value={adultCount} onChange={(e) => setAdultCount(Math.max(1, Number(e.target.value)))} className={fieldClass} />
        </Field>
      </QuickAddModal>
    </>
  );
}

export function ChairQuickAdd({ item, photo }: { item: RentalItem; photo?: string | null }) {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<RentalTimeSlot[] | null>(null);
  const [date, setDate] = useState(todayISO());
  const [timeSlotId, setTimeSlotId] = useState<string>("");
  const [adultCount, setAdultCount] = useState(1);

  useEffect(() => {
    if (!open || timeSlots) return;
    rentalApi
      .getRental(item.slug)
      .then((detail) => {
        const active = (detail.timeSlots ?? []).filter((s) => s.isActive);
        setTimeSlots(active);
        setTimeSlotId(active[0]?.id ?? "");
      })
      .catch(() => setError("Couldn't load time slots"));
  }, [open, timeSlots, item.slug]);

  return (
    <>
      <TriggerButton onClick={() => setOpen(true)} added={added} />
      <QuickAddModal
        open={open}
        onClose={() => setOpen(false)}
        photo={photo ?? mediaUrl(item.cardImageUrl)}
        title={item.name}
        description={item.description}
        meta={`${Math.round((item.durationMinutes / 60) * 10) / 10}-hour session · $${item.priceAdult} / adult`}
        loading={loading}
        error={error}
        confirmDisabled={!timeSlotId}
        onConfirm={async () => {
          setLoading(true);
          setError(null);
          try {
            const availability = await rentalApi.getAvailability(item.id, date, timeSlotId);
            const spot = availability.spots.find((s) => s.remaining >= adultCount);
            if (!spot || availability.holidayLabel) throw new Error("No chairs available for that date/slot");
            const slot = timeSlots?.find((s) => s.id === timeSlotId);

            cart.addItem(
              { type: "rental", rentalItemId: item.id, spotId: spot.id, timeSlotId, date, adultCount, childCount: 0 },
              { title: item.name, subtitle: `${date} · ${slot?.label ?? ""} · ${spot.code}`, price: Number(item.priceAdult) * adultCount, photo: photo ?? mediaUrl(item.cardImageUrl) }
            );
            setAdded(true);
            setOpen(false);
            setTimeout(() => setAdded(false), 2500);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't add to cart");
          } finally {
            setLoading(false);
          }
        }}
      >
        <Field label="Date">
          <input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Time slot">
          {timeSlots === null ? (
            <p className="text-xs opacity-60">Loading…</p>
          ) : (
            <select value={timeSlotId} onChange={(e) => setTimeSlotId(e.target.value)} className={fieldClass}>
              {timeSlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} ({formatTime12h(s.startTime)}–{formatTime12h(s.endTime)})
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Chairs">
          <input type="number" min={1} value={adultCount} onChange={(e) => setAdultCount(Math.max(1, Number(e.target.value)))} className={fieldClass} />
        </Field>
      </QuickAddModal>
    </>
  );
}

export function EventQuickAdd({ event, photo }: { event: EventItem; photo?: string | null }) {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tiers, setTiers] = useState<TierAvailability[] | null>(null);
  const [tierId, setTierId] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!open || tiers) return;
    eventApi
      .getAvailability(event.id)
      .then((t) => {
        setTiers(t);
        setTierId(t.find((x) => x.remaining > 0)?.id ?? t[0]?.id ?? "");
      })
      .catch(() => setError("Couldn't load ticket tiers"));
  }, [open, tiers, event.id]);

  const selectedTier = tiers?.find((t) => t.id === tierId);
  const dateLabel = new Date(`${event.eventDate.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      <TriggerButton onClick={() => setOpen(true)} added={added} />
      <QuickAddModal
        open={open}
        onClose={() => setOpen(false)}
        photo={photo ?? mediaUrl(event.cardImageUrl)}
        title={event.title}
        description={event.description}
        meta={`${dateLabel}${event.venue ? ` · ${event.venue}` : ""}`}
        loading={loading}
        error={error ?? (selectedTier && quantity > selectedTier.remaining ? `Only ${selectedTier.remaining} left.` : null)}
        confirmDisabled={!selectedTier || quantity > selectedTier.remaining}
        onConfirm={() => {
          if (!selectedTier) return;
          cart.addItem(
            { type: "event", eventId: event.id, tierId: selectedTier.id, quantity },
            { title: event.title, subtitle: `${selectedTier.name} x${quantity}`, price: Number(selectedTier.price) * quantity, photo: photo ?? mediaUrl(event.cardImageUrl) }
          );
          setAdded(true);
          setOpen(false);
          setTimeout(() => setAdded(false), 2500);
        }}
      >
        <Field label="Ticket">
          {tiers === null ? (
            <p className="text-xs opacity-60">Loading…</p>
          ) : (
            <select value={tierId} onChange={(e) => setTierId(e.target.value)} className={fieldClass}>
              {tiers.map((t) => (
                <option key={t.id} value={t.id} disabled={t.remaining <= 0}>
                  {t.name} — ${t.price} {t.remaining <= 0 ? "(sold out)" : ""}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Quantity">
          <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} className={fieldClass} />
        </Field>
      </QuickAddModal>
    </>
  );
}
