import { cardClass } from "./ui";

const ICONS: Record<string, React.ReactNode> = {
  calendar: <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />,
  users: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />,
  revenue: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />,
  compass: <><circle cx="12" cy="12" r="10" /><path d="m16 8-2 6-6 2 2-6 6-2Z" strokeLinecap="round" strokeLinejoin="round" /></>,
};

export default function StatCard({
  label,
  value,
  icon,
  accent = "teal",
}: {
  label: string;
  value: string;
  icon: keyof typeof ICONS;
  accent?: "teal" | "amber" | "sky";
}) {
  const accentClass = { teal: "bg-teal-50 text-teal-700", amber: "bg-amber-50 text-amber-700", sky: "bg-sky-50 text-sky-700" }[accent];

  return (
    <div className={`${cardClass} p-5`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-stone-500">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentClass}`}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            {ICONS[icon]}
          </svg>
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-stone-900">{value}</p>
    </div>
  );
}
