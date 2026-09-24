import Link from "next/link";

// Covers every not-found() call within the guest site (invalid excursion/
// chair/event/menu slug, or any other unmatched path under this layout) —
// Header/Footer still render since this lives inside app/(site)/layout.tsx.
export default function SiteNotFound() {
  return (
    <main className="site-body mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <p className="kicker">404</p>
      <h1 className="font-display mt-2 text-3xl text-abyss">We couldn&apos;t find that page</h1>
      <p className="mt-3 opacity-70">
        The link may be out of date, or the item may no longer be available. Try browsing from one of the pages below instead.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn">
          Back to home
        </Link>
        <Link href="/excursions" className="btn btn-ghost">
          Browse excursions
        </Link>
      </div>
    </main>
  );
}
