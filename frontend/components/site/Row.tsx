export default function Row({ label, value, bold }: { label: string; value?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between border-b border-rule py-1.5 last:border-0">
      <span className="text-abyss/45">{label}</span>
      <span className={bold ? "font-semibold text-abyss" : "font-medium text-abyss/80"}>{value}</span>
    </div>
  );
}
