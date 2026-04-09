const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

/**
 * Wraps an image URL through Cloudinary's fetch mode.
 * Cloudinary downloads the original once, caches it on their CDN,
 * and serves optimised formats (WebP/AVIF) automatically.
 */
export function cloudinaryFetch(
  url: string,
  transforms = 'f_auto,q_auto',
): string {
  if (!CLOUD_NAME || !url) return url
  // Don't double-wrap
  if (url.includes('res.cloudinary.com')) return url
  // Only proxy absolute URLs
  if (!url.startsWith('http')) return url
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${transforms}/${encodeURIComponent(url)}`
}
