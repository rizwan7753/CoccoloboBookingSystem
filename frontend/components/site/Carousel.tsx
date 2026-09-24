"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Horizontal scroll-snap carousel with prev/next buttons and a "1 / N"
 * counter — ported from coccolobo-beach-club.html's excursion carousel
 * script. `items` are rendered as <li> inside the scroll track.
 */
export default function Carousel({ items, label }: { items: React.ReactNode[]; label: string }) {
  const trackRef = useRef<HTMLUListElement | null>(null);
  const [count, setCount] = useState(`1 / ${items.length}`);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(items.length <= 1);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function step() {
      const first = track!.children[0] as HTMLElement | undefined;
      return (first?.getBoundingClientRect().width ?? 0) + 18; // card + gap
    }
    function sync() {
      const s = step();
      const i = s ? Math.round(track!.scrollLeft / s) + 1 : 1;
      setCount(`${Math.min(Math.max(i, 1), items.length)} / ${items.length}`);
      setAtStart(track!.scrollLeft < 8);
      setAtEnd(track!.scrollLeft > track!.scrollWidth - track!.clientWidth - 8);
    }

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    };
    track.addEventListener("scroll", onScroll);
    window.addEventListener("resize", sync);
    sync();

    (track as unknown as { __reduced?: boolean }).__reduced = reduced;

    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", sync);
      cancelAnimationFrame(raf);
    };
  }, [items.length]);

  function nudge(dir: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const first = track.children[0] as HTMLElement | undefined;
    const step = (first?.getBoundingClientRect().width ?? 0) + 18;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: dir * step, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <div className="car">
      <ul className="car-track" aria-label={label} ref={trackRef}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      {items.length > 1 && (
        <div className="car-controls" style={{ justifyContent: "flex-end" }}>
          <button className="car-btn" aria-label={`Previous ${label}`} disabled={atStart} onClick={() => nudge(-1)}>
            <svg aria-hidden="true">
              <use href="#ic-arrow-l" />
            </svg>
          </button>
          <span className="car-count">{count}</span>
          <button className="car-btn" aria-label={`Next ${label}`} disabled={atEnd} onClick={() => nudge(1)}>
            <svg aria-hidden="true">
              <use href="#ic-arrow-r" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
