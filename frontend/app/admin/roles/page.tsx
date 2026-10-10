"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminRoleSummary, PermissionGroup } from "@/lib/adminApi";
import { PageHeader, cardClass, inputClass, primaryButtonClass } from "@/components/admin/ui";

function PermissionChecklist({
  groups,
  selected,
  onToggle,
  lockedOn,
}: {
  groups: PermissionGroup[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  /** Super Admin's permissions can't be unchecked — always granted. */
  lockedOn?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-admin-faint">{group.label}</p>
          <div className="space-y-1.5">
            {group.permissions.map((p) => (
              <label key={p.key} className="flex items-start gap-2 text-sm text-admin-ink-soft">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={lockedOn || selected.has(p.key)}
                  disabled={lockedOn}
                  onChange={() => onToggle(p.key)}
                />
                <span className={lockedOn ? "text-admin-faint" : ""}>{p.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RolesPage() {
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [roles, setRoles] = useState<AdminRoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<Set<string>>(new Set());
  const [draftName, setDraftName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPermissions, setNewPermissions] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function load() {
    adminApi
      .listRoles()
      .then((res) => {
        setGroups(res.permissionGroups);
        setRoles(res.roles);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function startEdit(role: AdminRoleSummary) {
    setExpandedId(role.id);
    setDraftName(role.name);
    setDraftPermissions(new Set(role.permissions));
    setError(null);
  }

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, key: string) {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSet(next);
  }

  async function handleSave(role: AdminRoleSummary) {
    setSaving(true);
    setError(null);
    try {
      await adminApi.updateRole(role.id, {
        name: role.isSystem ? undefined : draftName,
        permissions: Array.from(draftPermissions),
      });
      setExpandedId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(role: AdminRoleSummary) {
    if (role.staffCount > 0) {
      alert(
        `"${role.name}" is still assigned to ${role.staffCount} staff account${role.staffCount === 1 ? "" : "s"}. Reassign ${
          role.staffCount === 1 ? "that account" : "those accounts"
        } to a different role on the Staff page first, then delete this role.`
      );
      return;
    }
    const warning = role.isSystem
      ? `Delete the built-in "${role.name}" role? This cannot be undone, and it won't be recreated automatically.`
      : `Delete the "${role.name}" role? This cannot be undone.`;
    if (!confirm(warning)) return;
    try {
      await adminApi.deleteRole(role.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete role");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await adminApi.createRole({ name: newName, permissions: Array.from(newPermissions) });
      setNewName("");
      setNewPermissions(new Set());
      setShowNewForm(false);
      load();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create role");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Roles & permissions"
        description="Create custom staff roles, or adjust exactly what each existing role can do."
        actions={
          <button onClick={() => setShowNewForm((v) => !v)} className={primaryButtonClass}>
            {showNewForm ? "Cancel" : "+ New role"}
          </button>
        }
      />

      {showNewForm && (
        <form onSubmit={handleCreate} className={`${cardClass} mb-6 space-y-4 p-5`}>
          <div className="max-w-sm">
            <label className="mb-1 block text-sm font-medium text-admin-ink-soft">Role name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Front Desk"
              required
              className={inputClass}
            />
          </div>
          <PermissionChecklist groups={groups} selected={newPermissions} onToggle={(k) => toggle(newPermissions, setNewPermissions, k)} />
          {createError && <p className="text-sm text-admin-danger-ink">{createError}</p>}
          <button type="submit" disabled={creating} className={primaryButtonClass}>
            {creating ? "Creating…" : "Create role"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-admin-faint">Loading…</p>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id} className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-admin-ink">{role.name}</h2>
                    {role.isSystem && (
                      <span className="rounded-full bg-admin-surface-sunk px-2 py-0.5 text-xs font-medium text-admin-muted">Built-in</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-admin-faint">
                    {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"} · {role.staffCount} staff account
                    {role.staffCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex gap-3">
                  {expandedId === role.id ? (
                    <button onClick={() => setExpandedId(null)} className="text-sm text-admin-muted hover:text-admin-ink-soft">
                      Cancel
                    </button>
                  ) : (
                    <button onClick={() => startEdit(role)} className="text-sm font-medium text-admin-primary-ink hover:text-admin-primary-ink">
                      Edit permissions
                    </button>
                  )}
                  {role.id !== "SUPER_ADMIN" && expandedId !== role.id && (
                    <button onClick={() => handleDelete(role)} className="text-sm text-admin-danger-ink hover:text-admin-danger-ink">
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {expandedId === role.id && (
                <div className="space-y-4 border-t border-admin-line-soft p-5">
                  {!role.isSystem && (
                    <div className="max-w-sm">
                      <label className="mb-1 block text-sm font-medium text-admin-ink-soft">Role name</label>
                      <input value={draftName} onChange={(e) => setDraftName(e.target.value)} className={inputClass} />
                    </div>
                  )}
                  <PermissionChecklist
                    groups={groups}
                    selected={draftPermissions}
                    onToggle={(k) => toggle(draftPermissions, setDraftPermissions, k)}
                    lockedOn={role.id === "SUPER_ADMIN"}
                  />
                  {role.id === "SUPER_ADMIN" && (
                    <p className="text-xs text-admin-faint">Super Admin always keeps every permission, to prevent a full lockout.</p>
                  )}
                  {error && <p className="text-sm text-admin-danger-ink">{error}</p>}
                  <button onClick={() => handleSave(role)} disabled={saving} className={primaryButtonClass}>
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
