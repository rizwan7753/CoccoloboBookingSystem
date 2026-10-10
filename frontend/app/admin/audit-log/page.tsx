"use client";

import { useEffect, useState } from "react";
import { adminApi, AuditLogEntry } from "@/lib/adminApi";
import { PageHeader, cardClass } from "@/components/admin/ui";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getAuditLog()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Activity log"
        description="Every booking-affecting action — who did what, and when (spec §14/§18). Most recent first."
      />

      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
          <p className="p-6 text-sm text-admin-faint">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="p-6 text-sm text-admin-faint">No activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-admin-line-soft text-xs uppercase tracking-wide text-admin-faint">
              <tr>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Actor</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Entity</th>
                <th className="px-5 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-admin-line-soft align-top last:border-0 hover:bg-admin-surface-soft">
                  <td className="whitespace-nowrap px-5 py-3 text-admin-muted">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3 text-admin-ink">{log.actorLabel}</td>
                  <td className="px-5 py-3 font-mono text-xs text-admin-primary-ink">{log.action}</td>
                  <td className="px-5 py-3 text-admin-muted">
                    {log.entityType} · {log.entityId.slice(0, 10)}…
                  </td>
                  <td className="max-w-sm truncate px-5 py-3 text-admin-muted">
                    {log.detail ? JSON.stringify(log.detail) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
