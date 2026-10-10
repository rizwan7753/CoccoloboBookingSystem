"use client";

import Link from "next/link";
import { DashboardDay } from "@/lib/adminApi";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// `d` is always a local-midnight Date built from (year, monthIndex, day) —
// going through toISOString() here would convert to UTC first, shifting the
// date by a day for any timezone ahead of UTC (the day number shown on the
// cell wouldn't match the date the "view bookings" link actually opens).
// Reading the local getters directly keeps the two in sync.
function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function BookingCalendar({
  month,
  days,
  onPrevMonth,
  onNextMonth,
}: {
  month: Date; // first day of the visible month (local)
  days: DashboardDay[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const dayMap = new Map(days.map((d) => [d.date, d]));
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startOffset = firstOfMonth.getDay(); // 0=Sun
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const todayKey = toISODate(new Date());

  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, monthIndex, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-admin-ink">
          {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-1">
          <button onClick={onPrevMonth} className="rounded-md p-1.5 text-admin-muted hover:bg-admin-surface-sunk" aria-label="Previous month">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={onNextMonth} className="rounded-md p-1.5 text-admin-muted hover:bg-admin-surface-sunk" aria-label="Next month">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-3 text-xs text-admin-muted">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-admin-cat-excursion" /> Excursions</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-admin-cat-rental" /> Beach chairs</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-admin-cat-event" /> Events</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-admin-faint">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const key = toISODate(date);
          const info = dayMap.get(key);
          const isToday = key === todayKey;

          return (
            <div
              key={key}
              className={`flex h-24 flex-col rounded-lg border p-1.5 text-left transition ${
                isToday ? "border-admin-primary bg-admin-primary-tint" : "border-admin-line-soft hover:border-admin-line"
              }`}
            >
              <span className={`text-xs font-medium ${isToday ? "text-admin-primary-ink" : "text-admin-muted"}`}>{date.getDate()}</span>
              {info && info.bookingCount > 0 && (
                <div className="mt-auto flex flex-col gap-0.5">
                  {info.excursionBookings > 0 && (
                    <Link
                      href={`/admin/bookings?date=${key}`}
                      className="truncate rounded bg-admin-cat-excursion-tint px-1 py-0.5 text-[10px] font-medium text-admin-cat-excursion-ink hover:bg-admin-cat-excursion/30"
                    >
                      {info.excursionBookings} excursion
                    </Link>
                  )}
                  {info.rentalBookings > 0 && (
                    <Link
                      href={`/admin/rental-bookings?date=${key}`}
                      className="truncate rounded bg-admin-cat-rental-tint px-1 py-0.5 text-[10px] font-medium text-admin-cat-rental-ink hover:bg-admin-cat-rental/40"
                    >
                      {info.rentalBookings} chair
                    </Link>
                  )}
                  {info.eventBookings > 0 && (
                    <Link
                      href={`/admin/event-bookings?date=${key}`}
                      className="truncate rounded bg-admin-cat-event-tint px-1 py-0.5 text-[10px] font-medium text-admin-cat-event-ink hover:bg-admin-cat-event/30"
                    >
                      {info.eventBookings} event
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
