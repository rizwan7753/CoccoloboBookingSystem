import { notFound } from "next/navigation";
import Link from "next/link";
import { restaurantApi } from "@/lib/restaurantApi";
import { settingsApi } from "@/lib/settingsApi";
import { mediaUrl } from "@/lib/media";
import MenuSections from "@/components/site/MenuSections";
import ReservationForm from "@/components/site/ReservationForm";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [menu, { name }] = await Promise.all([restaurantApi.getMenu(slug).catch(() => null), settingsApi.getSettings()]);
  if (!menu) return {};
  return {
    title: `${menu.title} — ${name}`,
    description: (menu.description || menu.sections.map((s) => s.heading).join(", ")).slice(0, 155),
  };
}

export default async function RestaurantMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const menu = await restaurantApi.getMenu(slug).catch(() => null);
  if (!menu) notFound();

  return (
    <main>
      <div
        className="relative h-48 overflow-hidden bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 bg-cover bg-center sm:h-64"
        style={menu.imageUrl ? { backgroundImage: `url(${mediaUrl(menu.imageUrl)})` } : undefined}
      >
        {menu.imageUrl && <div className="pointer-events-none absolute inset-0 bg-black/40" />}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 75% 30%, white 0, transparent 45%)" }}
        />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-8 sm:px-6">
          <Link href="/restaurant" className="mb-3 flex w-fit items-center gap-1 text-sm text-rose-100 hover:text-white">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All menus
          </Link>
          <h1 className="animate-fade-in-up font-display max-w-2xl text-3xl font-bold text-white sm:text-4xl">{menu.title}</h1>
          {menu.timings && (
            <p className="animate-fade-in-up mt-2 flex items-center gap-1.5 text-sm text-rose-100" style={{ animationDelay: "80ms" }}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {menu.timings}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        {menu.description && <p className="mx-auto mb-10 max-w-2xl text-center text-stone-600">{menu.description}</p>}
        {menu.sections.length > 0 ? (
          <MenuSections sections={menu.sections} />
        ) : (
          <p className="text-center text-stone-400">This menu is being updated — check back soon.</p>
        )}

        <div className="mt-16">
          <ReservationForm menuTitle={menu.title} />
        </div>
      </div>
    </main>
  );
}
