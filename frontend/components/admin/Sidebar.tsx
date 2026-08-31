"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminSession, canManageUsers, ROLE_LABELS } from "@/lib/adminApi";

const ICONS: Record<string, React.ReactNode> = {
  dashboard: <path d="M3 13h8V3H3v10ZM13 21h8V11h-8v10ZM13 3v6h8V3h-8ZM3 21h8v-6H3v6Z" strokeLinecap="round" strokeLinejoin="round" />,
  excursions: <path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />,
  manifest: <path d="M9 2h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1ZM8 11h8M8 15h8M8 7h3" strokeLinecap="round" strokeLinejoin="round" />,
  beachChair: <path d="M4 20 12 4l8 16M8 12h8M6 16h12" strokeLinecap="round" strokeLinejoin="round" />,
  events: <path d="M9 18V5l12-2v13M9 9l12-2M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" strokeLinecap="round" strokeLinejoin="round" />,
  holiday: <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />,
  settings: <><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" strokeLinecap="round" strokeLinejoin="round" /></>,
  staff: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />,
  activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />,
};

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      {ICONS[name]}
    </svg>
  );
}

type NavItem = { href: string; label: string; icon: keyof typeof ICONS; show: boolean };

export default function Sidebar({
  admin,
  systemName,
  onSignOut,
}: {
  admin: AdminSession | null;
  systemName: string;
  onSignOut: () => void;
}) {
  const pathname = usePathname();

  const manageItems: NavItem[] = [
    { href: "/admin/excursions", label: "Excursions", icon: "excursions", show: true },
    { href: "/admin/rentals", label: "Beach Chairs", icon: "beachChair", show: true },
    { href: "/admin/events", label: "Events", icon: "events", show: true },
    { href: "/admin/holidays", label: "Holidays & Closures", icon: "holiday", show: true },
  ];

  const bookingItems: NavItem[] = [
    { href: "/admin/bookings", label: "Excursion Manifest", icon: "manifest", show: true },
    { href: "/admin/rental-bookings", label: "Beach Chair Bookings", icon: "beachChair", show: true },
    { href: "/admin/event-bookings", label: "Event Bookings", icon: "events", show: true },
  ];

  const otherItems: NavItem[] = [
    { href: "/admin/users", label: "Staff", icon: "staff", show: canManageUsers(admin?.role) },
    { href: "/admin/audit-log", label: "Activity log", icon: "activity", show: canManageUsers(admin?.role) },
    { href: "/admin/settings", label: "Settings", icon: "settings", show: canManageUsers(admin?.role) },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderItems(items: NavItem[]) {
    return items
      .filter((item) => item.show)
      .map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
            isActive(item.href) ? "bg-teal-50 text-teal-800" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
          }`}
        >
          <Icon name={item.icon} />
          {item.label}
        </Link>
      ));
  }

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col overflow-y-auto border-r border-stone-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-700 text-sm font-bold text-white">
          {systemName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-900">{systemName}</p>
          <p className="text-xs text-stone-400">Booking Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 px-3">
        <Link
          href="/admin"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
            pathname === "/admin" ? "bg-teal-50 text-teal-800" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
          }`}
        >
          <Icon name="dashboard" />
          Dashboard
        </Link>

        <div>
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Manage</p>
          <div className="space-y-1">{renderItems(manageItems)}</div>
        </div>

        <div>
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Bookings</p>
          <div className="space-y-1">{renderItems(bookingItems)}</div>
        </div>

        {otherItems.some((i) => i.show) && (
          <div>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Admin</p>
            <div className="space-y-1">{renderItems(otherItems)}</div>
          </div>
        )}
      </nav>

      <div className="border-t border-stone-100 p-4">
        {admin && (
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-600">
              {admin.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-stone-900">{admin.name}</p>
              <p className="truncate text-xs text-stone-400">{ROLE_LABELS[admin.role]}</p>
            </div>
          </div>
        )}
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-50 hover:text-stone-800"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
