import Link from "next/link";
import { api } from "@/lib/api";
import { rentalApi } from "@/lib/rentalApi";
import { restaurantApi, RestaurantMenuItem } from "@/lib/restaurantApi";
import { eventApi } from "@/lib/eventApi";
import { settingsApi } from "@/lib/settingsApi";
import { reviewApi } from "@/lib/reviewApi";
import { blogApi } from "@/lib/blogApi";
import { mediaUrl } from "@/lib/media";
import { DISH_PLACEHOLDER_PHOTOS, HERO_PHOTOS, INTRO_PHOTO, pickPhoto } from "@/lib/placeholderPhotos";
import HeroSlideshow from "@/components/site/HeroSlideshow";
import ExcursionCard from "@/components/site/ExcursionCard";
import ChairCard from "@/components/site/ChairCard";
import FloatingIcons from "@/components/site/FloatingIcons";
import EventCard from "@/components/site/EventCard";
import Carousel from "@/components/site/Carousel";
import ScrollReveal from "@/components/site/ScrollReveal";
import BookingTeaser from "@/components/site/BookingTeaser";
import Medal from "@/components/site/Medal";

export const revalidate = 60; // ISR: this content changes rarely

const WHY_TILES = [
  { icon: "ic-bar", kicker: "BAR", title: "Named spirits, not house pours", body: "Johnnie Walker Black, Absolut, Beefeater, Mount Gay, local beers, house wines and rum punch." },
  { icon: "ic-vip", kicker: "SERVICE", title: "Warm Caribbean hospitality", body: "From the moment you arrive, our friendly Coccolobo team is here to make your beach day relaxed, easy and memorable." },
  { icon: "ic-umbrella", kicker: "BOOK EARLY", title: "Secure your spot in paradise", body: "Coccolobo can get busy, so we recommend booking in advance. Walk-ins are always welcome, subject to availability." },
  { icon: "ic-group", kicker: "GROUPS", title: "Bringing a big group? No problem!", body: "Just book in advance or give us a call, and we’ll arrange all the details to make your day at Coccolobo easy and enjoyable." },
  { icon: "ic-chair", kicker: "SAME DAY", title: "Beach time, your way", body: "Walk-ins are welcome subject to availability, but advance reservations are recommended." },
  { icon: "ic-kids", kicker: "FAMILIES", title: "Fun for the whole family", body: "Swim, relax, enjoy great food and make memories together — Coccolobo is a beach day the whole family can enjoy." },
  { icon: "ic-lobster", kicker: "COCO GRILL", title: "Fresh from Coco Grill", body: "Enjoy lobster, chicken, ribs and fish, cooked to your liking in plain sight while you soak up the relaxed Caribbean atmosphere." },
  { icon: "ic-daypass", kicker: "FULL DAYS", title: "Want to spend the whole day at Coccolobo? No problem!", body: "Book your beach chair, umbrella and lunch package today, then settle in, relax and enjoy your day in paradise." },
];

// Excursions are hidden from the homepage (their section and the hero
// booking tab) until Stingray Haven launches and replaces them there.
// The excursion pages themselves stay live. Set to true to bring them back.
const SHOW_EXCURSIONS = false;

function formatPostMeta(post: { publishedAt?: string | null; readMinutes?: number | null }): string {
  const dateLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : "";
  const readLabel = post.readMinutes ? `${post.readMinutes} min read` : "";
  return [dateLabel, readLabel].filter(Boolean).join(" · ");
}

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function HomePage() {
  const [excursions, rentals, menus, events, settings, reviews, posts] = await Promise.all([
    api.listExcursions().catch(() => []),
    rentalApi.listRentals().catch(() => []),
    restaurantApi.listMenus().catch(() => []),
    eventApi.listEvents().catch(() => []),
    settingsApi.getSettings(),
    reviewApi.listReviews().catch(() => []),
    blogApi.listPosts().catch(() => []),
  ]);
  const { name } = settings;

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  // The list endpoint doesn't include time slots — fetch each rental's
  // detail so its card can show clear start/end times, same as the full
  // beach-chairs listing page.
  const rentalTimeSlots = await Promise.all(
    rentals.map((item) => rentalApi.getRental(item.slug).then((full) => full.timeSlots).catch(() => undefined))
  );

  // No "featured dish" flag in the schema yet — approximate by taking the
  // first few items found across all menus/sections.
  const dishes: { item: RestaurantMenuItem; menuTitle: string }[] = [];
  for (const menu of menus) {
    for (const section of menu.sections) {
      for (const item of section.items) {
        dishes.push({ item, menuTitle: menu.title });
        if (dishes.length >= 6) break;
      }
      if (dishes.length >= 6) break;
    }
    if (dishes.length >= 6) break;
  }

  return (
    <main id="top" className="site-body">
      {/* ================= HERO ================= */}
      <section className="hero">
        <HeroSlideshow photos={HERO_PHOTOS} />

        <div className="wrap hero-inner">
          <p className="hero-eyebrow">BEACH CHAIRS · COCO GRILL · BEACHFRONT</p>
          <h1 className="font-display" aria-label={`Welcome To ${name}`}>
            <span style={{ animationDelay: ".25s" }} aria-hidden="true">
              Welcome&nbsp;To
            </span>{" "}
            <span style={{ animationDelay: ".42s" }} aria-hidden="true">
              {name}
            </span>
          </h1>
          <p className="hero-sub">
            Set on beautiful South Friars Bay, {name} is your place to relax, dine and enjoy the Caribbean.
          </p>
        </div>

        <div className="tide" aria-hidden="true">
          <svg viewBox="0 0 2880 96" preserveAspectRatio="none">
            <path className="fill-sand" d="M0 56c120-26 240-26 360 0s240 26 360 0 240-26 360 0 240 26 360 0 240-26 360 0 240 26 360 0 240-26 360 0 240 26 360 0v40H0Z" />
          </svg>
        </div>
      </section>

      {/* ================= BOOKING TEASER ================= */}
      <section className="booking wrap" aria-label="Check availability">
        <BookingTeaser excursions={excursions} rentals={rentals} events={events} showExcursions={SHOW_EXCURSIONS} />
      </section>

      {/* ================= INTRO ================= */}
      <section className="section wrap grid gap-[clamp(2rem,5vw,4.5rem)] lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <ScrollReveal>
          <h2 className="font-display mb-5 text-[clamp(2rem,1.3rem+3vw,3.6rem)]">Relax on beautiful South Friars Bay</h2>
          <p className="mb-5 max-w-[62ch] text-[1.2rem] leading-[1.55]">
            {name} is located on South Friars Bay, one of St. Kitts&apos; inviting stretches of Caribbean coastline. Arrive to a warm
            welcome from our friendly team and settle into the club&apos;s relaxed, rustic island atmosphere.
          </p>
          <p className="mb-4 max-w-[62ch]">
            Spend your day exactly as you please — relax on the beach, enjoy the Caribbean music, or visit Coco Grill where lobster,
            chicken, ribs and fish are prepared to your liking in full view.
          </p>
          <p className="max-w-[62ch]">
            Beach guests have access to Wi-Fi and restrooms. Food, beverages and umbrellas are available separately. Advance
            reservations are recommended to avoid disappointment, particularly on busy cruise-ship days, although walk-ins are
            welcome subject to availability.
          </p>
        </ScrollReveal>

        <ScrollReveal as="aside" delay={80}>
          <div className="intro-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={INTRO_PHOTO} alt="Aerial view of a curving white sand beach" loading="lazy" decoding="async" />
          </div>
        </ScrollReveal>
      </section>

      {/* ================= WHY ================= */}
      <section
        className="section parallax why-parallax"
        id="why"
        style={{ "--parallax-image": "url(/hero/P1317200.jpg)" } as React.CSSProperties}
      >
        <div className="wrap">
          <ScrollReveal as="div" className="sec-head">
            <p className="kicker">WHY {name.toUpperCase()}</p>
            <h2 className="font-display">Enjoy the Coccolobo Beach Experience</h2>
          </ScrollReveal>

          <div className="tiles">
            {WHY_TILES.map((tile, i) => (
              <ScrollReveal key={tile.title} as="article" className="tile" delay={Math.min(i * 60, 300)}>
                <Medal icon={tile.icon} size="3rem" />
                <p className="kicker">{tile.kicker}</p>
                <h3 className="font-display">{tile.title}</h3>
                <p>{tile.body}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= EXCURSIONS CAROUSEL ================= */}
      {SHOW_EXCURSIONS && (
      <section className="section" id="excursions">
        <div className="wrap">
          <ScrollReveal as="div" className="sec-head sec-head-row">
            <div>
              <p className="kicker">EXCURSIONS &amp; ACTIVITIES</p>
              <h2 className="font-display">Ways to spend the day</h2>
              <p>Each has its own duration, group minimum and booking cut-off. All of them close the evening before.</p>
            </div>
            <Link href="/excursions" className="btn btn-ghost">
              Browse all excursions
            </Link>
          </ScrollReveal>

          {excursions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-rule py-16 text-center opacity-60">
              No excursions available right now. Check back soon.
            </div>
          ) : (
            <Carousel label="excursions" items={excursions.map((ex) => <ExcursionCard key={ex.id} excursion={ex} />)} />
          )}
        </div>
      </section>
      )}

      {/* ================= CHAIRS ================= */}
      <section className="section bg-sand relative overflow-hidden" id="chairs">
        <FloatingIcons />
        <div className="wrap relative z-[1]">
          <ScrollReveal as="div" className="sec-head">
            <p className="kicker">BEACH DAY PACKAGE</p>
            <h2 className="font-display">Book Your Beach Chair, Umbrella &amp; Lunch</h2>
            <p>
              Everything you need for a relaxing day at Coccolobo. Book your beach chair, umbrella and lunch package in advance, then
              simply arrive, settle in and enjoy the Caribbean.
            </p>
          </ScrollReveal>

          {rentals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-rule py-16 text-center opacity-60">
              No beach chairs available right now.
            </div>
          ) : (
            <div className="chair-grid">
              {rentals.map((item, i) => (
                <ScrollReveal key={item.id} as="div" delay={Math.min(i * 60, 300)}>
                  <ChairCard item={item} timeSlots={rentalTimeSlots[i]} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= COCO GRILL ================= */}
      <section
        className="section kitchen parallax"
        id="coco-grill"
        style={{ "--parallax-image": "url(/hero/P1316894.jpg)" } as React.CSSProperties}
      >
        <div className="wrap">
          <ScrollReveal as="div" className="sec-head">
            <p className="kicker">COCO GRILL</p>
            <h2 className="font-display">Fresh Caribbean cooking from Coco Grill, St. Kitts.</h2>
            <p>
              Enjoy lobster, chicken, ribs and fish prepared to your liking in plain sight, with sweet Caribbean music and the laid-back
              atmosphere of South Friars Bay in the background.
            </p>
          </ScrollReveal>

          {menus.length > 0 && (
            <ScrollReveal as="nav" className="menu-links" delay={60}>
              {menus.map((m) => (
                <Link key={m.id} href={`/coco-grill/${m.slug}`}>
                  {m.title}
                </Link>
              ))}
            </ScrollReveal>
          )}

          {dishes.length > 0 && (
            <ul className="dishes">
              {dishes.map(({ item, menuTitle }, i) => (
                <ScrollReveal key={item.id} as="li" className="dish" delay={Math.min(i * 60, 300)}>
                  <Medal photo={pickPhoto(DISH_PLACEHOLDER_PHOTOS, item.id)} alt={item.name} size="3.2rem" />
                  <div>
                    <h3 className="font-display">
                      {item.name} <span>{item.price ? `$${item.price}` : menuTitle}</span>
                    </h3>
                    {item.description && <p>{item.description}</p>}
                  </div>
                </ScrollReveal>
              ))}
            </ul>
          )}

          <Link href="/coco-grill" className="btn btn-light mt-10 inline-block">
            See all menus
          </Link>
        </div>
      </section>

      {/* ================= EVENTS ================= */}
      <section className="section bg-foam" id="events">
        <div className="wrap">
          <ScrollReveal as="div" className="sec-head">
            <p className="kicker">ON THE BEACH THIS SEASON</p>
            <h2 className="font-display">Parties, live music and one-off nights</h2>
            <p>Tickets stay on sale right up to the event.</p>
          </ScrollReveal>

          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-rule py-16 text-center opacity-60">
              No events on sale right now. Check back soon.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {events.map((event, i) => (
                <ScrollReveal key={event.id} delay={Math.min(i * 60, 300)}>
                  <EventCard event={event} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= REVIEWS ================= */}
      <section className="section bg-sand" id="reviews">
        <div className="wrap">
          <ScrollReveal as="div" className="sec-head">
            <p className="kicker">WHAT GUESTS SAY</p>
            <h2 className="font-display">From people who booked ahead and came anyway</h2>
          </ScrollReveal>

          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-rule py-16 text-center opacity-60">
              No reviews published yet.
            </div>
          ) : (
            <>
              <ScrollReveal as="div" className="rev-summary" delay={60}>
                <p className="rev-score">
                  {avgRating.toFixed(1)}
                  <small>out of 5</small>
                </p>
                <div className="stars" role="img" aria-label={`Rated ${avgRating.toFixed(1)} out of 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} aria-hidden="true">
                      <use href="#ic-star" />
                    </svg>
                  ))}
                </div>
                <div className="rev-summary-text">
                  <strong>
                    Based on {reviews.length} guest review{reviews.length === 1 ? "" : "s"}
                  </strong>
                  <p>Collected from guests who completed a booking.</p>
                </div>
              </ScrollReveal>

              <div className="rev-grid">
                {reviews.map((r, i) => (
                  <ScrollReveal key={r.id} as="article" className="review" delay={Math.min(i * 60, 300)}>
                    <div className="stars" role="img" aria-label={`${r.rating} out of 5`}>
                      {Array.from({ length: 5 }).map((_, i2) => (
                        <svg key={i2} className={i2 < r.rating ? "" : "off"} aria-hidden="true">
                          <use href="#ic-star" />
                        </svg>
                      ))}
                    </div>
                    {r.title && <h3 className="font-display">{r.title}</h3>}
                    <blockquote>{r.quote}</blockquote>
                    <footer>
                      <span className="rev-avatar" aria-hidden="true">
                        {r.authorInitials || initialsFrom(r.authorName)}
                      </span>
                      <span className="rev-who">
                        <strong>{r.authorName}</strong>
                        {r.authorMeta && <span>{r.authorMeta}</span>}
                      </span>
                    </footer>
                  </ScrollReveal>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ================= JOURNAL ================= */}
      <section className="section" id="journal">
        <div className="wrap">
          <ScrollReveal as="div" className="sec-head sec-head-row">
            <div>
              <p className="kicker">FROM THE JOURNAL</p>
              <h2 className="font-display">What&apos;s happening on the beach</h2>
              <p>Notes on the season, the kitchen and the island.</p>
            </div>
          </ScrollReveal>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-rule py-16 text-center opacity-60">
              No journal posts published yet.
            </div>
          ) : (
          <div className="post-grid">
            {posts.map((post, i) => (
              <ScrollReveal key={post.id} as="a" href={`/journal/${post.slug}`} className="post" delay={Math.min(i * 60, 300)}>
                <div className="post-visual">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(post.imageUrl) ?? pickPhoto(DISH_PLACEHOLDER_PHOTOS, post.id)} alt="" loading="lazy" decoding="async" />
                </div>
                <div className="post-body">
                  <p className="post-meta">{formatPostMeta(post)}</p>
                  <h3 className="font-display">{post.title}</h3>
                  <p className="excerpt">{post.excerpt}</p>
                  <span className="post-more">Read this story</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* ================= CLOSING CTA ================= */}
      <section className="section cta" id="book">
        <div className="wrap">
          <ScrollReveal as="p" className="kicker">
            <span>READY WHEN YOU ARE</span>
          </ScrollReveal>
          <ScrollReveal as="h2" className="font-display">
            Reserve your day at Coccolobo
          </ScrollReveal>
          <ScrollReveal as="p" delay={60}>
            Advance bookings are recommended to help guarantee your spot, especially on busy cruise-ship days. Walk-ins are
            welcome subject to availability.
          </ScrollReveal>
          <ScrollReveal as="ul" delay={120}>
            <li>
              <svg className="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
                <path d="M4 12.5 9 17.5 20 6.5" />
              </svg>
              Book your beach experience.
            </li>
            <li>
              <svg className="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
                <path d="M4 12.5 9 17.5 20 6.5" />
              </svg>
              Receive your confirmation online.
            </li>
            <li>
              <svg className="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
                <path d="M4 12.5 9 17.5 20 6.5" />
              </svg>
              Immediate Booking Response.
            </li>
          </ScrollReveal>
          <ScrollReveal as="div" className="cta-actions" delay={180}>
            <Link className="btn" href="/excursions">
              Browse Experiences
            </Link>
            <Link className="btn btn-light" href="/find-booking">
              Find my Booking
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
