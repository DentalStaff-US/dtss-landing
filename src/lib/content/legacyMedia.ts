/**
 * Blog posts imported from the old WordPress site still reference images at
 * `https://dtstaffingsolutions.com/wp-content/uploads/...`. Those files are now
 * served from this site's `public/wp-content/uploads/` at the same paths, so
 * rewrite the old origin away and the images load from here rather than from
 * the retired WordPress host (or through the apex → www redirect).
 */
const LEGACY_MEDIA =
	/^https?:\/\/(?:www\.)?dtstaffingsolutions\.com(?=\/wp-content\/)/i;

export function localizeLegacyMedia<T>(value: T): T {
	if (typeof value === "string") return value.replace(LEGACY_MEDIA, "") as T;
	if (Array.isArray(value)) return value.map(localizeLegacyMedia) as T;
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([k, v]) => [k, localizeLegacyMedia(v)])
		) as T;
	}
	return value;
}
