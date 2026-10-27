import type { APIRoute } from "astro";
import { SITE } from "@/config/site.mjs";

export const GET: APIRoute = () =>
	new Response(
		[
			"User-agent: *",
			"Allow: /",
			"Disallow: /_emdash/",
			"Disallow: /r",
			"Disallow: /ingest/",
			"",
			`Sitemap: ${SITE.url}/sitemap.xml`,
			"",
		].join("\n"),
		{ headers: { "Content-Type": "text/plain; charset=utf-8" } }
	);
