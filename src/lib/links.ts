import { ENV } from "./env";

export type Audience = "practice" | "pro" | "partner";
export type AppAction = "sign-up" | "sign-in" | "apply";

/**
 * Every CTA into the apps goes through here, so the URL shapes live in one
 * place. Referral codes and UTMs are appended client-side by
 * AttributionScript (pages may be cached, so the server can't know them).
 */
export function appLink(
	audience: Audience,
	action: AppAction,
	params: Record<string, string | undefined> = {}
): string {
	let url: URL;
	if (audience === "practice") {
		url = new URL(
			action === "sign-in" ? "/auth/sign-in" : "/auth/sign-up",
			ENV.practiceAppUrl
		);
	} else if (audience === "pro") {
		url = new URL(
			action === "sign-in" ? "/auth/sign-in" : "/auth/sign-up",
			ENV.professionalAppUrl
		);
	} else {
		// Outside partners apply on the admin app; everyone signs in on the portal.
		url =
			action === "sign-in"
				? new URL("/auth/sign-in", ENV.partnerPortalUrl)
				: new URL("/partners/apply", ENV.practiceAppUrl);
	}
	for (const [k, v] of Object.entries(params))
		if (v) url.searchParams.set(k, v);
	return url.toString();
}
