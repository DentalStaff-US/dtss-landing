/**
 * Typed access to public env vars, with local-dev defaults.
 *
 * The production build refuses to start without the app URLs — see the guard in
 * astro.config.mjs — so the fallbacks below only ever apply in development.
 */
const e = import.meta.env;

function base(value: string | undefined, devDefault: string): string {
	return (value || devDefault).replace(/\/+$/, "");
}

export const ENV = {
	practiceAppUrl: base(e.PUBLIC_PRACTICE_APP_URL, "http://localhost:3000"),
	professionalAppUrl: base(
		e.PUBLIC_PROFESSIONAL_APP_URL,
		"http://localhost:5173"
	),
	partnerPortalUrl: base(e.PUBLIC_PARTNER_PORTAL_URL, "http://localhost:5174"),
	adminApiUrl: base(
		e.PUBLIC_ADMIN_API_URL || e.PUBLIC_PRACTICE_APP_URL,
		"http://localhost:3000"
	),
	cookieDomain: e.PUBLIC_COOKIE_DOMAIN || "",
	// Web3Forms access keys are public by design (they only allow sending to the
	// inbox registered against the key). The fallback is the key the site has
	// always used.
	web3formsKey:
		e.PUBLIC_WEB3FORMS_KEY || "6cb429f4-8c7b-4bb2-adbb-f28f5f4230a7",
	posthogToken: e.PUBLIC_POSTHOG_PROJECT_TOKEN || "",
	posthogHost: e.PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
	affiliateProgramLive: e.PUBLIC_AFFILIATE_PROGRAM_LIVE === "true",
} as const;

/** Origins whose links get ?ref / UTM decoration on the way out. */
export const APP_ORIGINS = [
	ENV.practiceAppUrl,
	ENV.professionalAppUrl,
	ENV.partnerPortalUrl,
];
