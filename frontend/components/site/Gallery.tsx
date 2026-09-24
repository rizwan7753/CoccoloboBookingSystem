"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { mediaUrl } from "@/lib/media";

/** Auto-playing slideshow carousel for an item's extra photos (in addition
 *  to its header/card image). Rendered on excursion, beach-chair, and
 *  restaurant-menu-item detail pages. Clicking a slide opens a full-screen
 *  lightbox, portaled to document.body for the same reason QuickAddToCart's
 *  modal is — a transformed/scroll-clipped ancestor would otherwise trap a
 *  `position: fixed` overlay inside the card instead of covering the
 *  viewport.
 *
 *  `autoplayMs` / `transitionMs` control the pace: how long each slide
 *  holds, and how fast the slide-to-slide animation runs. */
export default function Gallery({
  images,
  alt,
  autoplayMs = 4000,
  transitionMs = 600,
}: {
  images: (string | null | undefined)[];
  alt: string;
  autoplayMs?: number;
  transitionMs?: number;
}) {
  const urls = images.map((img) => mediaUrl(img)).filter((u): u is string => Boolean(u));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused || lightboxOpen || urls.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % urls.length);
    }, autoplayMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, lightboxOpen, urls.length, autoplayMs]);

  if (urls.length === 0) return null;

  const goTo = (i: number) => setIndex((i + urls.length) % urls.length);

  return (
    <div className="mb-6">
      <div
        className="group relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-rule bg-shell"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex h-full"
          style={{
            width: `${urls.length * 100}%`,
            transform: `translateX(-${(index * 100) / urls.length}%)`,
            transition: `transform ${transitionMs}ms ease`,
          }}
        >
          {urls.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="h-full flex-shrink-0 cursor-zoom-in"
              style={{ width: `${100 / urls.length}%` }}
              aria-label={`Open ${alt} photo ${i + 1} full screen`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`${alt} photo ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>

        {urls.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-abyss/50 text-foam opacity-0 transition hover:bg-abyss/70 group-hover:opacity-100"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-abyss/50 text-foam opacity-0 transition hover:bg-abyss/70 group-hover:opacity-100"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {urls.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-foam" : "w-1.5 bg-foam/50 hover:bg-foam/80"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {lightboxOpen &&
        createPortal(
          <Lightbox
            urls={urls}
            index={index}
            alt={alt}
            transitionMs={transitionMs}
            onClose={() => setLightboxOpen(false)}
            onIndexChange={setIndex}
          />,
          document.body
        )}
    </div>
  );
}

function Lightbox({
  urls,
  index,
  alt,
  transitionMs,
  onClose,
  onIndexChange,
}: {
  urls: string[];
  index: number;
  alt: string;
  transitionMs: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const prev = () => onIndexChange((index - 1 + urls.length) % urls.length);
  const next = () => onIndexChange((index + 1) % urls.length);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-abyss/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} — photo ${index + 1} of ${urls.length}`}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-foam hover:bg-white/20"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {urls.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-foam hover:bg-white/20 sm:left-6"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urls[index]}
        alt={`${alt} photo ${index + 1}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
        style={{ transition: `opacity ${transitionMs}ms ease` }}
      />

      {urls.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-foam hover:bg-white/20 sm:right-6"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {urls.length > 1 && (
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-abyss/60 px-3 py-1 text-xs text-foam">
          {index + 1} / {urls.length}
        </span>
      )}
    </div>
  );
}
