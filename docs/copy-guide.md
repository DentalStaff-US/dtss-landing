# Marketing site copy guide

For anyone writing or editing copy on this site, in code or in the CMS.

## Voice

- **Plain and specific.** Say what happens: "Direct deposit every week", not "seamless pay experience".
- **Warm, without slogans.** Write like a person who knows dental offices. Borrow the words customers use in testimonials.
- **Avoid:** "reimagined", "seamless", "whole new experience", "small-town feel" outside the About page, em dashes, and paired slogans like "Software that's fast. People who care."
- **The one slogan:** "You do dentistry. We do talent."

## Structure

- **Talk to one audience at a time, practices first.** Don't mix practices and professionals within one section, except for the site-wide CTA band and referral band.
- **Each audience's story runs in this order:** the problem, how it works, what they get, proof, then one clear next step.
- **Colors follow the audience:** blue for practices, teal for professionals, navy for referral partners.
- **Words:** "dental professionals" or "professionals", not "pros". "Practices", not "clients".

## People

- **Shannon appears only in testimonials and on the About section (including the team page).** Don't build other pages around the founder.
- Region contact listings on `/locations` and `/contact` are working contact details from the CMS, and keep their names for now.

## Approved claims

| Claim | Status | Note |
|---|---|---|
| "You pay only for approved hours" | Approved | Approval can be implicit, as the terms cover. Don't say "hours you've signed off on" or "every timesheet you review" |
| "We back our placements with a guarantee" | Approved | From the previous site. **Direct placement only** |
| "Replacement at no charge" | Retired | Belonged to temp-to-perm, which is no longer an offering. Don't use |
| "Every region has a staffing manager" | Approved | More dedicated managers are planned |
| Weekly pay by direct deposit | Confirmed | |
| Referral rewards | Confirmed | Rate and payout minimum come from Admin → Affiliates through `getReferralTerms()` (`src/lib/program.ts`); never type them into copy or CMS content. 3% of regular hours on paid temp-shift invoices as of November 2026. 90-day referral window, $25 minimum, paid on the 1st of the month after next. Excludes overtime and permanent placement fees. Show the waitlist until `PUBLIC_AFFILIATE_PROGRAM_LIVE=true` |

## Don't use

- **"Federally compliant hiring."** Use "E-Verify participant", which says what can be verified.
- **"Assigned in minutes" or any timed promise for filling a shift.** The November 2026 baseline doesn't support it (design docs, chapter 10 §5b). Say that professionals are notified right away and that our team steps in when it's urgent. Use "assigned", not "claimed". Revisit once the metric has more data.
- **Workforce management, HR consulting, benefits or payroll as a service for a practice's own staff.** Left out for now. Payroll for the temps DTSS employs is fine.
- **General "incentives, rewards and perks" for working shifts.** Rewards means the referral program.
- **Specific speed figures in mockups,** such as "filled 4 minutes after posting", unless they're measured.
- **"Temp-to-perm" or "try before you hire".** The offerings are temporary staffing, permanent positions and direct placement. A temp becoming a permanent hire is something that can happen naturally, so say "if a temp turns out to be the one, you can hire them permanently", not a named service.
- **A list of states in the home hero.** Service areas belong on `/locations` and in the FAQ.
