/**
 * 301s from the old WordPress site's URLs, so search rankings and old links
 * survive the cutover. Editors can add further redirects in the EmDash admin;
 * these are the structural ones that must exist from day one.
 */

/** Old WordPress posts lived at the site root; they now live under /blog. */
const LEGACY_POST_SLUGS = [
	"positive-communication",
	"finding-the-right-dental-office",
	"why-you-should-ditch-your-family-and-apply-to-jobs-this-holiday-season",
	"employees-vs-independent-contractors-the-great-dental-debate",
	"just-graduated-ready-to-get-to-it",
	"considering-becoming-a-dental-assistant",
	"how-to-attract-keep-the-right-staff-for-your-dental-practice",
	"top-interview-blunders-to-watch-for",
	"why-your-practice-needs-defined-job-descriptions",
	"5-ways-to-make-your-staff-advocates-or-ambassadors-of-your-practice",
	"5-ways-to-keep-your-top-talent",
	"ways-to-attract-top-talent-for-your-dental-practice",
	"main-hiring-mistakes-dentists-make-and-how-to-avoid-them",
	"osha-compliance-are-things-changing-do-they-need-to-change",
	"make-yourself-an-asset-that-brings-value-to-the-office",
	"bullying-in-the-dental-office",
	"misnomer-of-the-independent-contractors-1099",
	"how-to-restructure-a-dental-office-company",
	"cross-training-in-the-dental-office",
	"tips-for-getting-patients-to-write-reviews",
];

/** @type {Record<string, { status: 301; destination: string }>} */
export const LEGACY_REDIRECTS = {
	"/about-our-team": { status: 301, destination: "/about" },
	"/about-our-team/meet-our-team": { status: 301, destination: "/about/team" },
	"/working-with-us": { status: 301, destination: "/professionals" },
	"/dental-workforce-solutions": { status: 301, destination: "/practices" },
	"/affiliate-program": { status: 301, destination: "/affiliates" },
	"/jobs-old": { status: 301, destination: "/jobs" },
	"/jobs-dev": { status: 301, destination: "/jobs" },
	"/privacy-policy": { status: 301, destination: "/privacy" },
	"/login": { status: 301, destination: "/sign-in" },
	"/resources/tintero-creative-partner": {
		status: 301,
		destination: "/resources",
	},
	...Object.fromEntries(
		LEGACY_POST_SLUGS.map((slug) => [
			`/${slug}`,
			{ status: 301, destination: `/blog/${slug}` },
		])
	),
};
