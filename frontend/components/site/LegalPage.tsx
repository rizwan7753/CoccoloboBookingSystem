import Link from "next/link";

export const LEGAL_CONTACT_EMAIL = "info@coccolobobeachclub.com";
export const LEGAL_LAST_UPDATED = "3 October 2026";

export const LEGAL_PAGES = [
  { href: "/privacy-policy", title: "Privacy Policy" },
  { href: "/terms", title: "Terms & Conditions" },
  { href: "/cancellation-policy", title: "Cancellation & Refund Policy" },
  { href: "/cookie-policy", title: "Cookie Policy" },
];

/** Shared shell for the legal pages: banner, last-updated date, the document
 *  body (styled by `.legal` in globals.css), and links to the other documents. */
export default function LegalPage({ title, current, children }: { title: string; current: string; children: React.ReactNode }) {
  return (
    <main className="site-body">
      <section className="relative overflow-hidden bg-gradient-to-br from-abyss via-deep to-abyss">
        <div className="wrap relative py-14 sm:py-16">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-widest text-shallow">
            Legal
          </span>
          <h1 className="font-display mt-4 max-w-4xl text-3xl text-foam sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-foam/75">Last updated {LEGAL_LAST_UPDATED}</p>
        </div>
      </section>

      <div className="wrap grid gap-10 py-12 lg:grid-cols-[1fr_16rem]">
        <article className="legal max-w-3xl">{children}</article>

        <aside className="lg:pt-1">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest opacity-60">Legal documents</p>
          <ul className="flex flex-col gap-1.5 text-sm">
            {LEGAL_PAGES.map((page) => (
              <li key={page.href}>
                {page.href === current ? (
                  <span className="font-semibold text-abyss">{page.title}</span>
                ) : (
                  <Link href={page.href} className="text-coral-ink underline-offset-2 hover:underline">
                    {page.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
