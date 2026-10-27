import { appLink } from "@/lib/links";

export interface NavLink {
	label: string;
	href: string;
	description?: string;
	icon?: string;
}
export interface NavItem {
	label: string;
	href?: string;
	children?: NavLink[];
}

export const MAIN_NAV: NavItem[] = [
	{ label: "For Practices", href: "/practices" },
	{ label: "For Professionals", href: "/professionals" },
	{ label: "Find Jobs", href: "/jobs" },
	{
		label: "About",
		children: [
			{
				label: "About DTSS",
				href: "/about",
				description: "Our story and how we work",
				icon: "tabler:heart-handshake",
			},
			{
				label: "Meet the Team",
				href: "/about/team",
				description: "The people behind every placement",
				icon: "tabler:users",
			},
			{
				label: "Locations",
				href: "/locations",
				description: "Where we staff today",
				icon: "tabler:map-pin",
			},
			{
				label: "Testimonials",
				href: "/testimonials",
				description: "Hear from practices and pros",
				icon: "tabler:message-heart",
			},
			{
				label: "Affiliate Program",
				href: "/affiliates",
				description: "Earn by referring practices and pros",
				icon: "tabler:share",
			},
		],
	},
	{
		label: "Resources",
		children: [
			{
				label: "Blog",
				href: "/blog",
				description: "Hiring tips and career advice",
				icon: "tabler:news",
			},
			{
				label: "FAQ",
				href: "/faq",
				description: "Answers for practices and pros",
				icon: "tabler:help-circle",
			},
			{
				label: "Partner Resources",
				href: "/resources",
				description: "Tools we recommend",
				icon: "tabler:tool",
			},
		],
	},
	{ label: "Contact", href: "/contact" },
];

export const SIGN_IN_LINKS: NavLink[] = [
	{
		label: "Practice portal",
		href: appLink("practice", "sign-in"),
		description: "Dental offices & staff",
		icon: "tabler:building-hospital",
	},
	{
		label: "Professional portal",
		href: appLink("pro", "sign-in"),
		description: "Hygienists, assistants & more",
		icon: "tabler:stethoscope",
	},
	{
		label: "Partner portal",
		href: appLink("partner", "sign-in"),
		description: "Affiliates & referral partners",
		icon: "tabler:share",
	},
];

export const FOOTER_NAV: { title: string; links: NavLink[] }[] = [
	{
		title: "Practices",
		links: [
			{ label: "Dental staffing solutions", href: "/practices" },
			{ label: "Request staff", href: "/practices#request" },
			{
				label: "Create a practice account",
				href: appLink("practice", "sign-up"),
			},
			{ label: "Practice FAQ", href: "/faq#practices" },
		],
	},
	{
		title: "Professionals",
		links: [
			{ label: "Work with DTSS", href: "/professionals" },
			{ label: "Browse open jobs", href: "/jobs" },
			{ label: "Temp shifts", href: "/jobs?type=temp" },
			{ label: "Permanent positions", href: "/jobs?type=perm" },
			{ label: "Create a free profile", href: appLink("pro", "sign-up") },
		],
	},
	{
		title: "Company",
		links: [
			{ label: "About us", href: "/about" },
			{ label: "Our team", href: "/about/team" },
			{ label: "Locations", href: "/locations" },
			{ label: "Testimonials", href: "/testimonials" },
			{ label: "Affiliate program", href: "/affiliates" },
		],
	},
	{
		title: "Resources",
		links: [
			{ label: "Blog", href: "/blog" },
			{ label: "FAQ", href: "/faq" },
			{ label: "Partner resources", href: "/resources" },
			{ label: "Contact us", href: "/contact" },
		],
	},
];
