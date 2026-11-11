/**
 * Referral program terms, read from the admin app (Admin → Affiliates) so the
 * site never advertises a rate the program doesn't pay. Fallback values must
 * match the live settings; they only show while the admin API is unreachable.
 */
import { getPublic } from "./publicApi";

export interface ReferralTerms {
	referralCommissionPercent: number;
	referralPayoutMinimum: number;
}

const FALLBACK: ReferralTerms = {
	referralCommissionPercent: 3,
	referralPayoutMinimum: 25,
};

// A failed fetch isn't cached by getPublic; don't make every render wait on a
// down API for a sentence of copy.
const RETRY_AFTER_MS = 60_000;
let failedAt = 0;

export async function getReferralTerms(): Promise<ReferralTerms> {
	if (Date.now() - failedAt < RETRY_AFTER_MS) return FALLBACK;
	const res = await getPublic<ReferralTerms>("/program");
	if (res.ok && Number.isFinite(res.data.referralCommissionPercent))
		return res.data;
	failedAt = Date.now();
	return FALLBACK;
}

/** 3 → "3%", 2.5 → "2.5%". */
export const percent = (n: number) => `${Number(n.toFixed(2))}%`;

/** 25 → "$25", 12.5 → "$12.50". */
export const dollars = (n: number) =>
	Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
