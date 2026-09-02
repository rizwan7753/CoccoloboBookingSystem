"use client";

import { inputClass } from "./ui";

export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  return (
    <>
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-500">From</label>
        <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-stone-500">To (optional)</label>
        <input type="date" value={to} onChange={(e) => onToChange(e.target.value)} className={inputClass} />
      </div>
    </>
  );
}
