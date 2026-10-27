export interface SEOProps {
	/** Page title; " | DTSS" is appended unless `rawTitle` is set. */
	title?: string;
	rawTitle?: boolean;
	description?: string;
	canonicalURL?: string;
	ogImage?: string;
	ogType?: "website" | "article";
	noindex?: boolean;
	/** Extra JSON-LD objects for this page (Organization is always emitted). */
	jsonLd?: Record<string, unknown>[];
	/** Breadcrumb trail (Home is implied) → BreadcrumbList JSON-LD. */
	breadcrumbs?: { name: string; href: string }[];
	publishedTime?: string;
	modifiedTime?: string;
}
