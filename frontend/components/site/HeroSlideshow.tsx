"use client";

import { useEffect, useRef, useState } from "react";

/** Crossfading, Ken-Burns-zooming background slideshow for the homepage
 *  hero. Client component because it needs an interval timer; the
 *  surrounding hero markup/overlay/text stay in the server-rendered page.
 *
 *  Each slide is a stable wrapper (handles the opacity crossfade — never
 *  remounted, so the fade transition always has a "from" state to animate
 *  from) around an <img> that DOES get remounted (via a changing `key`)
 *  every time its slide becomes active, so the zoom animation restarts
 *  from scratch instead of resuming mid-zoom or snapping back. */
export default function HeroSlideshow({
  photos,
  intervalMs = 6000,
  fadeMs = 1200,
}: {
  photos: string[];
  intervalMs?: number;
  fadeMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const cycles = useRef(photos.map(() => 0));

  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = setInterval(() => {
      // Bump the outgoing image's cycle counter synchronously, inside the
      // same update that advances `index` — so the render that makes it
      // active also gives it a fresh key, remounting it right then and
      // restarting its zoom. Bumping this in a separate effect (running
      // one render later) was the bug: it remounted the *previous* slide
      // instead, leaving the newly-active one stuck on its original,
      // already-finished animation.
      setIndex((i) => {
        const next = (i + 1) % photos.length;
        cycles.current[next] += 1;
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [photos.length, intervalMs]);

  return (
    <>
      {photos.map((src, i) => (
        <div
          key={src}
          className="hero-photo"
          style={{
            opacity: i === index ? 1 : 0,
            transition: `opacity ${fadeMs}ms ease`,
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={cycles.current[i]}
            src={src}
            alt="A view of the Coccolobo Beach Club shoreline"
            fetchPriority={i === 0 ? "high" : "auto"}
            decoding="async"
            className="hero-photo-img"
            style={{ animationDuration: `${intervalMs + fadeMs}ms` }}
          />
        </div>
      ))}
    </>
  );
}
