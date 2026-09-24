"use client";

import { useEffect, useRef } from "react";

/**
 * Wraps a section/card so it fades + rises into view on scroll, staggered
 * like a wave — ported from coccolobo-beach-club.html's IntersectionObserver
 * script. Respects prefers-reduced-motion (shows content immediately).
 */
export default function ScrollReveal({
  children,
  as: Tag = "div",
  className,
  delay = 0,
  ...rest
}: {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  delay?: number;
  [key: string]: unknown;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          el.style.setProperty("--d", `${delay}ms`);
          el.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  const Component = Tag as React.ElementType;
  return (
    <Component ref={ref} data-reveal className={className} {...rest}>
      {children}
    </Component>
  );
}
