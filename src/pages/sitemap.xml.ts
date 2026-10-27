import type { APIRoute } from "astro";
import { SITE } from "@/config/site.mjs";
import { getCategories, getPosts } from "@/lib/cms";
import { listJobs } from "@/lib/jobs";

/**
 * Dynamic sitemap (static routes + CMS posts + open jobs). @astrojs/sitemap
 * only sees prerendered routes, so it can't be used with server output.
 */
const STATIC_ROUTES = [
	"/",
	"/practices",
	"/professionals",
	"/jobs",
	"/affiliates",
	"/about",
	"/about/team",
	"/locations",
	"/testimonials",
	"/faq",
	"/blog",
	"/resources",
	"/contact",
	"/get-started",
	"/privacy",
	"/terms",
	"/disclaimers",
];

async function allPosts() {
	const out: Awaited<ReturnType<typeof getPosts>>["posts"] = [];
	for (let page = 1; page <= 20; page++) {
		const { posts, hasMore } = await getPosts({ page, perPage: 50 });
		out.push(...posts);
		if (!hasMore) break;
	}
	return out;
}

async function allJobs() {
	const ids: { publicId: string; postedAt: string }[] = [];
	for (let page = 1; page <= 10; page++) {
		const res = await listJobs({ page: String(page) }, 50);
		if (!res.ok) break;
		ids.push(
			...res.data.jobs.map((j) => ({
				publicId: j.publicId,
				postedAt: j.postedAt,
			}))
		);
		if (page * res.data.limit >= res.data.total) break;
	}
	return ids;
}

export const GET: APIRoute = async () => {
	const [posts, categories, jobs] = await Promise.all([
		allPosts(),
		getCategories(),
		allJobs(),
	]);
	const url = (path: string, lastmod?: Date | string) =>
		`<url><loc>${new URL(path, SITE.url).href}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : ""}</url>`;

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[
	...STATIC_ROUTES.map((p) => url(p)),
	...categories.map((c) => url(`/blog/category/${c.slug}`)),
	...posts.map((p) => url(`/blog/${p.slug}`, p.updatedAt ?? p.publishedAt)),
	...jobs.map((j) => url(`/jobs/${j.publicId}`, j.postedAt)),
].join("\n")}
</urlset>`;
	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
};
