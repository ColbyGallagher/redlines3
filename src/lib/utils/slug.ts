import slugify from "slugify"

/**
 * Generate a unique, URL-safe slug from a name and UUID.
 *
 * Format: `{slugified-name}-{first-6-chars-of-uuid}`
 *
 * The short UUID suffix guarantees uniqueness even when two items
 * share identical names.
 *
 * @example
 * generateSlug("Structural Analysis Rev A", "a1b2c3d4-e5f6-...")
 * // => "structural-analysis-rev-a-a1b2c3"
 */
export function generateSlug(name: string, uuid: string, fallback: string = "item"): string {
  const base = slugify(name, {
    lower: true,
    strict: true,   // strip characters that aren't alphanumeric or hyphens
    trim: true,
  })

  // Use the first 6 characters of the UUID (without dashes)
  const shortId = uuid.replace(/-/g, "").slice(0, 6)

  // If slugify produced an empty string (e.g. name was all symbols),
  // fall back to the provided fallback
  const safeName = base || fallback

  return `${safeName}-${shortId}`
}
