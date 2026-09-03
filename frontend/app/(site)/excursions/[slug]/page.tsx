import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { settingsApi } from "@/lib/settingsApi";
import { mediaUrl } from "@/lib/media";
import BookingWidget from "@/components/BookingWidget";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [excursion, { name }] = await Promise.all([api.getExcursion(slug).catch(() => null), settingsApi.getSettings()]);
  if (!excursion) return {};
  return {
    title: `${excursion.title} — ${name}`,
    description: excursion.description.slice(0, 155),
    openGraph: {
      title: excursion.title,
      description: excursion.description.slice(0, 155),
      images: excursion.images?.[0] ? [excursion.images[0]] : undefined,
    },
  };
}

export default async function ExcursionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const excursion = await api.getExcursion(slug).catch(() => null);
  if (!excursion) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: excursion.title,
    description: excursion.description,
    offers: {
      "@type": "Offer",
      price: excursion.priceAdult,
      priceCurrency: "USD",
    },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div
        className="relative h-56 overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-700 bg-cover bg-center sm:h-72"
        style={excursion.headerImageUrl ? { backgroundImage: `url(${mediaUrl(excursion.headerImageUrl)})` } : undefined}
      >
        {excursion.headerImageUrl && <div className="pointer-events-none absolute inset-0 bg-black/35" />}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 75% 30%, white 0, transparent 45%)" }}
        />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-8 sm:px-6">
          <Link href="/" className="mb-3 flex w-fit items-center gap-1 text-sm text-teal-100 hover:text-white">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All excursions
          </Link>
          <h1 className="animate-fade-in-up font-display max-w-2xl text-3xl font-bold text-white sm:text-4xl">{excursion.title}</h1>
          <p className="animate-fade-in-up mt-2 text-sm text-teal-100" style={{ animationDelay: "80ms" }}>
            {excursion.durationMinutes} minutes
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="whitespace-pre-line text-stone-600 leading-relaxed">{excursion.description}</p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {excursion.included && (
                <InfoBlock icon="check" title="What's included">
                  {excursion.included}
                </InfoBlock>
              )}
              {excursion.whatToBring && (
                <InfoBlock icon="bag" title="What to bring">
                  {excursion.whatToBring}
                </InfoBlock>
              )}
              {excursion.meetingPoint && (
                <InfoBlock icon="pin" title="Meeting point">
                  {excursion.meetingPoint}
                  {excursion.mapUrl && (
                    <a
                      href={excursion.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-teal-700 underline underline-offset-2"
                    >
                      View on map
                    </a>
                  )}
                </InfoBlock>
              )}
            </div>

            <div className="mt-8 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-sm text-amber-900">
                <p className="font-semibold">Advance booking required — walk-ins are not accepted.</p>
                <p className="mt-0.5">Bookings must be made by {excursion.cutoffTime} the evening before the excursion date.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <BookingWidget excursion={excursion} />
          </div>
        </div>
      </div>
    </main>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  check: <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />,
  bag: <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4M3 6h18M16 10a4 4 0 0 1-8 0" strokeLinecap="round" strokeLinejoin="round" />,
  pin: <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" strokeLinecap="round" strokeLinejoin="round" />,
};

function InfoBlock({ icon, title, children }: { icon: keyof typeof ICONS; title: string; children: React.ReactNode }) {
  return (
    <div className="animate-fade-in-up rounded-xl border border-stone-200 p-4 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-stone-200/60">
      <div className="flex items-center gap-2 text-stone-900">
        <svg className="h-4 w-4 text-teal-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          {ICONS[icon]}
        </svg>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <p className="mt-2 whitespace-pre-line text-sm text-stone-600">{children}</p>
    </div>
  );
}
