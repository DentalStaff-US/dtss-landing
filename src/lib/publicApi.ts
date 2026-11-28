/**
 * Server-side fetch for the admin app's public API (/api/public/**), shared by
 * the job board (jobs.ts) and the referral program terms (program.ts).
 */
import { ENV } from "./env";

export type Result<T> = { ok: true; data: T } | { ok: false; status: number };

// Tiny in-process cache: the admin endpoints are cacheable for 2 minutes and
// facets change rarely; this keeps a burst of visitors from all hitting the API.
const cache = new Map<string, { at: number; value: Result<unknown> }>();
const TTL_MS = 60_000;

export async function getPublic<T>(path: string): Promise<Result<T>> {
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
