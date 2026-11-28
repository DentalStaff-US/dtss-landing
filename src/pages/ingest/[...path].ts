import type { APIRoute } from "astro";

/**
 * Reverse proxy for PostHog, mirroring dental-staff-app/src/hooks.server.ts, so
 * ad-blockers don't drop the marketing → sign-up funnel events.
 */
export const ALL: APIRoute = async ({ request, url, clientAddress }) => {
	const path = url.pathname.replace(/^\/ingest/, "");
	const useAssetHost =
		path.startsWith("/static/") || path.startsWith("/array/");
	const hostname = useAssetHost
		? "us-assets.i.posthog.com"
		: "us.i.posthog.com";

	const target = new URL(url.toString());
	target.protocol = "https:";
	target.hostname = hostname;
	target.port = "";
	target.pathname = path;

	const headers = new Headers(request.headers);
	headers.set("host", hostname);
	headers.set("accept-encoding", "");
	headers.delete("cookie");
	headers.set(
		"x-forwarded-for",
		request.headers.get("x-forwarded-for") || clientAddress
	);

	const hasBody = request.method !== "GET" && request.method !== "HEAD";
	const upstream = await fetch(target, {
		method: request.method,
		headers,
		body: hasBody ? request.body : undefined,
		// @ts-expect-error duplex is required for streaming request bodies in Node
		duplex: hasBody ? "half" : undefined,
	});

	// A fetched response's headers are read-only, and middleware adds its own, so
	// hand back a copy. fetch already decoded the body, so its encoding is stale.
	const responseHeaders = new Headers(upstream.headers);
	responseHeaders.delete("content-encoding");
	responseHeaders.delete("content-length");
	return new Response(upstream.body, {
		status: upstream.status,
		headers: responseHeaders,
	});
};
