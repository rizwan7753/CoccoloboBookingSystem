import { notFound } from "next/navigation";
import Link from "next/link";
import { rentalApi } from "@/lib/rentalApi";
import { settingsApi } from "@/lib/settingsApi";
import { mediaUrl } from "@/lib/media";
import RentalBookingWidget from "@/components/RentalBookingWidget";
import Gallery from "@/components/site/Gallery";
import ItemReviews from "@/components/site/ItemReviews";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [item, { name }] = await Promise.all([rentalApi.getRental(slug).catch(() => null), settingsApi.getSettings()]);
  if (!item) return {};
  return {
    title: `${item.name} — ${name}`,
    description: item.description.slice(0, 155),
  };
}

export default async function RentalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await rentalApi.getRental(slug).catch(() => null);
  if (!item) notFound();

  return (
    <main className="site-body">
      <div
        className="relative h-48 overflow-hidden bg-gradient-to-br from-abyss via-deep to-aqua bg-cover bg-center sm:h-64"
        style={item.headerImageUrl ? { backgroundImage: `url(${mediaUrl(item.headerImageUrl)})` } : undefined}
      >
        {item.headerImageUrl && <div className="pointer-events-none absolute inset-0 bg-black/35" />}
        <div className="wrap relative flex h-full flex-col justify-end pb-8">
          <Link href="/beach-chairs" className="mb-3 flex w-fit items-center gap-1 text-sm text-shallow hover:text-foam">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All rentals
          </Link>
          <h1 className="animate-fade-in-up font-display max-w-4xl text-3xl text-foam sm:text-4xl">{item.name}</h1>
          <p className="animate-fade-in-up mt-2 text-sm text-foam/80" style={{ animationDelay: "80ms" }}>
            {Math.round(item.durationMinutes / 60)}-hour sessions
          </p>
        </div>
      </div>

      <div className="wrap py-12">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="whitespace-pre-line leading-relaxed opacity-85">{item.description}</p>

            {item.images && item.images.length > 0 && (
              <div className="mt-6">
                <Gallery images={item.images} alt={item.name} />
              </div>
            )}

            <div className="mt-8 flex gap-3 rounded-xl border border-rule bg-foam p-4">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-aqua-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-sm text-abyss">
                <p className="font-semibold">Same-day booking available.</p>
                <p className="mt-0.5">Pick any available spot for today, or reserve ahead for a future date.</p>
              </div>
            </div>

            <ItemReviews itemType="RENTAL" itemId={item.id} itemTitle={item.name} />
          </div>

          <div className="lg:col-span-1">
            <RentalBookingWidget item={item} />
          </div>
        </div>
      </div>
    </main>
  );
}
