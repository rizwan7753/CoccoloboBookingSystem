"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, getStoredAdmin, clearSession, AdminSession } from "@/lib/adminApi";
import { settingsApi } from "@/lib/settingsApi";
import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [systemName, setSystemName] = useState("Booking Admin");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const authed = pathname === "/admin/login" || Boolean(getToken());
    if (!authed) {
      router.replace("/admin/login");
      return;
    }
    // Bridges an external system (localStorage, unavailable during SSR) into
    // render-gating state — cannot be computed synchronously on first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAdmin(getStoredAdmin());
    setChecked(true);
  }, [pathname, router]);

  useEffect(() => {
    settingsApi.getSettings().then((s) => setSystemName(s.name));
  }, []);

  if (pathname === "/admin/login") return <>{children}</>;
  if (!checked) return null;

  function signOut() {
    clearSession();
    router.push("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar admin={admin} systemName={systemName} onSignOut={signOut} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="truncate text-sm font-semibold text-stone-900">{systemName}</p>
        </div>
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
