"use client";

import Link from "next/link";
import { DashboardDay } from "@/lib/adminApi";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
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
        <h3 className="text-sm font-semibold text-stone-900">
          {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-1">
          <button onClick={onPrevMonth} className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100" aria-label="Previous month">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={onNextMonth} className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100" aria-label="Next month">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-3 text-xs text-stone-500">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-teal-500" /> Excursions</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Beach chairs</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-fuchsia-500" /> Events</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-stone-400">
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
                isToday ? "border-teal-600 bg-teal-50" : "border-stone-100 hover:border-stone-300"
              }`}
            >
              <span className={`text-xs font-medium ${isToday ? "text-teal-800" : "text-stone-500"}`}>{date.getDate()}</span>
              {info && info.bookingCount > 0 && (
                <div className="mt-auto flex flex-col gap-0.5">
                  {info.excursionBookings > 0 && (
                    <Link
                      href={`/admin/bookings?date=${key}`}
                      className="truncate rounded bg-teal-100 px-1 py-0.5 text-[10px] font-medium text-teal-800 hover:bg-teal-200"
                    >
                      {info.excursionBookings} excursion
                    </Link>
                  )}
                  {info.rentalBookings > 0 && (
                    <Link
                      href={`/admin/rental-bookings?date=${key}`}
                      className="truncate rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-800 hover:bg-amber-200"
                    >
                      {info.rentalBookings} chair
                    </Link>
                  )}
                  {info.eventBookings > 0 && (
                    <Link
                      href="/admin/event-bookings"
                      className="truncate rounded bg-fuchsia-100 px-1 py-0.5 text-[10px] font-medium text-fuchsia-800 hover:bg-fuchsia-200"
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
