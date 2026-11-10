// Optimized event imagery served from /public/images/events as WebP.
// Fewer photos than events is fine: they repeat deterministically across events.
export const HEROES = [
  'antenna-ohNCIiKVT1g-unsplash.webp',
  'filip-rankovic-grobgaard-TVpMTnvJxlI-unsplash.webp',
  'm-accelerator-yTsy3PYFPtc-unsplash.webp',
  'nicholas-green-nPz8akkUmDI-unsplash.webp',
  'priscilla-du-preez-Q7wGvnbuwj0-unsplash.webp',
];
export const HERO_COUNT = HEROES.length;

// Stable, dependency-free hash → one of the local hero photos (deterministic per event id).
export function heroFor(eventId) {
  let h = 0;
  for (let i = 0; i < eventId.length; i++) h = (h * 31 + eventId.charCodeAt(i)) >>> 0;
  return `/images/events/${HEROES[h % HEROES.length]}`;
}
