import { settingsApi } from "@/lib/settingsApi";

export default async function Footer() {
  const { name } = await settingsApi.getSettings();

  return (
    <footer className="mt-24 border-t border-stone-200 bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg font-bold text-teal-800">{name}</p>
            <p className="mt-1 text-sm text-stone-500">Advance booking required — walk-ins are not accepted.</p>
          </div>
          <p className="text-xs text-stone-400">© {new Date().getFullYear()} {name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
