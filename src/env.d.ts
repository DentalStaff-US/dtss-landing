/// <reference types="astro/client" />
/// <reference types="emdash/locals" />

interface ImportMetaEnv {
	/** Practice (client) app base URL, e.g. https://internal.dtstaffingsolutions.com */
	readonly PUBLIC_PRACTICE_APP_URL?: string;
	/** Professional (candidate) app base URL, e.g. https://app.dtstaffingsolutions.com */
	readonly PUBLIC_PROFESSIONAL_APP_URL?: string;
	/** Affiliate portal base URL, e.g. https://partners.dtstaffingsolutions.com */
	readonly PUBLIC_PARTNER_PORTAL_URL?: string;
	/** Admin app base URL serving /api/public/* (job board). Usually the same host as the practice app. */
	readonly PUBLIC_ADMIN_API_URL?: string;
	/** Shared cookie domain, e.g. .dtstaffingsolutions.com. Unset in local dev. */
	readonly PUBLIC_COOKIE_DOMAIN?: string;
	readonly PUBLIC_WEB3FORMS_KEY?: string;
	readonly PUBLIC_POSTHOG_PROJECT_TOKEN?: string;
	readonly PUBLIC_POSTHOG_HOST?: string;
	/** "true" once the affiliate program is switched on in production. */
	readonly PUBLIC_AFFILIATE_PROGRAM_LIVE?: string;
	readonly EMDASH_DATABASE_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
