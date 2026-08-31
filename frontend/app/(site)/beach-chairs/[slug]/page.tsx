import { notFound } from "next/navigation";
import Link from "next/link";
import { rentalApi } from "@/lib/rentalApi";
import { settingsApi } from "@/lib/settingsApi";
import RentalBookingWidget from "@/components/RentalBookingWidget";

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
    <main>
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-amber-600 via-orange-500 to-amber-500 sm:h-64">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 75% 30%, white 0, transparent 45%)" }}
        />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-8 sm:px-6">
          <Link href="/beach-chairs" className="mb-3 flex w-fit items-center gap-1 text-sm text-amber-50 hover:text-white">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All rentals
          </Link>
          <h1 className="font-display max-w-2xl text-3xl font-bold text-white sm:text-4xl">{item.name}</h1>
          <p className="mt-2 text-sm text-amber-100">{Math.round(item.durationMinutes / 60)}-hour sessions</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="whitespace-pre-line text-stone-600 leading-relaxed">{item.description}</p>

            <div className="mt-8 flex gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-sm text-teal-900">
                <p className="font-semibold">Same-day booking available.</p>
                <p className="mt-0.5">Pick any available spot for today, or reserve ahead for a future date.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <RentalBookingWidget item={item} />
          </div>
        </div>
      </div>
    </main>
  );
}
