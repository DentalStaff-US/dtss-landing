/**
 * Typed read helpers over EmDash. Pages call these, never EmDash directly, so
 * that (a) field names live in one place next to seed/seed.json, and (b) a CMS
 * outage or an unseeded database degrades to empty sections instead of a 500.
 */
import {
	getEmDashCollection,
	getEmDashEntry,
	getEntryTerms,
	getTaxonomyTerms,
} from "emdash";

type PT = unknown[];
export interface MediaValue {
	id?: string;
	src?: string;
	url?: string;
	alt?: string;
	width?: number;
	height?: number;
}

export type FaqAudience = "general" | "practice" | "professional" | "affiliate";

export interface Faq {
	id: string;
	question: string;
	answer: PT;
	audience: FaqAudience;
}
export interface Testimonial {
	id: string;
	name: string;
	role?: string;
	organization?: string;
	quote: string;
	audience: "practice" | "professional";
	rating?: number;
	featured: boolean;
}
export interface TeamMember {
	id: string;
	name: string;
	role: string;
	bio?: string;
	photo?: MediaValue | null;
}
export interface Location {
	id: string;
	region: string;
	state: string;
	cities?: string;
	contactName?: string;
	extension?: string;
	sms?: string;
}
export interface PostSummary {
	slug: string;
	title: string;
	excerpt?: string;
	image?: MediaValue | null;
	publishedAt?: Date;
	updatedAt?: Date;
	audience?: string;
}
export interface Post extends PostSummary {
	id: string;
	content: PT;
	categories: { slug: string; label: string }[];
	authorName?: string;
}
export interface Page {
	title: string;
	content: PT;
	updatedAt?: Date;
}

type Data = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
const date = (v: unknown) =>
	v instanceof Date ? v : typeof v === "string" ? new Date(v) : undefined;
const num = (v: unknown) =>
	typeof v === "number"
		? v
		: typeof v === "string" && v
			? Number(v)
			: undefined;
const bySortOrder = (a: Data, b: Data) =>
	(num(a.sort_order) ?? 100) - (num(b.sort_order) ?? 100);

async function list(
	type: string,
	opts: Parameters<typeof getEmDashCollection>[1] = {}
) {
	try {
		const { entries, error, hasMore } = await getEmDashCollection(type, {
			status: "published",
			...opts,
		} as never);
		if (error) console.error(`[cms] ${type}:`, error.message);
		return {
			entries: entries as { id: string; data: Data }[],
			hasMore: Boolean(hasMore),
		};
	} catch (err) {
		console.error(`[cms] ${type} failed:`, err);
		return { entries: [], hasMore: false };
	}
}

/** EmDash's entry id is the slug for routable collections; data.slug when present. */
const slugOf = (e: { id: string; data: Data }) => str(e.data.slug) ?? e.id;

export async function getFaqs(audiences?: FaqAudience[]): Promise<Faq[]> {
	const { entries } = await list("faqs", { limit: 200 });
	return entries
		.map((e) => e.data)
		.sort(bySortOrder)
		.map((d) => ({
			id: String(d.id),
			question: String(d.question ?? ""),
			answer: (d.answer as PT) ?? [],
			audience: (str(d.audience) as FaqAudience) ?? "general",
		}))
		.filter(
			(f) => f.question && (!audiences || audiences.includes(f.audience))
		);
}

export async function getTestimonials(
	opts: { featuredOnly?: boolean } = {}
): Promise<Testimonial[]> {
	const { entries } = await list("testimonials", { limit: 100 });
	return entries
		.map((e) => e.data)
		.sort(bySortOrder)
		.map((d) => ({
			id: String(d.id),
			name: String(d.name ?? ""),
			role: str(d.role),
			organization: str(d.organization),
			quote: String(d.quote ?? ""),
			audience:
				d.audience === "professional"
					? ("professional" as const)
					: ("practice" as const),
			rating: num(d.rating),
			featured: Boolean(d.featured),
		}))
		.filter((t) => t.quote && (!opts.featuredOnly || t.featured));
}

export async function getTeam(): Promise<TeamMember[]> {
	const { entries } = await list("team", { limit: 50 });
	return entries
		.map((e) => e.data)
		.sort(bySortOrder)
		.map((d) => ({
			id: String(d.id),
			name: String(d.name ?? ""),
			role: String(d.role ?? ""),
			bio: str(d.bio),
			photo: (d.photo as MediaValue) ?? null,
		}));
}

export async function getLocations(): Promise<Location[]> {
	const { entries } = await list("locations", { limit: 100 });
	return entries
		.map((e) => e.data)
		.sort(bySortOrder)
		.map((d) => ({
			id: String(d.id),
			region: String(d.region ?? ""),
			state: String(d.state ?? ""),
			cities: str(d.cities),
			contactName: str(d.contact_name),
			extension: str(d.extension),
			sms: str(d.sms),
		}));
}

function toSummary(e: { id: string; data: Data }): PostSummary {
	const d = e.data;
	return {
		slug: slugOf(e),
		title: String(d.title ?? "Untitled"),
		excerpt: str(d.excerpt),
		image: (d.featured_image as MediaValue) ?? null,
		publishedAt: date(d.publishedAt) ?? date(d.createdAt),
		updatedAt: date(d.updatedAt),
		audience: str(d.audience),
	};
}

export const POSTS_PER_PAGE = 9;

export async function getPosts(
	opts: { page?: number; perPage?: number; category?: string } = {}
): Promise<{ posts: PostSummary[]; hasMore: boolean }> {
	const perPage = opts.perPage ?? POSTS_PER_PAGE;
	const page = Math.max(1, opts.page ?? 1);
	const { entries, hasMore } = await list("posts", {
		limit: perPage,
		offset: (page - 1) * perPage,
		orderBy: { published_at: "desc" },
		...(opts.category ? { where: { category: opts.category } } : {}),
	} as never);
	return { posts: entries.map(toSummary), hasMore };
}

export async function getPost(slug: string): Promise<Post | null> {
	try {
		const { entry, error } = await getEmDashEntry("posts", slug);
		if (error) console.error("[cms] post:", error.message);
		if (!entry) return null;
		const data = entry.data as unknown as Data;
		const terms = await getEntryTerms(
			"posts",
			String(data.id ?? entry.id),
			"category"
		).catch(() => []);
		const bylines =
			(data.bylines as { displayName?: string }[] | undefined) ?? [];
		return {
			...toSummary(entry as unknown as { id: string; data: Data }),
			id: String(data.id ?? entry.id),
			content: (data.content as PT) ?? [],
			categories: terms.map((t) => ({ slug: t.slug, label: t.label })),
			authorName: bylines[0]?.displayName,
		};
	} catch (err) {
		console.error("[cms] post failed:", err);
		return null;
	}
}

export async function getCategories(): Promise<
	{ slug: string; label: string }[]
> {
	try {
		return (await getTaxonomyTerms("category")).map((t) => ({
			slug: t.slug,
			label: t.label,
		}));
	} catch {
		return [];
	}
}

export async function getPage(slug: string): Promise<Page | null> {
	try {
		const { entry } = await getEmDashEntry("pages", slug);
		if (!entry) return null;
		const d = entry.data as unknown as Data;
		return {
			title: String(d.title ?? ""),
			content: (d.content as PT) ?? [],
			updatedAt: date(d.updatedAt),
		};
	} catch (err) {
		console.error("[cms] page failed:", err);
		return null;
	}
}

/** Plain-text extraction for meta descriptions / JSON-LD. */
export function ptToText(value: unknown, max = 500): string {
	if (!Array.isArray(value)) return "";
	const text = value
		.map((b) =>
			Array.isArray((b as { children?: unknown[] }).children)
				? (b as { children: { text?: string }[] }).children
						.map((c) => c.text ?? "")
						.join("")
				: ""
		)
		.join(" ")
		.replace(/\s+/g, " ")
		.trim();
	return text.length > max
		? text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…"
		: text;
}

/** Resolve an EmDash media value to a URL usable in <img>/OG tags. */
export function mediaUrl(m: MediaValue | null | undefined): string | undefined {
	if (!m) return undefined;
	return (
		m.url ?? m.src ?? (m.id ? `/_emdash/api/media/file/${m.id}` : undefined)
	);
}
