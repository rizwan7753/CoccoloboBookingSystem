// Shared SVG icon sprite for the guest site, ported from
// coccolobo-beach-club.html. Mounted once in the root layout; every icon is
// referenced elsewhere as <svg><use href="#ic-x" /></svg> so the markup
// never has to be duplicated per component.
export default function IconSprite() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <symbol id="ic-daypass" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M26 66h48" /><path d="M34 66l6-20h20l6 20" /><path d="M40 46 34 30h32l-6 16" /></symbol>
      <symbol id="ic-sushi" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><circle cx="38" cy="50" r="13" /><circle cx="38" cy="50" r="4.5" /><circle cx="64" cy="42" r="10" /><circle cx="64" cy="42" r="3.5" /><path d="M24 68h52" /></symbol>
      <symbol id="ic-foodie" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M28 48h44a22 22 0 0 1-22 22 22 22 0 0 1-22-22Z" /><path d="M22 48h56" /><path d="M42 34c0-5 5-5 5-10M56 34c0-5 5-5 5-10" /></symbol>
      <symbol id="ic-wine" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M36 26h28l-3 18a11 11 0 0 1-22 0Z" /><path d="M50 55v17" /><path d="M39 74h22" /><path d="M37.4 38h25.2" /></symbol>
      <symbol id="ic-vip" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M24 54h52a26 26 0 0 1-52 0Z" /><path d="M50 54V38" /><circle cx="50" cy="32" r="5" /><path d="M20 70h60" /></symbol>
      <symbol id="ic-cabana" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M22 46 50 26l28 20" /><path d="M30 46v26M70 46v26" /><path d="M22 72h56" /><path d="M30 54h40" /></symbol>
      <symbol id="ic-cabana-plus" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M20 42 46 24l26 18" /><path d="M27 42v22M65 42v10" /><path d="M20 64h45" /><circle cx="70" cy="66" r="11" /><path d="M70 60v12M64 66h12" /></symbol>
      <symbol id="ic-chair" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M26 70h48" /><path d="M32 70 40 40h26l-4 30" /><path d="M40 40 34 28" /><path d="M38 56h24" /></symbol>
      <symbol id="ic-umbrella" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M20 46a30 30 0 0 1 60 0Z" /><path d="M50 46v26" /><path d="M50 72c0 5 6 5 6 0" /><path d="M35 46c0-16 7-30 15-30s15 14 15 30" /></symbol>
      <symbol id="ic-moon" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><circle cx="50" cy="40" r="17" /><path d="M20 68h60M26 78h48" opacity={0.8} /><circle cx="44" cy="35" r="3" opacity={0.7} /><circle cx="56" cy="45" r="2.5" opacity={0.7} /></symbol>
      <symbol id="ic-lobster" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M42 30c-10 8-14 22-10 34 3 10 12 16 22 14" /><path d="M42 44h18M40 56h20M42 68h16" /><path d="M42 30c-6-6-14-6-18-2M42 30c-2-8 2-14 8-16" /></symbol>
      <symbol id="ic-fish" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M22 50c10-14 26-20 40-20s20 12 20 20-6 20-20 20-30-6-40-20Z" /><circle cx="68" cy="44" r="3" fill="currentColor" stroke="none" /><path d="M22 50c-4-8-4-16 0-22M22 50c-4 8-4 16 0 22" /></symbol>
      <symbol id="ic-jerk" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M40 68c-8-4-12-14-8-24 4-12 18-18 28-14 8 3 10 12 6 20" /><path d="M40 68l-10 10M66 50l10-8" /><path d="M46 34c0-6 4-10 10-10" /></symbol>
      <symbol id="ic-pizza" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M50 22 22 74h56Z" /><path d="M28 64h44" /><circle cx="44" cy="56" r="3.5" /><circle cx="58" cy="54" r="3.5" /><circle cx="50" cy="40" r="3.5" /></symbol>
      <symbol id="ic-salad" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M24 50h52a26 26 0 0 1-52 0Z" /><circle cx="40" cy="38" r="7" /><circle cx="58" cy="36" r="8" /><circle cx="50" cy="44" r="5" /><path d="M20 68h60" /></symbol>
      <symbol id="ic-catch" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><circle cx="50" cy="50" r="24" /><path d="M30 62c8-10 32-10 40 0" /><path d="M38 42c4-4 8-4 12 0s8 4 12 0" /></symbol>
      <symbol id="ic-bar" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M26 28h48L52 54v18" /><path d="M38 72h28" /><path d="M33 38h38" /></symbol>
      <symbol id="ic-group" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><circle cx="38" cy="38" r="10" /><circle cx="64" cy="42" r="8" /><path d="M20 70c0-11 8-18 18-18s18 7 18 18" /><path d="M60 70c0-9 5-14 12-14s10 5 10 14" /></symbol>
      <symbol id="ic-clock" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><circle cx="50" cy="50" r="26" /><path d="M50 32v19l13 8" /></symbol>
      <symbol id="ic-card" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><rect x="20" y="32" width="60" height="38" rx="7" /><path d="M20 46h60" /><path d="M32 60h12" /></symbol>
      <symbol id="ic-kids" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><circle cx="50" cy="34" r="11" /><path d="M28 74c0-13 10-22 22-22s22 9 22 22" /><path d="M42 32c3 3 13 3 16 0" /></symbol>
      <symbol id="ic-wave" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M16 44c8-6 14-6 22 0s14 6 22 0 14-6 22 0" /><path d="M16 58c8-6 14-6 22 0s14 6 22 0 14-6 22 0" /><path d="M16 72c8-6 14-6 22 0s14 6 22 0 14-6 22 0" /></symbol>
      <symbol id="ic-star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95Z" /></symbol>
      <symbol id="ic-leaf" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M50 78V38" /><path d="M50 44c-14-12-28-8-32 2-4 11 6 22 18 22 9 0 15-6 14-16Z" /><path d="M50 56c14-12 28-8 32 2 4 11-6 22-18 22-9 0-15-6-14-16Z" /><circle cx="52" cy="28" r="5" /><circle cx="44" cy="18" r="4" /></symbol>
      <symbol id="ic-sun" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><circle cx="50" cy="50" r="14" /><path d="M50 22v-8M50 86v-8M22 50h-8M86 50h-8M30 30l-6-6M76 76l-6-6M30 70l-6 6M76 24l-6 6" /></symbol>
      <symbol id="ic-starfish" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M50 22 57.6 41.5 78.5 42.7 62.4 56 67.6 76.3 50 65 32.4 76.3 37.6 56 21.5 42.7 42.4 41.5Z" /></symbol>
      <symbol id="ic-shell" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M50 72 26 46a26 26 0 0 1 48 0Z" /><path d="M50 72 37 36M50 72V32M50 72l13-36" /><path d="M43 72h14v6H43Z" /></symbol>
      <symbol id="ic-palm" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round"><path d="M50 80c-2-14 0-28 6-40" /><path d="M56 40c-8-8-20-8-28-2M56 40c8-8 20-8 28-2M56 40c-4-10-12-16-22-16M56 40c4-10 12-16 22-16" /><path d="M36 80h30" /></symbol>
      <symbol id="ic-arrow-l" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></symbol>
      <symbol id="ic-arrow-r" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></symbol>
    </svg>
  );
}
