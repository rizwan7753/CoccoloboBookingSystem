// Placeholder photography — hotlinked from Unsplash under the Unsplash
// License (free for commercial use). These are the same images used in the
// coccolobo-beach-club.html design mockup, standing in for real photography
// of the club until it's uploaded via the admin panel's image fields.
// None of these show the real property — replace before launch.

export const EXCURSION_PLACEHOLDER_PHOTOS = [
  "https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?auto=format&fit=crop&w=760&q=70", // loungers on sand
  "https://images.unsplash.com/photo-1710508876894-59022309c1d9?auto=format&fit=crop&w=760&q=70", // plated small dishes
  "https://images.unsplash.com/photo-1651323018466-b36b7df1d2b1?auto=format&fit=crop&w=760&q=70", // seafood spread
  "https://images.unsplash.com/photo-1679694140422-aecfd3d5dd0b?auto=format&fit=crop&w=760&q=70", // oysters on ice
  "https://images.unsplash.com/photo-1620127682229-33388276e540?auto=format&fit=crop&w=760&q=70", // single lounger + umbrella
  "https://images.unsplash.com/photo-1557434440-d4d48e6578b5?auto=format&fit=crop&w=760&q=70", // shaded loungers
  "https://images.unsplash.com/photo-1758448786233-2051ecd150c8?auto=format&fit=crop&w=760&q=70", // grilled seafood
];

export const CHAIR_PLACEHOLDER_PHOTOS = [
  "https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&w=320&q=70", // blue chairs at water's edge
  "https://images.unsplash.com/photo-1619583331940-53c773ed2e55?auto=format&fit=crop&w=320&q=70", // striped umbrella
];

export const DISH_PLACEHOLDER_PHOTOS = [
  "https://images.unsplash.com/photo-1519351635902-7c60d09cb2ed?auto=format&fit=crop&w=220&q=70", // lobster
  "https://images.unsplash.com/photo-1572776082973-1cb8d1790872?auto=format&fit=crop&w=220&q=70", // seafood
  "https://images.unsplash.com/photo-1698462297918-79ae9314e062?auto=format&fit=crop&w=220&q=70", // mixed dishes
  "https://images.unsplash.com/photo-1565733618599-cb82f14f34ac?auto=format&fit=crop&w=220&q=70", // fried food
  "https://images.unsplash.com/photo-1779333863055-9aaeb540cc4a?auto=format&fit=crop&w=220&q=70", // lobster, shrimp, greens
  "https://images.unsplash.com/photo-1654095221806-4340755b9922?auto=format&fit=crop&w=220&q=70", // composed plate
];

export const EVENT_PLACEHOLDER_PHOTOS = [
  "https://images.unsplash.com/photo-1582300857444-5ddd87c86797?auto=format&fit=crop&w=420&q=70", // sailboats at golden hour
];

// Real property photography for the homepage hero slideshow, served from /public/hero.
export const HERO_PHOTOS = ["/hero/P1316894.jpg", "/hero/P1316907.jpg", "/hero/P1317200.jpg", "/hero/P1317215.jpg"];
export const INTRO_PHOTO = "https://images.unsplash.com/photo-1618064541372-289bdb6f5b7b?auto=format&fit=crop&w=1000&q=70";

/** Deterministic pick from a photo pool, keyed by an id — keeps cards stable across renders instead of random. */
export function pickPhoto(pool: string[], id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}
