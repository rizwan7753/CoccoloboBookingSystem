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
      <Sidebar admin={admin} systemName={systemName} onSignOut={signOut} />
      <main className="min-w-0 flex-1 overflow-x-hidden px-8 py-8">{children}</main>
    </div>
  );
}
