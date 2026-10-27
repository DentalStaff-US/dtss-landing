import type { APIRoute } from "astro";
import { SITE } from "@/config/site.mjs";
import { getPosts } from "@/lib/cms";

const esc = (s: string) =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const GET: APIRoute = async () => {
	const { posts } = await getPosts({ perPage: 30 });
	const items = posts
		.map((p) => {
			const url = new URL(`/blog/${p.slug}`, SITE.url).href;
			return `<item><title>${esc(p.title)}</title><link>${url}</link><guid>${url}</guid>${
				p.publishedAt ? `<pubDate>${p.publishedAt.toUTCString()}</pubDate>` : ""
			}${p.excerpt ? `<description>${esc(p.excerpt)}</description>` : ""}</item>`;
		})
		.join("");
	const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(SITE.name)} Blog</title><link>${SITE.url}/blog</link><description>${esc(
		SITE.description
	)}</description><language>en-us</language>${items}</channel></rss>`;
	return new Response(xml, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=900",
		},
	});
};
