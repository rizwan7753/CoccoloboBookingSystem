/**
 * Shared admin chrome. Every colour here comes from an --admin-* token in
 * globals.css, so the panel can be re-skinned from that one block instead of
 * editing colour utilities across the admin pages.
 */

export const inputClass =
  "w-full rounded-lg border border-admin-line bg-admin-surface px-3 py-2 text-sm text-admin-ink placeholder:text-admin-faint focus:border-admin-primary focus:outline-none focus:ring-1 focus:ring-admin-primary";

/** Aqua carries Deep Ocean text — white on Aqua is only ~1.9:1. */
export const primaryButtonClass =
  "rounded-lg bg-admin-primary px-4 py-2 text-sm font-medium text-admin-on-primary transition hover:bg-admin-primary-lift disabled:cursor-not-allowed disabled:opacity-50";

/** Outlined button for the secondary action beside a primary one. */
export const secondaryButtonClass =
  "rounded-lg border border-admin-line px-4 py-2 text-sm font-medium text-admin-ink-soft transition hover:border-admin-primary hover:text-admin-primary-ink disabled:cursor-not-allowed disabled:opacity-50";

/** Delete / cancel / refund — anything the admin can't easily undo. */
export const dangerButtonClass =
  "rounded-lg border border-admin-danger px-4 py-2 text-sm font-medium text-admin-danger-ink transition hover:bg-admin-danger-tint disabled:cursor-not-allowed disabled:opacity-50";

export const cardClass = "rounded-2xl border border-admin-line-soft bg-admin-surface shadow-sm shadow-admin-line/30";

export const labelClass = "mb-1 block text-sm font-medium text-admin-ink-soft";

export const hintClass = "mt-1 text-xs text-admin-faint";

export const errorTextClass = "text-sm text-admin-danger-ink";

/** Table header row. */
export const theadClass = "bg-admin-surface-soft text-left text-xs font-semibold uppercase tracking-wide text-admin-muted";

export const thClass = "px-4 py-3";

export const tdClass = "px-4 py-3 text-admin-ink-soft";

/** Row divider + hover, applied to <tr>. */
export const trClass = "border-t border-admin-line-soft transition hover:bg-admin-surface-soft";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-admin-success-tint text-admin-success-ink",
  CONFIRMED: "bg-admin-success-tint text-admin-success-ink",
  PAID: "bg-admin-success-tint text-admin-success-ink",
  PUBLISHED: "bg-admin-success-tint text-admin-success-ink",
  DRAFT: "bg-admin-surface-sunk text-admin-muted",
  PENDING: "bg-admin-warning-tint text-admin-warning-ink",
  INACTIVE: "bg-admin-surface-sunk text-admin-muted",
  SOLD_OUT: "bg-admin-danger-tint text-admin-danger-ink",
  CANCELLED: "bg-admin-danger-tint text-admin-danger-ink",
  FAILED: "bg-admin-danger-tint text-admin-danger-ink",
  REFUNDED: "bg-admin-surface-sunk text-admin-muted",
  NEW: "bg-admin-warning-tint text-admin-warning-ink",
  CONTACTED: "bg-admin-info-tint text-admin-info-ink",
  DECLINED: "bg-admin-danger-tint text-admin-danger-ink",
};

export function Badge({ status, children }: { status: string; children?: React.ReactNode }) {
  const style = STATUS_STYLES[status] ?? "bg-admin-surface-sunk text-admin-muted";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {children ?? status.replace(/_/g, " ")}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-admin-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-admin-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
