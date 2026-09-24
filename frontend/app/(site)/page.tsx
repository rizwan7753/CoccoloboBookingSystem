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
import EventCard from "@/components/site/EventCard";
import Carousel from "@/components/site/Carousel";
import ScrollReveal from "@/components/site/ScrollReveal";
import BookingTeaser from "@/components/site/BookingTeaser";
import Medal from "@/components/site/Medal";

export const revalidate = 60; // ISR: this content changes rarely

const WHY_TILES = [
  { icon: "ic-bar", kicker: "OPEN BAR", title: "Named spirits, not house pours", body: "Johnnie Walker Black, Absolut, Beefeater, Mount Gay, local beers, house wines and rum punch on VIP and cabana bookings." },
  { icon: "ic-vip", kicker: "SERVICE", title: "A server who stays with you", body: "VIP and cabana guests get one person looking after the group all day, rather than whoever is nearest." },
  { icon: "ic-card", kicker: "NO DEPOSIT", title: "Hold a booking without paying", body: "Send a request with no card details. We confirm by phone or email, usually within a few hours." },
  { icon: "ic-group", kicker: "GROUPS", title: "Six to eighty guests", body: "The VIP experience scales to eighty. Tastings and classes run from four up to forty." },
  { icon: "ic-wave", kicker: "SAME DAY", title: "Chairs you can book this morning", body: "Excursions need notice. A chair and an umbrella don't — reserve your spot on the day." },
  { icon: "ic-kids", kicker: "FAMILIES", title: "A menu built for children", body: "Mini pizzas, mac and cheese, chicken tenders and fish fingers — a separate menu, not an afterthought." },
  { icon: "ic-catch", kicker: "THE KITCHEN", title: "Kittitian cooking, done properly", body: "Spiny lobster, catch of the day, saltfish pizza and the chef's local dish, changing with what comes in." },
  { icon: "ic-clock", kicker: "FULL DAYS", title: "Six hours, not a rushed slot", body: "Day passes and cabanas run 360 minutes. Long enough to swim, eat, sleep it off and swim again." },
];

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
          <p className="hero-eyebrow">CABANAS · EXCURSIONS · BEACHFRONT DINING</p>
          <h1 className="font-display" aria-label="A day on the water, arranged before you arrive.">
            <span style={{ animationDelay: ".25s" }} aria-hidden="true">
              A&nbsp;day&nbsp;on&nbsp;the&nbsp;water,
            </span>{" "}
            <span style={{ animationDelay: ".42s" }} aria-hidden="true">
              arranged&nbsp;before
            </span>{" "}
            <span style={{ animationDelay: ".58s" }} aria-hidden="true">
              you&nbsp;arrive.
            </span>
          </h1>
          <p className="hero-sub">
            {excursions.length || 7} excursions, {rentals.length ? "chairs" : "two cabanas"} and a kitchen that cooks Kittitian — all on
            one stretch of St. Kitts sand.
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
        <BookingTeaser excursions={excursions} rentals={rentals} events={events} />
      </section>

      {/* ================= INTRO ================= */}
      <section className="section wrap grid gap-[clamp(2rem,5vw,4.5rem)] lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <ScrollReveal>
          <h2 className="font-display mb-5 text-[clamp(2rem,1.3rem+3vw,3.6rem)]">On one of the quieter stretches of St. Kitts</h2>
          <p className="mb-5 max-w-[62ch] text-[1.2rem] leading-[1.55]">
            {name} takes its name from the sea grape — the low, round-leafed tree that holds the sand together along this shore and
            gives the beach its shade.
          </p>
          <p className="mb-4 max-w-[62ch]">
            The club is built around a simple idea: decide what kind of day you want before you get here, and let us have it ready.
            That might be a chair and an umbrella for four hours. It might be a private cabana with your own server and an open bar.
            It might be an afternoon learning to roll sushi, or tasting your way through Kittitian cooking with a recipe card to take
            home.
          </p>
          <p className="max-w-[62ch]">
            Because every experience is prepared for a set number of guests, excursions close for booking the evening before and
            walk-ins aren&apos;t accepted. Beach chairs are the exception — reserve one on the morning itself if the weather turns
            good.
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
      <section className="section bg-foam" id="why">
        <div className="wrap">
          <ScrollReveal as="div" className="sec-head">
            <p className="kicker">WHY {name.toUpperCase()}</p>
            <h2 className="font-display">What you get, and what you never have to ask for</h2>
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

      {/* ================= CHAIRS ================= */}
      <section className="section bg-sand" id="chairs">
        <div className="wrap">
          <ScrollReveal as="div" className="sec-head">
            <p className="kicker">SAME-DAY BOOKING</p>
            <h2 className="font-display">Beach chairs and loungers</h2>
            <p>Pick your exact spot by the water. The one thing here you can book on the morning itself.</p>
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

      {/* ================= RESTAURANT ================= */}
      <section className="section kitchen" id="restaurant">
        <div className="wrap">
          <ScrollReveal as="div" className="sec-head">
            <p className="kicker">THE RESTAURANT</p>
            <h2 className="font-display">Caribbean cooking, with St. Kitts at the centre</h2>
            <p>Reserve a table and we&apos;ll confirm by phone or email. No payment or card required.</p>
          </ScrollReveal>

          {menus.length > 0 && (
            <ScrollReveal as="nav" className="menu-links" delay={60}>
              {menus.map((m) => (
                <Link key={m.id} href={`/restaurant/${m.slug}`}>
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

          <Link href="/restaurant" className="btn btn-light mt-10 inline-block">
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
            Book before you come
          </ScrollReveal>
          <ScrollReveal as="p" delay={60}>
            Send a request and we&apos;ll come back to you, usually within a few hours.
          </ScrollReveal>
          <ScrollReveal as="ul" delay={120}>
            <li>
              <svg className="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
                <path d="M4 12.5 9 17.5 20 6.5" />
              </svg>
              No payment or card required
            </li>
            <li>
              <svg className="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
                <path d="M4 12.5 9 17.5 20 6.5" />
              </svg>
              Confirmed by phone or email
            </li>
            <li>
              <svg className="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
                <path d="M4 12.5 9 17.5 20 6.5" />
              </svg>
              Usually within a few hours
            </li>
          </ScrollReveal>
          <ScrollReveal as="div" className="cta-actions" delay={180}>
            <Link className="btn" href="/excursions">
              Browse excursions
            </Link>
            <Link className="btn btn-light" href="/find-booking">
              Find my booking
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
