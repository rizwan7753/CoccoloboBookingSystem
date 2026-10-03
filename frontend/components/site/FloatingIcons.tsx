"use client";

import { useEffect, useRef } from "react";

type FloatIcon = {
  icon: string; // sprite id from IconSprite.tsx
  left: number; // % of the section width
  top: number; // % of the section height
  size: number; // rem
  depth: number; // movement multiplier — higher feels closer
  rotate: number; // resting angle, degrees
};

const BEACH_ICONS: FloatIcon[] = [
  { icon: "ic-umbrella", left: 4, top: 10, size: 7, depth: 1, rotate: -12 },
  { icon: "ic-sun", left: 84, top: 6, size: 8, depth: 0.6, rotate: 0 },
  { icon: "ic-wave", left: 68, top: 28, size: 6.5, depth: 1.4, rotate: 0 },
  { icon: "ic-starfish", left: 11, top: 60, size: 5, depth: 1.2, rotate: 18 },
  { icon: "ic-shell", left: 89, top: 52, size: 5.2, depth: 0.9, rotate: -20 },
  { icon: "ic-chair", left: 45, top: 4, size: 5.5, depth: 0.8, rotate: 6 },
  { icon: "ic-palm", left: 1, top: 72, size: 8.5, depth: 0.5, rotate: -4 },
  { icon: "ic-fish", left: 60, top: 80, size: 5, depth: 1.3, rotate: 10 },
  { icon: "ic-leaf", left: 30, top: 38, size: 4.2, depth: 1.5, rotate: -30 },
  { icon: "ic-wave", left: 22, top: 82, size: 5.8, depth: 0.7, rotate: 0 },
  { icon: "ic-umbrella", left: 78, top: 72, size: 6, depth: 1.1, rotate: 14 },
  { icon: "ic-starfish", left: 52, top: 50, size: 4, depth: 1.6, rotate: -8 },
];

/**
 * Decorative beach icons scattered behind a section's content. They drift
 * with the mouse and with scrolling, each at its own depth so they move at
 * different speeds (a parallax feel). Transforms are written straight to the
 * DOM in a requestAnimationFrame loop — no React re-renders per frame — and
 * the loop only runs while the section is on screen. Respects
 * prefers-reduced-motion by leaving the icons still.
 *
 * The parent section needs `position: relative; overflow: hidden`, and its
 * content should sit above this layer (z-index 1).
 */
export default function FloatingIcons({ icons = BEACH_ICONS }: { icons?: FloatIcon[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(SVGSVGElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let targetScroll = 0;
    let x = 0;
    let y = 0;
    let scroll = 0;
    let frame = 0;
    let visible = false;

    const onPointerMove = (e: PointerEvent) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    // How far the section's centre is from the viewport centre, in viewports.
    const readScroll = () => {
      const rect = root.getBoundingClientRect();
      targetScroll = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
    };

    const tick = () => {
      if (!visible) {
        frame = 0;
        return;
      }
      // Ease toward the targets so movement glides rather than jumps.
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      scroll += (targetScroll - scroll) * 0.12;
      icons.forEach((icon, i) => {
        const el = itemRefs.current[i];
        if (!el) return;
        const d = icon.depth;
        const tx = x * d * 28;
        const ty = y * d * 20 - scroll * d * 90;
        el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) rotate(${(icon.rotate + x * d * 10).toFixed(2)}deg)`;
      });
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) {
        readScroll();
        frame = requestAnimationFrame(tick);
      }
    });
    observer.observe(root);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", readScroll, { passive: true });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", readScroll);
    };
  }, [icons]);

  return (
    <div ref={rootRef} className="floating-icons" aria-hidden="true">
      {icons.map((icon, i) => (
        <svg
          key={i}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          style={{
            left: `${icon.left}%`,
            top: `${icon.top}%`,
            width: `calc(${icon.size}rem * var(--float-icon-scale, 1))`,
            height: `calc(${icon.size}rem * var(--float-icon-scale, 1))`,
            opacity: 0.08 + icon.depth * 0.04,
            transform: `rotate(${icon.rotate}deg)`,
          }}
        >
          <use href={`#${icon.icon}`} />
        </svg>
      ))}
    </div>
  );
}
