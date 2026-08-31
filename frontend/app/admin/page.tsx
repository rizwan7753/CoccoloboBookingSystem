"use client";

import { useEffect, useState } from "react";
import { adminApi, DashboardSummary, getStoredAdmin } from "@/lib/adminApi";
import { PageHeader, cardClass } from "@/components/admin/ui";
import StatCard from "@/components/admin/StatCard";
import BookingCalendar from "@/components/admin/BookingCalendar";

function monthRange(month: Date) {
  const from = new Date(month.getFullYear(), month.getMonth(), 1);
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

export default function AdminDashboardPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const admin = getStoredAdmin();

  useEffect(() => {
    const { from, to } = monthRange(month);
    adminApi
      .getDashboardSummary(from, to)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [month]);

  const k = summary?.kpis;

  return (
    <div>
      <PageHeader
        title={`Welcome back${admin ? `, ${admin.name.split(" ")[0]}` : ""}`}
        description="Here's what's happening across excursions, beach chairs, and events."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Scheduled today" value={String(k?.scheduledToday ?? "–")} icon="calendar" accent="teal" />
        <StatCard label="Upcoming bookings" value={String(k?.upcomingBookings ?? "–")} icon="users" accent="sky" />
        <StatCard
          label="Upcoming revenue (paid)"
          value={k ? `$${k.upcomingRevenuePaid.toFixed(0)}` : "–"}
          icon="revenue"
          accent="amber"
        />
        <StatCard label="Active excursions" value={String(k?.activeExcursions ?? "–")} icon="compass" accent="teal" />
        <StatCard label="Active rentals" value={String(k?.activeRentalItems ?? "–")} icon="compass" accent="sky" />
      </div>

      <div className={`${cardClass} mt-6 p-5`}>
        {loading && !summary ? (
          <p className="py-10 text-center text-sm text-stone-400">Loading calendar…</p>
        ) : (
          <BookingCalendar
            month={month}
            days={summary?.days ?? []}
            onPrevMonth={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            onNextMonth={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          />
        )}
        <p className="mt-3 text-xs text-stone-400">
          Click a badge on any day to jump to that booking type&apos;s list — excursion manifest, beach chair bookings, or event bookings.
        </p>
      </div>
    </div>
  );
}
