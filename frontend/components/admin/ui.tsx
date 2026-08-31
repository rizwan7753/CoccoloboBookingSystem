export const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600";

export const primaryButtonClass =
  "rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50";

export const cardClass = "rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-200/40";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  PAID: "bg-emerald-100 text-emerald-800",
  DRAFT: "bg-stone-100 text-stone-600",
  PENDING: "bg-amber-100 text-amber-800",
  INACTIVE: "bg-stone-100 text-stone-600",
  SOLD_OUT: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-rose-100 text-rose-700",
  FAILED: "bg-rose-100 text-rose-700",
  REFUNDED: "bg-stone-100 text-stone-600",
};

export function Badge({ status, children }: { status: string; children?: React.ReactNode }) {
  const style = STATUS_STYLES[status] ?? "bg-stone-100 text-stone-600";
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
        <h1 className="text-xl font-semibold text-stone-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
