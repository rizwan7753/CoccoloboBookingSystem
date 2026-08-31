"use client";

import { useEffect, useState } from "react";
import {
  adminApi,
  AdminUserSummary,
  Location,
  ADMIN_ROLES,
  ROLE_LABELS,
  AdminRole,
  getStoredAdmin,
} from "@/lib/adminApi";
import { PageHeader, cardClass, inputClass, primaryButtonClass } from "@/components/admin/ui";

export default function StaffPage() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentAdminId = getStoredAdmin()?.id;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("BOOKING_STAFF");
  const [locationId, setLocationId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    Promise.all([adminApi.listUsers(), adminApi.listLocations()])
      .then(([u, l]) => {
        setUsers(u);
        setLocations(l);
        if (l[0]) setLocationId(l[0].id);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminApi.createUser({ name, email, password, role, locationId: locationId || null });
      setName("");
      setEmail("");
      setPassword("");
      setRole("BOOKING_STAFF");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(id: string, newRole: AdminRole) {
    await adminApi.updateUser(id, { role: newRole });
    load();
  }

  async function handleToggleActive(u: AdminUserSummary) {
    await adminApi.updateUser(u.id, { isActive: !u.isActive });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this staff account? This cannot be undone.")) return;
    try {
      await adminApi.deleteUser(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  return (
    <div>
      <PageHeader
        title="Staff & role management"
        description="Role-based access control — Super Admin only. See spec §14 for what each role can do."
        actions={
          <button onClick={() => setShowForm((v) => !v)} className={primaryButtonClass}>
            {showForm ? "Cancel" : "+ New staff account"}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleCreate} className={`${cardClass} mb-6 max-w-xl space-y-3 p-5`}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Temporary password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className={inputClass}>
                {ADMIN_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-stone-700">Location</label>
              <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={inputClass}>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className={primaryButtonClass}>
            {submitting ? "Creating…" : "Create account"}
          </button>
        </form>
      )}

      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
          <p className="p-6 text-sm text-stone-400">Loading…</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/60">
                  <td className="px-5 py-3 font-medium text-stone-900">
                    {u.name} {u.id === currentAdminId && <span className="text-xs text-stone-400">(you)</span>}
                  </td>
                  <td className="px-5 py-3 text-stone-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      disabled={u.id === currentAdminId}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as AdminRole)}
                      className="rounded-md border border-stone-300 px-2 py-1 text-sm disabled:opacity-50"
                    >
                      {ADMIN_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(u)}
                      disabled={u.id === currentAdminId}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium disabled:opacity-50 ${
                        u.isActive ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {u.isActive ? "Active" : "Deactivated"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {u.id !== currentAdminId && (
                      <button onClick={() => handleDelete(u.id)} className="text-rose-600 hover:text-rose-800">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
