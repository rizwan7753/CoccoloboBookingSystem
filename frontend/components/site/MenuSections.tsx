import { RestaurantMenuSection } from "@/lib/restaurantApi";

export default function MenuSections({ sections }: { sections: RestaurantMenuSection[] }) {
  return (
    <div className="grid gap-x-16 gap-y-14 sm:grid-cols-2">
      {sections.map((section) => (
        <div key={section.id}>
          {section.subheading && (
            <p className="text-center text-xs font-medium uppercase tracking-[0.25em] text-stone-400">{section.subheading}</p>
          )}
          <h2 className="font-display mt-2 flex items-center justify-center gap-4 text-2xl font-bold text-stone-900 sm:text-3xl">
            <span className="h-px w-8 flex-shrink-0 bg-amber-700/50 sm:w-12" />
            {section.heading}
            <span className="h-px w-8 flex-shrink-0 bg-amber-700/50 sm:w-12" />
          </h2>

          <ul className="mt-8 space-y-6">
            {section.items.map((item) => (
              <li key={item.id}>
                <div className="flex items-baseline gap-3">
                  <span className="whitespace-nowrap text-sm font-semibold uppercase tracking-wide text-stone-900">
                    {item.name}
                  </span>
                  {item.price != null && <span className="flex-1 border-b border-dotted border-amber-700/40" />}
                  {item.price != null && (
                    <span className="whitespace-nowrap font-display text-lg font-semibold tabular-nums text-stone-900">
                      ${item.price}
                    </span>
                  )}
                </div>
                {item.description && <p className="mt-1 text-sm text-stone-500">{item.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
