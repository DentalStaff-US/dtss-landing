import type { AstroCookies, AstroGlobal } from "astro";
import { ENV } from "./env";
import { appLink } from "./links";

/**
 * Server-side half of the `dtss_ref` attribution contract. The browser half is
 * src/components/AttributionScript.astro — both must agree on everything here.
 *
 * ⚠️ Cookie NAME, VALUE FORMAT and FIRST-TOUCH rule must stay in sync with:
 *   dental-staff-app/src/lib/server/affiliate/cookie.ts
 *   dtss-candidate-app/src/lib/server/affiliate/refCookie.ts
 *   dtss-affiliate-app/src/lib/server/refCookie.ts
 *
 * Not HttpOnly on purpose: cached/prerendered pages can only write it from
 * document.cookie. A referral code is not a secret; every check that matters
 * (self-referral, program enabled, code exists) happens at consume time.
 */
export const REF_COOKIE = "dtss_ref";
export const REF_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;
export const REF_CODE_PATTERN = /^[A-Z0-9-]{4,32}$/;

export function normalizeRefCode(
	raw: string | null | undefined
): string | null {
	if (!raw) return null;
	const code = raw.trim().toUpperCase();
	return REF_CODE_PATTERN.test(code) ? code : null;
}

/** True when the cookie holds an unexpired, well-formed attribution. */
export function isValidRefCookie(
	value: string | undefined,
	now = Date.now()
): boolean {
	if (!value) return false;
	const [code, iso, ...rest] = value.split("|");
	if (rest.length || !code || !iso || !REF_CODE_PATTERN.test(code))
		return false;
	const touched = Date.parse(iso);
	if (Number.isNaN(touched) || touched > now) return false;
	return (now - touched) / 1000 <= REF_MAX_AGE_SECONDS;
}

export function readRefCode(cookies: AstroCookies): string | null {
	const value = cookies.get(REF_COOKIE)?.value;
	return isValidRefCookie(value) ? value!.split("|")[0] : null;
}

/** FIRST TOUCH WINS — never overwrites an existing valid attribution. */
export function captureRef(
	cookies: AstroCookies,
	raw: string | null,
	secure: boolean
): string | null {
	const existing = readRefCode(cookies);
	if (existing) return existing;
	const code = normalizeRefCode(raw);
	if (!code) return null;
	cookies.set(REF_COOKIE, `${code}|${new Date().toISOString()}`, {
		path: "/",
		maxAge: REF_MAX_AGE_SECONDS,
		sameSite: "lax",
		httpOnly: false,
		secure,
		...(ENV.cookieDomain ? { domain: ENV.cookieDomain } : {}),
		// The apps read the raw `CODE|ISO` value; don't let Astro percent-encode the pipe.
		encode: (v: string) => v,
	});
	return code;
}

const UTM_KEYS = [
	"utm_source",
	"utm_medium",
	"utm_campaign",
	"utm_term",
	"utm_content",
];

/**
 * The /r alias — mirrors dtss-affiliate-app/src/routes/r/[code]: capture the
 * cookie (first touch wins), then forward straight to the right sign-up when
 * ?to=practice|pro, otherwise let the caller render the chooser.
 */
export function handleReferralVisit(
	Astro: AstroGlobal,
	rawCode: string | null
) {
	const incoming = normalizeRefCode(rawCode);
	const active =
		captureRef(Astro.cookies, incoming, Astro.url.protocol === "https:") ??
		incoming;

	Astro.response.headers.set("Cache-Control", "private, no-store");
	Astro.response.headers.set("X-Robots-Tag", "noindex");

	const to = Astro.url.searchParams.get("to");
	if (to === "practice" || to === "pro") {
		const params: Record<string, string> = active ? { ref: active } : {};
		for (const k of UTM_KEYS) {
			const v = Astro.url.searchParams.get(k);
			if (v) params[k] = v;
		}
		return { active, redirectTo: appLink(to, "sign-up", params) };
	}
	return { active, redirectTo: null };
}
