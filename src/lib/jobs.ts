/**
 * Server-side client for the admin app's public job board API
 * (dental-staff-app/src/routes/api/public/jobs/**). DTOs are an allowlist
 * built in dental-staff-app/src/lib/server/publicJobs/mask.ts — practice
 * identity, street address and coordinates never leave the admin app.
 */
import { ENV } from "./env";

export interface PublicJobDate {
	date: string; // YYYY-MM-DD
	start: string; // HH:mm in the practice's timezone
	end: string;
}
export type PublicJobSchedule =
	| { permanent: false; openDateCount: number; nextDates: PublicJobDate[] }
	| { permanent: true };
export interface PublicJobSkillGroup {
	category: string;
	matchMode: "ALL" | "ANY";
	skills: { name: string; requiresCertificate: boolean }[];
}
export interface PublicJob {
	publicId: string;
	type: "temp" | "perm";
	discipline: { name: string; abbreviation: string };
	experienceLevel: string | null;
	city: string | null;
	state: string | null;
	distanceMiles: number | null;
	payRate: number | null;
	schedule: PublicJobSchedule;
	skills: PublicJobSkillGroup[];
	postedAt: string;
	summary: string;
	descriptionTeaser: string | null;
}
export interface PublicJobDetail extends PublicJob {
	descriptionLength: number;
}
export interface JobListResponse {
	jobs: PublicJob[];
	total: number;
	page: number;
	limit: number;
}
export interface JobFacets {
	disciplines: {
		id: string;
		name: string;
		abbreviation: string;
		openCount: number;
	}[];
	experienceLevels: { id: string; value: string; order: number }[];
	states: { state: string; count: number }[];
	cities: { city: string; state: string; count: number }[];
}

/** Query params the board understands — mirrors the admin filtersSchema. */
export const JOB_FILTER_KEYS = [
	"discipline",
	"type",
	"state",
	"city",
	"lat",
	"lng",
	"radius",
	"experienceLevel",
	"sort",
	"page",
] as const;
export type JobFilters = Partial<
	Record<(typeof JOB_FILTER_KEYS)[number], string>
>;

export function filtersFromUrl(url: URL): JobFilters {
	const out: JobFilters = {};
	for (const k of JOB_FILTER_KEYS) {
		const v = url.searchParams.get(k)?.trim();
		if (v) out[k] = v;
	}
	return out;
}

const PUBLIC_ID =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isPublicId = (v: string | undefined): v is string =>
	!!v && PUBLIC_ID.test(v);

type Result<T> = { ok: true; data: T } | { ok: false; status: number };

// Tiny in-process cache: the admin endpoints are cacheable for 2 minutes and
// facets change rarely; this keeps a burst of visitors from all hitting the API.
const cache = new Map<string, { at: number; value: Result<unknown> }>();
const TTL_MS = 60_000;

async function get<T>(path: string): Promise<Result<T>> {
	const hit = cache.get(path);
	if (hit && Date.now() - hit.at < TTL_MS) return hit.value as Result<T>;

	const headers: Record<string, string> = { Accept: "application/json" };
	// Lets this server's fetches skip the admin API's per-IP rate limit (every
	// visitor's request would otherwise come from this one IP).
	const key = process.env.JOB_BOARD_SERVER_KEY;
	if (key) headers["x-job-board-key"] = key;

	let value: Result<T>;
	try {
		const res = await fetch(`${ENV.adminApiUrl}/api/public${path}`, {
			headers,
			signal: AbortSignal.timeout(8000),
		});
		value = res.ok
			? { ok: true, data: (await res.json()) as T }
			: { ok: false, status: res.status };
	} catch (err) {
		console.error("[jobs] fetch failed", path, err);
		value = { ok: false, status: 503 };
	}
	if (value.ok || value.status === 404 || value.status === 410)
		cache.set(path, { at: Date.now(), value });
	if (cache.size > 500) cache.delete(cache.keys().next().value!);
	return value;
}

export async function listJobs(filters: JobFilters, limit = 18) {
	const qs = new URLSearchParams({ limit: String(limit) });
	for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, v);
	return get<JobListResponse>(`/jobs?${qs}`);
}

export async function getJob(publicId: string) {
	return get<{ job: PublicJobDetail }>(`/jobs/${publicId}`);
}

export async function getFacets() {
	return get<JobFacets>(`/jobs/facets`);
}

// ---------------------------------------------------------------------------
// Presentation helpers (shared by the board, cards and detail page)
// ---------------------------------------------------------------------------
export function formatDate(
	iso: string,
	opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
) {
	const [y, m, d] = iso.split("-").map(Number);
	return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
		...opts,
		timeZone: "UTC",
	});
}

export function formatTime(hhmm: string) {
	const [h, m] = hhmm.split(":").map(Number);
	const suffix = h >= 12 ? "pm" : "am";
	const hour = h % 12 || 12;
	return m
		? `${hour}:${String(m).padStart(2, "0")}${suffix}`
		: `${hour}${suffix}`;
}

export function jobTitle(job: PublicJob) {
	return `${job.type === "perm" ? "Permanent" : "Temp"} ${job.discipline.name}`;
}

export function jobPlace(job: PublicJob) {
	return (
		[job.city, job.state].filter(Boolean).join(", ") ||
		"Location shared after sign-up"
	);
}

export function jobPay(job: PublicJob) {
	return job.payRate ? `$${job.payRate}/hr` : "Competitive pay";
}

export function postedAgo(iso: string) {
	const days = Math.floor(
		(Date.now() - Date.parse(iso + "T00:00:00Z")) / 86_400_000
	);
	if (days <= 0) return "Posted today";
	if (days === 1) return "Posted yesterday";
	if (days < 30) return `Posted ${days} days ago`;
	return `Posted ${formatDate(iso)}`;
}
