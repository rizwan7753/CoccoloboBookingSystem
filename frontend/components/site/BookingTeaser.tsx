"use client";

import { useState } from "react";
import Link from "next/link";
import { api, AvailabilityDay, Excursion } from "@/lib/api";
import { rentalApi, RentalItem, RentalAvailability, RentalTimeSlot } from "@/lib/rentalApi";
import { eventApi, EventItem, TierAvailability } from "@/lib/eventApi";
import { formatTimeRange, formatTime12h } from "@/lib/time";

type Tab = "excursions" | "chairs" | "restaurant" | "events";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Real availability checker for the homepage hero — not a mockup. Each tab
 * calls the same endpoints the excursion/chair/event detail pages use
 * (api.getAvailability / rentalApi.getAvailability / eventApi.getAvailability)
 * against whichever item the guest picks, and links results straight to the
 * real booking flow on that item's detail page.
 */
export default function BookingTeaser({
  excursions,
  rentals,
  events,
  showExcursions = true,
}: {
  excursions: Excursion[];
  rentals: RentalItem[];
  events: EventItem[];
  /** Off while excursions are hidden from the homepage (pending the Stingray Haven launch). */
  showExcursions?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(showExcursions ? "excursions" : "chairs");
  const [date, setDate] = useState(todayISO());
  const [guests, setGuests] = useState(2);

  const [excursionId, setExcursionId] = useState(excursions[0]?.id ?? "");
  const [rentalId, setRentalId] = useState(rentals[0]?.id ?? "");
  const [eventId, setEventId] = useState(events[0]?.id ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [excursionSlots, setExcursionSlots] = useState<AvailabilityDay[] | null>(null);
  const [chairResult, setChairResult] = useState<{ slot: RentalTimeSlot; availability: RentalAvailability } | null>(null);
  const [tierResults, setTierResults] = useState<TierAvailability[] | null>(null);

  function switchTab(next: Tab) {
    setTab(next);
    setError(null);
    setExcursionSlots(null);
    setChairResult(null);
    setTierResults(null);
  }

  async function checkExcursion() {
    const excursion = excursions.find((e) => e.id === excursionId);
    if (!excursion) return;
    setLoading(true);
    setError(null);
    try {
      const slots = await api.getAvailability(excursion.id, date, date);
      setExcursionSlots(slots);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check availability");
    } finally {
      setLoading(false);
    }
  }

  async function checkChair() {
    const item = rentals.find((r) => r.id === rentalId);
    if (!item) return;
    setLoading(true);
    setError(null);
    try {
      // Rental list responses don't include time slots — fetch the item's
      // detail (same as the beach-chairs listing page) to find its first
      // active slot, then check real availability for that slot.
      const detail = await rentalApi.getRental(item.slug);
      const slot = detail.timeSlots?.find((s) => s.isActive) ?? detail.timeSlots?.[0];
      if (!slot) {
        setError("No time slots configured for this rental yet.");
        return;
      }
      const availability = await rentalApi.getAvailability(item.id, date, slot.id);
      setChairResult({ slot, availability });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check availability");
    } finally {
      setLoading(false);
    }
  }

  async function checkEvent() {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    setLoading(true);
    setError(null);
    try {
      const tiers = await eventApi.getAvailability(event.id);
      setTierResults(tiers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check availability");
    } finally {
      setLoading(false);
    }
  }

  const selectedExcursion = excursions.find((e) => e.id === excursionId);
  const selectedRental = rentals.find((r) => r.id === rentalId);
  const selectedEvent = events.find((e) => e.id === eventId);

  return (
    <div className="booking-box">
      <div className="tabs" role="tablist" aria-label="What would you like to book?">
        {showExcursions && (
        <button className="tab" role="tab" aria-selected={tab === "excursions"} onClick={() => switchTab("excursions")}>
          <svg aria-hidden="true">
            <use href="#ic-cabana" />
          </svg>
          Excursions
        </button>
        )}
        <button className="tab" role="tab" aria-selected={tab === "chairs"} onClick={() => switchTab("chairs")}>
          <svg aria-hidden="true">
            <use href="#ic-chair" />
          </svg>
          Beach chairs
        </button>
        <button className="tab" role="tab" aria-selected={tab === "restaurant"} onClick={() => switchTab("restaurant")}>
          <svg aria-hidden="true">
            <use href="#ic-fish" />
          </svg>
          Coco Grill
        </button>
        <button className="tab" role="tab" aria-selected={tab === "events"} onClick={() => switchTab("events")}>
          <svg aria-hidden="true">
            <use href="#ic-moon" />
          </svg>
          Events
        </button>
      </div>

      {tab === "excursions" && (
        <>
          <div className="fields">
            <div className="field">
              <label htmlFor="bk-excursion">Excursion</label>
              <select id="bk-excursion" value={excursionId} onChange={(e) => setExcursionId(e.target.value)}>
                {excursions.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="bk-date">Date</label>
              <input id="bk-date" type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="bk-guests">Guests</label>
              <input
                id="bk-guests"
                type="number"
                min={1}
                value={guests}
                onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <button type="button" className="btn" disabled={!excursionId || loading} onClick={checkExcursion}>
              {loading ? "Checking…" : "Check availability"}
            </button>
          </div>
          <p className="booking-note">Every excursion closes the evening before. Minimum group sizes apply.</p>
          <TeaserResults>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {excursionSlots && selectedExcursion && (
              <ResultList
                empty={excursionSlots.length === 0}
                emptyLabel="No departures on this date."
                rows={excursionSlots.map((s) => ({
                  key: s.time,
                  label: formatTimeRange(s.time, selectedExcursion.durationMinutes),
                  detail: s.holidayLabel ? `Closed — ${s.holidayLabel}` : s.bookingClosed ? "Booking closed" : `${s.remaining} of ${s.capacity} left`,
                  warn: guests > s.remaining,
                  disabled: s.bookingClosed || s.remaining <= 0 || Boolean(s.holidayLabel),
                  href: `/excursions/${selectedExcursion.slug}?date=${date}&time=${s.time}`,
                }))}
              />
            )}
          </TeaserResults>
        </>
      )}

      {tab === "chairs" && (
        <>
          <div className="fields">
            <div className="field">
              <label htmlFor="bk-chair">Beach chair</label>
              <select id="bk-chair" value={rentalId} onChange={(e) => setRentalId(e.target.value)}>
                {rentals.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="bk-chair-date">Date</label>
              <input id="bk-chair-date" type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="bk-chair-guests">Guests</label>
              <input
                id="bk-chair-guests"
                type="number"
                min={1}
                value={guests}
                onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <button type="button" className="btn" disabled={!rentalId || loading} onClick={checkChair}>
              {loading ? "Checking…" : "Check availability"}
            </button>
          </div>
          <p className="booking-note">Same-day booking available — reserve for today or plan ahead.</p>
          <TeaserResults>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {chairResult && selectedRental && (
              <ResultList
                empty={false}
                rows={[
                  {
                    key: chairResult.slot.id,
                    label: chairResult.availability.holidayLabel
                      ? `Closed — ${chairResult.availability.holidayLabel}`
                      : `${chairResult.slot.label} (${formatTime12h(chairResult.slot.startTime)}–${formatTime12h(chairResult.slot.endTime)})`,
                    detail: chairResult.availability.holidayLabel
                      ? "No chairs available"
                      : `${chairResult.availability.remainingChairs} of ${chairResult.availability.totalChairs} chairs left`,
                    warn: guests > chairResult.availability.remainingChairs,
                    disabled: Boolean(chairResult.availability.holidayLabel) || chairResult.availability.remainingChairs <= 0,
                    href: `/beach-chairs/${selectedRental.slug}`,
                  },
                ]}
              />
            )}
          </TeaserResults>
        </>
      )}

      {tab === "restaurant" && (
        <div className="fields" style={{ gridTemplateColumns: "1fr auto" }}>
          <p className="m-0 self-center text-sm opacity-70">
            A request, not a confirmed booking — reserve a table and we&apos;ll reply by phone or email.
          </p>
          <Link href="/coco-grill#reserve" className="btn">
            Reserve a table
          </Link>
        </div>
      )}

      {tab === "events" && (
        <>
          <div className="fields" style={{ gridTemplateColumns: "1fr auto" }}>
            <div className="field">
              <label htmlFor="bk-event">Event</label>
              <select id="bk-event" value={eventId} onChange={(e) => setEventId(e.target.value)}>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} — {new Date(`${ev.eventDate.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn" disabled={!eventId || loading} onClick={checkEvent}>
              {loading ? "Checking…" : "Check availability"}
            </button>
          </div>
          <p className="booking-note">Tickets stay on sale right up to each event.</p>
          <TeaserResults>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {tierResults && selectedEvent && (
              <ResultList
                empty={tierResults.length === 0}
                emptyLabel="No ticket tiers configured yet."
                rows={tierResults.map((t) => ({
                  key: t.id,
                  label: `${t.name} — $${t.price}`,
                  detail: `${t.remaining} of ${t.capacity} left`,
                  warn: false,
                  disabled: t.remaining <= 0,
                  href: `/events/${selectedEvent.slug}`,
                }))}
              />
            )}
          </TeaserResults>
        </>
      )}

      {events.length === 0 && tab === "events" && <p className="booking-note">No upcoming events right now.</p>}
    </div>
  );
}

function TeaserResults({ children }: { children: React.ReactNode }) {
  const hasContent = Array.isArray(children) ? children.some(Boolean) : Boolean(children);
  if (!hasContent) return null;
  return <div className="border-t border-rule px-6 py-4">{children}</div>;
}

function ResultList({
  rows,
  empty,
  emptyLabel = "Nothing available on this date.",
}: {
  rows: { key: string; label: string; detail: string; warn: boolean; disabled: boolean; href: string }[];
  empty: boolean;
  emptyLabel?: string;
}) {
  if (empty) return <p className="text-sm opacity-60">{emptyLabel}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.key} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rule bg-foam px-3 py-2">
          <span className="text-sm">
            <span className="font-medium text-abyss">{row.label}</span>{" "}
            <span className={row.disabled ? "text-red-600" : row.warn ? "text-coral-ink" : "opacity-70"}>· {row.detail}</span>
          </span>
          {row.disabled ? (
            <span className="text-xs opacity-50">Unavailable</span>
          ) : (
            <Link href={row.href} className="btn" style={{ padding: ".4rem 1rem", fontSize: ".85rem" }}>
              Book
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
