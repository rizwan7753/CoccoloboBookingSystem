"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, setSession } from "@/lib/adminApi";
import { settingsApi } from "@/lib/settingsApi";
import { inputClass, primaryButtonClass } from "@/components/admin/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [systemName, setSystemName] = useState("Booking Admin");

  useEffect(() => {
    settingsApi.getSettings().then((s) => setSystemName(s.name));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { token, admin } = await adminApi.login(email, password);
      setSession(token, admin);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-lg font-bold text-white">
            {systemName.slice(0, 1).toUpperCase()}
          </div>
          <h1 className="mt-3 text-lg font-semibold text-stone-900">{systemName} Admin</h1>
          <p className="text-sm text-stone-400">Sign in with your staff account</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full py-2.5`}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
