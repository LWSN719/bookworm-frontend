// The 6 required genres (README > Genre filtering). `slug` is the /genre/:slug
// route param. Mapping each slug to an actual Google Books query is Stage 3 work
// (the Edge Function) — this file is routing/display data only.
export const GENRES = [
  { slug: 'adventure', label: 'Adventure' },
  { slug: 'technology', label: 'Technology' },
  { slug: 'horror', label: 'Horror' },
  { slug: 'sci-fi', label: 'Sci-Fi' },
  { slug: 'fiction', label: 'Fiction' },
  { slug: 'non-fiction', label: 'Non-Fiction' },
]

export function genreLabel(slug) {
  return GENRES.find((g) => g.slug === slug)?.label ?? slug
}
