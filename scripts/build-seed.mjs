#!/usr/bin/env node
/**
 * Builds seed/seed.json — the EmDash schema + starter content for the site.
 *
 *   npm run seed:build
 *
 * The EmDash setup wizard (/_emdash/admin on first run) offers to apply
 * seed/seed.json, including this starter content. After that, the CMS is the
 * source of truth: edit content in the admin, not here. Re-running the wizard
 * or `emdash seed` against a live database is only for fresh environments.
 *
 * Blog posts are NOT seeded — import them from the old WordPress site with the
 * admin's WordPress import wizard so slugs, dates and images come across.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------------------
// Tiny Markdown → Portable Text (headings, paragraphs, **bold**, *em*, links,
// bullet lists, soft line breaks). Enough for the legal pages and FAQ answers.
// ---------------------------------------------------------------------------
let keySeq = 0;
const key = () => `k${(keySeq++).toString(36)}`;

function spans(text) {
	const children = [];
	const markDefs = [];
	const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\))/g;
	let last = 0;
	let m;
	const push = (t, marks = []) =>
		t && children.push({ _type: "span", _key: key(), text: t, marks });
	while ((m = re.exec(text))) {
		push(text.slice(last, m.index));
		if (m[2]) push(m[2], ["strong"]);
		else if (m[3]) push(m[3], ["em"]);
		else {
			const k = key();
			markDefs.push({ _type: "link", _key: k, href: m[5] });
			push(m[4], [k]);
		}
		last = re.lastIndex;
	}
	push(text.slice(last));
	if (!children.length) push(" ");
	return { children, markDefs };
}

function block(text, style = "normal", extra = {}) {
	return { _type: "block", _key: key(), style, ...spans(text), ...extra };
}

export function md(markdown) {
	const out = [];
	const paras = markdown.replace(/\r/g, "").split(/\n{2,}/);
	for (const raw of paras) {
		const p = raw.trim();
		if (!p || p === "---") continue;
		const h = /^(#{1,4})\s+(.*)$/.exec(p);
		if (h) {
			// Page title (#) is rendered from the entry title; demote the rest.
			if (h[1].length === 1) continue;
			out.push(block(h[2], `h${Math.min(h[1].length, 4)}`));
			continue;
		}
		if (/^[-*•]\s+/.test(p)) {
			for (const line of p.split("\n")) {
				const t = line.replace(/^[-*•]\s+/, "").trim();
				if (t) out.push(block(t, "normal", { listItem: "bullet", level: 1 }));
			}
			continue;
		}
		out.push(block(p.replace(/\n/g, " ")));
	}
	return out;
}

const legal = (name) =>
	md(readFileSync(resolve(root, "seed/legal", `${name}.md`), "utf8"));

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const f = (slug, label, type, extra = {}) => ({ slug, label, type, ...extra });
const order = f("sort_order", "Sort order", "integer", { defaultValue: 100 });

const collections = [
	{
		slug: "posts",
		label: "Blog Posts",
		labelSingular: "Blog Post",
		description: "Articles for practices and dental professionals.",
		icon: "newspaper",
		sortOrder: 1,
		supports: ["drafts", "revisions", "preview", "scheduling", "search", "seo"],
		urlPattern: "/blog/{slug}",
		dateField: "published_at",
		fields: [
			f("title", "Title", "string", { required: true, searchable: true }),
			f("excerpt", "Excerpt", "text", {
				searchable: true,
				validation: { maxLength: 320 },
			}),
			f("featured_image", "Featured image", "image"),
			f("content", "Content", "portableText", { searchable: true }),
			f("audience", "Primarily for", "select", {
				defaultValue: "general",
				validation: { options: ["general", "practice", "professional"] },
			}),
		],
	},
	{
		slug: "faqs",
		label: "FAQs",
		labelSingular: "FAQ",
		description:
			"Questions and answers. Audience controls which page each appears on.",
		icon: "question",
		sortOrder: 2,
		routable: false,
		supports: ["drafts", "revisions", "search"],
		titleField: "question",
		fields: [
			f("question", "Question", "string", { required: true, searchable: true }),
			f("answer", "Answer", "portableText", {
				required: true,
				searchable: true,
			}),
			f("audience", "Audience", "select", {
				required: true,
				defaultValue: "general",
				validation: {
					options: ["general", "practice", "professional", "affiliate"],
				},
			}),
			order,
		],
	},
	{
		slug: "testimonials",
		label: "Testimonials",
		labelSingular: "Testimonial",
		icon: "chat-centered-text",
		sortOrder: 3,
		routable: false,
		supports: ["drafts"],
		titleField: "name",
		fields: [
			f("name", "Name", "string", { required: true }),
			f("role", "Role / credentials", "string"),
			f("organization", "Practice / organization", "string"),
			f("quote", "Quote", "text", { required: true }),
			f("audience", "Who said it", "select", {
				defaultValue: "practice",
				validation: { options: ["practice", "professional"] },
			}),
			f("rating", "Star rating (1–5)", "integer", {
				validation: { min: 1, max: 5 },
			}),
			f("featured", "Show on home page", "boolean", { defaultValue: false }),
			order,
		],
	},
	{
		slug: "team",
		label: "Team",
		labelSingular: "Team member",
		icon: "users",
		sortOrder: 4,
		routable: false,
		supports: ["drafts"],
		titleField: "name",
		fields: [
			f("name", "Name", "string", { required: true }),
			f("role", "Job title", "string", { required: true }),
			f("photo", "Photo", "image"),
			f("bio", "Bio", "text"),
			order,
		],
	},
	{
		slug: "locations",
		label: "Locations",
		labelSingular: "Location",
		description: "Service areas and the local contact for each.",
		icon: "map-pin",
		sortOrder: 5,
		routable: false,
		supports: ["drafts"],
		titleField: "region",
		fields: [
			f("region", "Region", "string", { required: true }),
			f("state", "State (2-letter)", "string", {
				required: true,
				validation: { pattern: "^[A-Z]{2}$" },
			}),
			f("cities", "Cities covered", "string"),
			f("contact_name", "Contact name", "string"),
			f("extension", "Phone extension", "string"),
			f("sms", "SMS number", "string"),
			order,
		],
	},
	{
		slug: "pages",
		label: "Pages",
		labelSingular: "Page",
		description: "Simple text pages such as the privacy policy and terms.",
		icon: "file-text",
		sortOrder: 6,
		supports: ["drafts", "revisions", "seo"],
		urlPattern: "/{slug}",
		fields: [
			f("title", "Title", "string", { required: true }),
			f("content", "Content", "portableText", { required: true }),
		],
	},
];

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
const entries = (collection, rows, toData) =>
	rows.map((row, i) => ({
		id: `${collection}:${i + 1}`,
		slug: row.slug ?? null,
		status: "published",
		data: toData(row, i),
	}));

const FAQS = [
	// general
	[
		"general",
		"What is Dental Temps Staffing Solutions?",
		"DTSS is a dental staffing company that pairs proprietary staffing software with a personal, small-town touch. We place **temporary** and **permanent** dental professionals — hygienists, assistants, front office, lab techs and dentists — with practices that need them.",
	],
	[
		"general",
		"Where do you operate?",
		"We currently staff practices across Florida, Washington, Texas (Dallas/Ft. Worth) and Illinois (Chicago). See our [locations page](/locations) for the local contact in each area — and reach out if you're nearby, as we're growing.",
	],
	[
		"general",
		"Is it free to create an account?",
		"Yes. Creating an account is free for both dental practices and dental professionals.",
	],
	// practices
	[
		"practice",
		"How quickly can you fill a shift?",
		"Post a request in the practice portal and qualified, available professionals nearby are notified right away. Many shifts are assigned within minutes — it's just that simple.",
	],
	[
		"practice",
		"Who is the employer of the temporary staff you send?",
		"We are. Unlike referral services, DTSS is the **employer of record** for the temporary professionals we place, handling payroll, workers' comp, payroll taxes, unemployment and the other employment burdens — no 1099 headaches for you.",
	],
	[
		"practice",
		"How are your professionals screened?",
		"Every professional completes an onboarding process that covers experience, résumé, licenses and certifications, and documents before they're approved to work. We also participate in **E-Verify** to confirm employment eligibility.",
	],
	[
		"practice",
		"What does it cost?",
		"You set the hourly rate on each request. We invoice for approved hours worked plus a service fee, and you can pay by card or bank transfer. There's no cost to create a practice account.",
	],
	[
		"practice",
		"Can you help us hire permanently?",
		"Yes. Through **direct placement** we act as your outsourced recruiter — we help define the role, post it, screen candidates and recommend the best fits. With **temp-to-perm** you can try a professional on a temporary basis first, then hire them for an agreed fee.",
	],
	[
		"practice",
		"How do timesheets and invoicing work?",
		"Professionals submit their hours in the app, you review and approve the timesheet in your practice portal, and invoices are generated from approved time — so you only ever pay for hours you've signed off on.",
	],
	// professionals
	[
		"professional",
		"How do I get started?",
		"Create a free profile, then complete onboarding: your experience, résumé, licenses and documents, and your availability. Once our team approves your profile you can start claiming shifts and applying for permanent roles.",
	],
	[
		"professional",
		"How and when do I get paid?",
		"Weekly, by direct deposit. And because DTSS is your employer for temp work, you get **one W-2** at tax time — not one from every office you've worked in.",
	],
	[
		"professional",
		"Do I choose where and when I work?",
		"Yes. You set your availability and pick the shifts and offices that suit you — one day, three days or five weeks. No early-morning calls begging you to get to an office ASAP.",
	],
	[
		"professional",
		"Can a temp job turn into a permanent position?",
		"Absolutely. Many of our placements are temp-to-perm, and we also list permanent openings. If you want a permanent home office, we'll help you find it.",
	],
	[
		"professional",
		"What roles do you staff?",
		"Dental hygienists, dental assistants, floaters, front office and insurance billing staff, dental lab technicians and dentists.",
	],
	[
		"professional",
		"Can I see open jobs before I sign up?",
		"Yes — browse current temp shifts and permanent positions on our [job board](/jobs). Practice details and exact locations are shared once you create a free account and are approved.",
	],
	// affiliates
	[
		"affiliate",
		"Who can become a DTSS affiliate?",
		"Practices and professionals who already work with us can join from the settings page in their own portal. Dental schools, suppliers, consultants and other outside partners can apply for a partner account — every application is reviewed by our team.",
	],
	[
		"affiliate",
		"How do I earn?",
		"You earn a commission of **2.5%** of the regular hours billed on paid temporary-shift invoices for the practices and professionals you refer. Overtime hours and permanent placement fees aren't included.",
	],
	[
		"affiliate",
		"How does a referral get credited to me?",
		"Share your personal referral link. When someone clicks it we remember the referral for 90 days, so if they sign up within that window — as a practice or a professional — they're credited to you. If someone was referred by more than one partner, the first referral wins.",
	],
	[
		"affiliate",
		"When and how am I paid?",
		"Commission earned on invoices paid in a given month is paid out on the 1st of the month after next, directly to your bank account through our payments provider. The minimum payout is $25 — smaller balances roll over to the next cycle.",
	],
	[
		"affiliate",
		"Can I refer myself?",
		"No. Self-referrals aren't credited, including referrals to an email address that's a variation of your own.",
	],
	[
		"affiliate",
		"Where do I track my referrals and earnings?",
		"In the Partner Portal, where you can see your referrals, commission earned, and payout history in real time.",
	],
];

const TESTIMONIALS = [
	{
		name: "Dr. Richard Calvo",
		role: "Dentist",
		audience: "practice",
		featured: true,
		rating: 5,
		quote:
			"I would like to give my gratitude and recommendation for DTSS. We found ourselves in need of a dental assistant during the busiest time of the dental year. Shannon at DTSS was great. She was both very professional and extremely knowledgeable. She knew exactly what to ask about the type of assistant we would need for the day. She and her team exceeded our expectations, and as a result our day ran perfectly. Shannon will be my first call in the future should we find we have a staffing need.",
	},
	{
		name: "Vicki M.",
		role: "Hygienist of 26 years · 2014 Sunstar distinguished hygienist & past president of the WSDHA",
		audience: "professional",
		featured: true,
		rating: 5,
		quote:
			"I have worked with several agencies but the one I find to be the best is DTSS! Dental Temps Staffing Solutions allows me to be in control of my schedule and they direct deposit my earnings into my bank account weekly. Years ago I had over 40 W-2 forms to file my taxes with, now with DTSS, I have one. I pick what office I want to work in and the days. Also, NO early morning phone calls begging you to get up and be at an office ASAP.",
	},
	{
		name: "Shelley L.",
		role: "Receptionist",
		audience: "practice",
		featured: true,
		rating: 5,
		quote:
			"Shannon goes above and beyond what is expected of her. She is amazing, and what she did to help us out when in a pinch was unbelievable. I have never seen another company do that. Top quality customer service for sure.",
	},
	{
		name: "Marianne P.",
		role: "Dental Assistant of 19 years",
		audience: "professional",
		featured: true,
		rating: 5,
		quote:
			"This has been the best experience I have ever had with a temp agency. Shannon takes the time to meet you and thoroughly explain their process. You are paid exactly what you are owed and exactly when you are owed it. I absolutely love their platform! The software makes everything simple.",
	},
	{
		name: "Dr. Katie Rowley",
		role: "Dentist",
		audience: "practice",
		featured: true,
		rating: 5,
		quote:
			"This is a fantastic way to fill staffing needs. Thanks for designing a better way to do this around here!",
	},
	{
		name: "Carolyn H.",
		role: "RDH",
		audience: "professional",
		featured: true,
		rating: 5,
		quote:
			"Shannon has simplified the staffing process, which makes things easy for me. She kept me busy when I needed it most, and the best thing was, she paid me weekly via direct deposit, no hassles. I just love her and the others at DTSS.",
	},
	{
		name: "Tara P.",
		role: "Office Manager",
		organization: "East Side Family & Cosmetic Dentistry",
		audience: "practice",
		featured: false,
		rating: 5,
		quote:
			"Shannon was an asset to our office during our transition. She provided a seamless switch for us, which was greatly appreciated.",
	},
	{
		name: "Paul D.",
		role: "DMD",
		audience: "practice",
		featured: false,
		rating: 5,
		quote:
			"I have been using Dental Temps staffing for some time now. I would definitely recommend their services. They are very professional and always get back to you! 5 stars for me!",
	},
	{
		name: "MarieLisa",
		role: "Office Manager",
		audience: "practice",
		featured: false,
		rating: 5,
		quote:
			"I had such an awesome experience with DTSS starting the day I signed up with them. They made me feel so welcome! I'm truly excited with their company's vision in the future of dentistry!",
	},
	{
		name: "S.B.",
		role: "Dental Assistant",
		audience: "professional",
		featured: false,
		rating: 5,
		quote:
			"Dental Temps' friendly staff put me to work when I needed the extra money. I believe they will do well, and their IT platform is cool too.",
	},
	{
		name: "Cheyanne K.",
		role: "Dental Professional",
		audience: "professional",
		featured: false,
		rating: 5,
		quote:
			"It has been great working for this company and I appreciate you and everyone keeping me so busy. Thank you so much! You are all so great!",
	},
];

const TEAM = [
	{
		name: "Shannon Cole",
		role: "Co-Founder & Director of Staffing",
		bio: "Shannon began her dental career in Miami, Florida in 1981 and has worked with, and for, some of the best dentists in the industry. After completing her Bachelor of Science in Health Administration, she saw the unique staffing needs of the dental industry and built a company to meet them. Shannon has participated in courses at the Pankey Institute and The Nash Institute, and belongs to the American Dental Assistants Association and the National Association of Professional Women. Outside the office she enjoys the outdoors, advocating for nonprofits, traveling and time with her family.",
	},
	{
		name: "Brett Cole",
		role: "Co-Founder & CEO",
		bio: "Brett began serving his country at 17 and has spent most of his career in aerospace, ensuring compliance with industry, regulatory, contractual and technical requirements. After his wife Shannon started DTSS, Brett joined the venture and built the company's OnDemand Workforce Management platform — giving practices and professionals a premium experience that maximizes value, efficiency and quality of life.",
	},
	{
		name: "Kevin McGahey",
		role: "Chief Financial Officer",
		bio: "Kevin is an experienced CFO with a history across staffing, HR, PEO, employee leasing and healthcare companies including Snelling Staffing, Staff One, HealthSmart and QVL Holdings — with deep experience in multi-state operations, payroll, benefits administration, compliance and high-growth finance.",
	},
	{
		name: "Shannon Horton",
		role: "Area Manager — Southeast Florida",
		bio: "Shannon Horton brings 17 years of dental staffing experience. She began at her father's staffing company and owned her own staffing firm for seven years before joining DTSS. A South Florida resident for 24 years and a mother of four and grandmother of five, she loves time with family and friends.",
	},
];

const LOCATIONS = [
	{
		region: "Northern Florida",
		state: "FL",
		cities: "Jacksonville · Tallahassee",
		contact_name: "Shannon Cole",
		extension: "1001",
		sms: "360-654-6512",
	},
	{
		region: "Southeast Florida",
		state: "FL",
		cities: "West Palm Beach to Miami",
		contact_name: "Shannon Horton",
		extension: "1002",
		sms: "954-228-2357",
	},
	{
		region: "Central-West Florida",
		state: "FL",
		cities: "Tampa · Orlando",
		contact_name: "Jessica Dennis",
		extension: "1011",
		sms: "863-215-6700",
	},
	{
		region: "Western Washington",
		state: "WA",
		cities: "Bellingham · Seattle · Olympia",
		contact_name: "Shannon Cole",
		extension: "1001",
		sms: "360-654-6512",
	},
	{
		region: "Eastern Washington",
		state: "WA",
		cities: "Tri-Cities · Spokane",
		contact_name: "Shannon Cole",
		extension: "1001",
		sms: "360-654-6512",
	},
	{
		region: "Dallas / Ft. Worth",
		state: "TX",
		cities: "Dallas · Fort Worth",
		contact_name: "Jessica Dennis",
		extension: "1011",
		sms: "863-215-6700",
	},
	{
		region: "Chicago",
		state: "IL",
		cities: "Chicago metro",
		contact_name: "Shannon Cole",
		extension: "1001",
		sms: "360-654-6512",
	},
];

const PAGES = [
	{ slug: "privacy", title: "Privacy Policy", content: legal("privacy") },
	{ slug: "terms", title: "Terms & Conditions", content: legal("terms") },
	{ slug: "disclaimers", title: "Disclaimers", content: legal("disclaimers") },
];

const seed = {
	$schema: "https://emdashcms.com/seed.schema.json",
	version: "1",
	meta: {
		name: "DTSS marketing site",
		description:
			"Collections and starter content for www.dtstaffingsolutions.com",
		author: "Extensibl Media",
	},
	settings: {
		title: "Dental Temps Staffing Solutions",
		tagline: "You do dentistry. We do talent.",
	},
	collections,
	taxonomies: [
		{
			name: "category",
			label: "Categories",
			labelSingular: "Category",
			hierarchical: false,
			collections: ["posts"],
			terms: [
				{ slug: "hiring-tips", label: "Hiring Tips" },
				{ slug: "perfecting-your-practice", label: "Perfecting Your Practice" },
				{ slug: "career-advice", label: "Career Advice" },
				{ slug: "news", label: "News" },
			],
		},
	],
	content: {
		faqs: entries("faqs", FAQS, ([audience, question, answer], i) => ({
			question,
			answer: md(answer),
			audience,
			sort_order: (i + 1) * 10,
		})),
		testimonials: entries("testimonials", TESTIMONIALS, (t, i) => ({
			...t,
			sort_order: (i + 1) * 10,
		})),
		team: entries("team", TEAM, (t, i) => ({ ...t, sort_order: (i + 1) * 10 })),
		locations: entries("locations", LOCATIONS, (l, i) => ({
			...l,
			sort_order: (i + 1) * 10,
		})),
		pages: entries("pages", PAGES, (p) => ({
			title: p.title,
			content: p.content,
		})),
	},
};

writeFileSync(
	resolve(root, "seed/seed.json"),
	JSON.stringify(seed, null, "\t") + "\n"
);
console.log(
	`seed/seed.json written: ${collections.length} collections, ` +
		Object.entries(seed.content)
			.map(([k, v]) => `${v.length} ${k}`)
			.join(", ")
);
