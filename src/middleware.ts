import { defineMiddleware } from "astro:middleware";

/**
 * Default caching for public HTML. Pages are server-rendered from the CMS and
 * the job API; a short shared-cache window (honoured by a CDN in front of the
 * site) keeps them fast without making editors wait long to see changes.
 *
 * Never cached: the EmDash admin/API, logged-in editors (astro-session cookie,
 * so visual editing and previews stay live), and anything that already set its
 * own Cache-Control (e.g. the /r referral alias, which is private/no-store).
 */
const NEVER_CACHE = [/^\/_emdash/, /^\/_actions/, /^\/ingest/, /^\/r(\/|$)/];

export const onRequest = defineMiddleware(async (context, next) => {
	const response = await next();
	const { pathname } = context.url;

	// EmDash's baseline headers deny geolocation outright; the job board's
	// "Near me" filter needs it for this origin (still nobody else's).
	if (!pathname.startsWith("/_emdash")) {
		response.headers.set(
			"Permissions-Policy",
			"camera=(), microphone=(), geolocation=(self), payment=()"
		);
	}

	if (
		context.request.method === "GET" &&
		response.status === 200 &&
		!response.headers.has("Cache-Control") &&
		(response.headers.get("Content-Type") ?? "").includes("text/html") &&
		!NEVER_CACHE.some((re) => re.test(pathname)) &&
		!context.cookies.has("astro-session") &&
		!context.url.searchParams.has("_preview")
	) {
		response.headers.set(
			"Cache-Control",
			"public, max-age=0, s-maxage=300, stale-while-revalidate=600"
		);
	}
	return response;
});
