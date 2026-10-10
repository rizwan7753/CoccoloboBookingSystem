"use client";

import { Fragment, useEffect, useState } from "react";
import { adminApi, AdminUserSummary, AdminRoleSummary, Location, getStoredAdmin } from "@/lib/adminApi";
import { PageHeader, cardClass, inputClass, primaryButtonClass } from "@/components/admin/ui";

export default function StaffPage() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [roles, setRoles] = useState<AdminRoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentAdminId = getStoredAdmin()?.id;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [locationId, setLocationId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  function load() {
    Promise.all([adminApi.listUsers(), adminApi.listLocations(), adminApi.listRoles()])
      .then(([u, l, r]) => {
        setUsers(u);
        setLocations(l);
        setRoles(r.roles);
        if (l[0]) setLocationId(l[0].id);
        if (r.roles[0]) setRole(r.roles[0].id);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function roleLabel(roleId: string) {
    return roles.find((r) => r.id === roleId)?.name ?? roleId;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminApi.createUser({ name, email, password, role, locationId: locationId || null });
      setName("");
      setEmail("");
      setPassword("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(id: string, newRole: string) {
    await adminApi.updateUser(id, { role: newRole });
    load();
  }

  async function handleToggleActive(u: AdminUserSummary) {
    await adminApi.updateUser(u.id, { isActive: !u.isActive });
    load();
  }

  function startEdit(u: AdminUserSummary) {
    setEditingId(u.id);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPassword("");
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleSaveEdit(id: string) {
    setEditSubmitting(true);
    setEditError(null);
    try {
      await adminApi.updateUser(id, {
        name: editName,
        email: editEmail,
        ...(editPassword ? { password: editPassword } : {}),
      });
      setEditingId(null);
      load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setEditSubmitting(false);
    }
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
        description="Role-based access control. Manage what each role can do from Roles & Permissions."
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
              <label className="mb-1 block text-sm font-medium text-admin-ink-soft">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-admin-ink-soft">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-admin-ink-soft">Temporary password</label>
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
              <label className="mb-1 block text-sm font-medium text-admin-ink-soft">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-admin-ink-soft">Location</label>
              <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={inputClass}>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-admin-danger-ink">{error}</p>}
          <button type="submit" disabled={submitting} className={primaryButtonClass}>
            {submitting ? "Creating…" : "Create account"}
          </button>
        </form>
      )}

      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
          <p className="p-6 text-sm text-admin-faint">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="border-b border-admin-line-soft text-xs uppercase tracking-wide text-admin-faint">
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
                <Fragment key={u.id}>
                  <tr className="border-b border-admin-line-soft last:border-0 hover:bg-admin-surface-soft">
                    <td className="px-5 py-3 font-medium text-admin-ink">
                      {editingId === u.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-md border border-admin-line px-2 py-1 text-sm"
                        />
                      ) : (
                        <>
                          {u.name} {u.id === currentAdminId && <span className="text-xs text-admin-faint">(you)</span>}
                        </>
                      )}
                    </td>
                    <td className="px-5 py-3 text-admin-muted">
                      {editingId === u.id ? (
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full rounded-md border border-admin-line px-2 py-1 text-sm"
                        />
                      ) : (
                        u.email
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={u.role}
                        disabled={u.id === currentAdminId}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="rounded-md border border-admin-line px-2 py-1 text-sm disabled:opacity-50"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                        {!roles.some((r) => r.id === u.role) && <option value={u.role}>{roleLabel(u.role)}</option>}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={u.id === currentAdminId}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium disabled:opacity-50 ${
                          u.isActive ? "bg-admin-success-tint text-admin-success-ink" : "bg-admin-surface-sunk text-admin-muted"
                        }`}
                      >
                        {u.isActive ? "Active" : "Deactivated"}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {editingId === u.id ? (
                        <button onClick={cancelEdit} className="mr-3 text-admin-muted hover:text-admin-ink-soft">
                          Cancel
                        </button>
                      ) : (
                        <button onClick={() => startEdit(u)} className="mr-3 text-admin-primary-ink hover:text-admin-primary-ink">
                          Edit
                        </button>
                      )}
                      {u.id !== currentAdminId && editingId !== u.id && (
                        <button onClick={() => handleDelete(u.id)} className="text-admin-danger-ink hover:text-admin-danger-ink">
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                  {editingId === u.id && (
                    <tr className="border-b border-admin-line-soft bg-admin-surface-soft last:border-0">
                      <td colSpan={5} className="px-5 py-3">
                        <div className="flex flex-wrap items-end gap-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-admin-muted">New password (optional)</label>
                            <input
                              type="text"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              placeholder="Leave blank to keep current password"
                              minLength={8}
                              className="w-72 rounded-md border border-admin-line px-2 py-1 text-sm"
                            />
                          </div>
                          <button
                            onClick={() => handleSaveEdit(u.id)}
                            disabled={editSubmitting}
                            className={primaryButtonClass}
                          >
                            {editSubmitting ? "Saving…" : "Save changes"}
                          </button>
                          {editError && <p className="text-sm text-admin-danger-ink">{editError}</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
