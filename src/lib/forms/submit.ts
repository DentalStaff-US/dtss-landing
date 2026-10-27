/**
 * The ONE place lead/contact submissions leave the site.
 *
 * Today this posts to Web3Forms (email to the DTSS inbox). When the CRM /
 * email-marketing tool is chosen, swap the adapter below — every form on the
 * site calls submitLead() and never talks to a provider directly.
 */

export type LeadAudience =
	| "practice"
	| "professional"
	| "affiliate"
	| "general";

export type LeadKind =
	| "contact"
	| "staffing-request"
	| "partner-enquiry"
	| "affiliate-waitlist"
	| "job-alert";

export interface LeadPayload {
	kind: LeadKind;
	audience: LeadAudience;
	name: string;
	email: string;
	phone?: string;
	organization?: string;
	location?: string;
	message?: string;
	/** Free-form extras (discipline, start date, …) included verbatim. */
	extra?: Record<string, string>;
	/** Honeypot — real users never fill it. */
	botcheck?: boolean;
}

export interface LeadResult {
	ok: boolean;
	error?: string;
}

const SUBJECTS: Record<LeadKind, string> = {
	contact: "New website enquiry",
	"staffing-request": "New staffing request (practice)",
	"partner-enquiry": "New partner / affiliate enquiry",
	"affiliate-waitlist": "Affiliate program waitlist sign-up",
	"job-alert": "Job alert sign-up (professional)",
};

interface Attribution {
	ref: string | null;
	utm: Record<string, string>;
	page: string;
}

function attribution(): Attribution {
	const w = window as unknown as {
		__dtss?: { ref: string | null; utm: Record<string, string> };
	};
	return {
		ref: w.__dtss?.ref ?? null,
		utm: w.__dtss?.utm ?? {},
		page: location.pathname + location.search,
	};
}

// ---------------------------------------------------------------------------
// Adapter: Web3Forms
// ---------------------------------------------------------------------------
async function sendViaWeb3Forms(
	accessKey: string,
	lead: LeadPayload,
	attr: Attribution
): Promise<LeadResult> {
	const body: Record<string, string | boolean> = {
		access_key: accessKey,
		subject: `${SUBJECTS[lead.kind]} — ${lead.name}`,
		from_name: lead.name,
		email: lead.email,
		botcheck: Boolean(lead.botcheck),
		"Enquiry type": lead.kind,
		Audience: lead.audience,
	};
	if (lead.phone) body.Phone = lead.phone;
	if (lead.organization) body["Practice / organization"] = lead.organization;
	if (lead.location) body.Location = lead.location;
	if (lead.message) body.message = lead.message;
	for (const [k, v] of Object.entries(lead.extra ?? {})) if (v) body[k] = v;
	body.Page = attr.page;
	if (attr.ref) body["Referral code"] = attr.ref;
	for (const [k, v] of Object.entries(attr.utm)) body[k] = v;

	try {
		const res = await fetch("https://api.web3forms.com/submit", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(body),
		});
		const data = (await res.json().catch(() => ({}))) as {
			success?: boolean;
			message?: string;
		};
		if (res.ok && data.success) return { ok: true };
		return {
			ok: false,
			error: data.message || "We couldn't send your message. Please try again.",
		};
	} catch {
		return {
			ok: false,
			error: "Network error — please check your connection and try again.",
		};
	}
}

export async function submitLead(
	accessKey: string,
	lead: LeadPayload
): Promise<LeadResult> {
	if (lead.botcheck) return { ok: true }; // silently drop bots
	const result = await sendViaWeb3Forms(accessKey, lead, attribution());
	if (result.ok) {
		const ph = (
			window as unknown as {
				posthog?: { capture: (e: string, p?: object) => void };
			}
		).posthog;
		ph?.capture("lead_submitted", { kind: lead.kind, audience: lead.audience });
	}
	return result;
}
