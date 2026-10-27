// @ts-check
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import node from "@astrojs/node";
import react from "@astrojs/react";
import icon from "astro-icon";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import emdash, { local, memoryCache, s3 } from "emdash/astro";
import { postgres, sqlite } from "emdash/db";
import { SITE } from "./src/config/site.mjs";
import { LEGACY_REDIRECTS } from "./src/config/redirects.mjs";

const isProdBuild = process.argv.includes("build");
const env = loadEnv(
	isProdBuild ? "production" : "development",
	process.cwd(),
	""
);

// A production build must know where the apps live, or every CTA would point
// at localhost (which is exactly what the old static build shipped). It must
// also use the shared CMS database + bucket: falling back to SQLite / local
// disk would silently fork this instance's content from every other instance.
if (isProdBuild && env.ALLOW_DEV_URLS !== "true") {
	const required = [
		"PUBLIC_PRACTICE_APP_URL",
		"PUBLIC_PROFESSIONAL_APP_URL",
		"PUBLIC_PARTNER_PORTAL_URL",
		"PUBLIC_COOKIE_DOMAIN",
		"EMDASH_DATABASE_URL",
		"S3_BUCKET",
	];
	const missing = required.filter((k) => !env[k]);
	if (missing.length) {
		throw new Error(
			`Missing env for production build: ${missing.join(", ")}. See .env.example (set ALLOW_DEV_URLS=true to build anyway).`
		);
	}
}

/**
 * EmDash content lives in its OWN Postgres (the Railway "CMS" database).
 * Deliberately not called DATABASE_URL so it can never be confused with the
 * shared admin/candidate app database — this site never connects to that one;
 * it reads job data through the admin app's /api/public endpoints instead.
 *
 * ONE CMS database serves every deployed instance (staging + production), so
 * content is edited once and shows everywhere. Consequences:
 *  - every instance must run the SAME emdash version (pinned exactly in
 *    package.json): runtime migrations would otherwise move the shared schema
 *    under an older instance. Upgrade emdash on all instances together.
 *  - every instance needs the same EMDASH_ENCRYPTION_KEY and S3_* storage
 *    (media rows point at storage keys; local disk can't be shared).
 *  - each instance sets its own EMDASH_SITE_URL (passkeys/CSRF/redirects).
 *
 * Without EMDASH_DATABASE_URL, local dev falls back to a SQLite file so the
 * site and admin can be worked on offline (apply seed/seed.json via the
 * setup wizard at /_emdash/admin). Never point local dev at the shared DB.
 */
const cmsDatabase = env.EMDASH_DATABASE_URL
	? postgres({ connectionString: env.EMDASH_DATABASE_URL, pool: { max: 5 } })
	: sqlite({ url: "file:./.emdash/dev.db" });

/**
 * Media goes to S3-compatible storage (DO Spaces) when configured. Field values
 * left out here fall back to EmDash's S3_* env vars at runtime.
 */
const storage = env.S3_BUCKET
	? s3({
			endpoint: env.S3_ENDPOINT,
			bucket: env.S3_BUCKET,
			publicUrl: env.S3_PUBLIC_URL || undefined,
		})
	: undefined;

// https://astro.build/config
export default defineConfig({
	site: SITE.url,
	output: "server",
	adapter: node({ mode: "standalone" }),
	server: { port: 4321, host: true },
	redirects: LEGACY_REDIRECTS,
	integrations: [
		react(),
		icon(),
		mdx(),
		emdash({
			database: cmsDatabase,
			storage:
				storage ??
				local({
					directory: "./.emdash/uploads",
					baseUrl: "/_emdash/api/media/file",
				}),
			// Per-process cache: an edit only invalidates the instance it was made
			// on, so keep the TTL short for the other instances sharing the DB.
			objectCache: memoryCache({ defaultTtl: 60 }),
			// No hardcoded siteUrl: each instance sets EMDASH_SITE_URL to the
			// origin users actually open (EmDash's own fallback order).
		}),
	],
	vite: {
		plugins: [tailwindcss()],
		build: {
			cssMinify: "lightningcss",
		},
	},
	build: {
		inlineStylesheets: "auto",
		assets: "_assets",
	},
	compressHTML: true,
	image: {
		domains: [],
		remotePatterns: [{ protocol: "https" }],
	},
});
