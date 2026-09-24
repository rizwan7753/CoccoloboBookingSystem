import { RestaurantMenuSection } from "@/lib/restaurantApi";
import Gallery from "@/components/site/Gallery";

export default function MenuSections({ sections }: { sections: RestaurantMenuSection[] }) {
  return (
    <div className="site-body grid gap-x-16 gap-y-14 sm:grid-cols-2">
      {sections.map((section) => (
        <div key={section.id}>
          {section.subheading && <p className="text-center text-xs font-medium uppercase tracking-[0.25em] opacity-60">{section.subheading}</p>}
          <h2 className="font-display mt-2 flex items-center justify-center gap-4 text-2xl sm:text-3xl">
            <span className="h-px w-8 flex-shrink-0 bg-coral/50 sm:w-12" />
            {section.heading}
            <span className="h-px w-8 flex-shrink-0 bg-coral/50 sm:w-12" />
          </h2>

          <ul className="mt-8 space-y-6">
            {section.items.map((item) => (
              <li key={item.id}>
                <div className="flex items-baseline gap-3">
                  <span className="whitespace-nowrap text-sm font-semibold uppercase tracking-wide">{item.name}</span>
                  {item.price != null && <span className="flex-1 border-b border-dotted border-coral/40" />}
                  {item.price != null && (
                    <span className="font-display whitespace-nowrap text-lg font-semibold tabular-nums text-coral-ink">${item.price}</span>
                  )}
                </div>
                {item.description && <p className="mt-1 text-sm opacity-70">{item.description}</p>}
                {item.images && item.images.length > 0 && (
                  <div className="mt-3">
                    <Gallery images={item.images} alt={item.name} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
