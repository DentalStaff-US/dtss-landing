# dtss-landing

The public marketing site for Dental Temps Staffing Solutions (www.dtstaffingsolutions.com).

It is an Astro 6 server-rendered site on the Node adapter. Content is edited in **EmDash CMS**. The job board reads from the admin app's public API.

## Quick start

```bash
cp .env.example .env     # fill in what you need; most of it is optional locally
npm install
npm run dev              # http://localhost:4321
```

- With no `EMDASH_DATABASE_URL`, the CMS uses a local SQLite file at `.emdash/dev.db`.
- Open `/_emdash/admin`. The first run walks you through setup and offers to apply `seed/seed.json`, which creates the collections and the starter content.
- To apply the seed from the CLI instead, run `npm run seed:apply -- --database ./.emdash/dev.db`.

## Scripts

| Script | What it does |
|---|---|
| `dev` / `build` / `preview` | The standard Astro commands |
| `start` | Runs the built server (`node dist/server/entry.mjs`). Railway uses this. |
| `check` | Runs `astro check`, ESLint and the Prettier check |
| `seed:build` | Regenerates `seed/seed.json` from `scripts/build-seed.mjs` |
| `seed:apply` | Runs `emdash seed seed/seed.json` |
| `og:build` | Regenerates `public/og-image.png` |

## How it fits together

| Concern | Where |
|---|---|
| Design tokens (the admin app's shadcn theme, plus the candidate app's teal as `pro`) | `src/styles/global.css` |
| Links into the apps (always go through `appLink()`) | `src/lib/links.ts` |
| Referral attribution: `dtss_ref` cookie, first touch wins | `src/lib/referral.ts` (server) and `src/components/AttributionScript.astro` (browser) |
| Job → sign-up hand-off: `dtss_job` cookie, last touch wins | `src/components/jobs/JobIntentScript.astro` |
| Every form submission (Web3Forms today, CRM next) | `src/lib/forms/submit.ts` |
| CMS reads (typed, fail-soft) | `src/lib/cms.ts` |
| Job board API client | `src/lib/jobs.ts` |
| Old WordPress URL redirects | `src/config/redirects.mjs` |
| Cache headers, Permissions-Policy | `src/middleware.ts` |

### Shared contracts (keep these in sync)

- **`dtss_ref` cookie**
  - Value: `CODE|ISO8601` (raw), on `PUBLIC_COOKIE_DOMAIN`, 90 days, first touch wins.
  - Must match `dental-staff-app/src/lib/server/affiliate/cookie.ts`, `dtss-candidate-app/src/lib/server/affiliate/refCookie.ts` and `dtss-affiliate-app/src/lib/server/refCookie.ts`.
- **`dtss_job` cookie**
  - Value: `<publicId>|ISO8601`, 7 days, last touch wins.
  - Read by `dtss-candidate-app/src/lib/server/jobIntent.ts`, which sends the new user to that job after onboarding.
- **Job DTO**
  - An allowlist built in `dental-staff-app/src/lib/server/publicJobs/mask.ts`. `src/lib/jobs.ts` mirrors its types.
  - The practice's name, street address and coordinates never reach this site.

### CMS collections

The schema is defined in `scripts/build-seed.mjs`, which writes `seed/seed.json`.

| Collection | Used on |
|---|---|
| `posts` (+ `category` taxonomy) | `/blog`, home, resources |
| `faqs` (audience: general / practice / professional / affiliate) | `/faq` and each audience page |
| `testimonials` (`featured` → home page) | home, `/testimonials`, audience pages |
| `team` | `/about`, `/about/team` |
| `locations` | `/locations`, `/contact` |
| `pages` | `/privacy`, `/terms`, `/disclaimers`. Falls back to `seed/legal/*.md` if missing. |

**Blog migration:** import the 20 old WordPress posts with the EmDash admin's WordPress import wizard (WXR export or REST API). The old root-level post URLs already 301 to `/blog/<slug>`.

## Deploying (Railway)

**One CMS database serves every instance** (staging and production): content is edited once and appears everywhere.

1. Create a Node service per environment. Build command: `npm run build`. Start command: `npm start`.
2. Set every variable in `.env.example`. The production build refuses to run without the app URLs, `PUBLIC_COOKIE_DOMAIN`, `EMDASH_DATABASE_URL` and `S3_BUCKET`.
3. **Shared across all instances (identical values):**
   - `EMDASH_DATABASE_URL`: the one Railway **CMS** Postgres, never the app database. Append `?sslmode=no-verify` on Railway's public proxy.
   - `EMDASH_ENCRYPTION_KEY`: back it up. Plugin secrets can't be decrypted without it.
   - `S3_*`: the same bucket, since media rows reference its keys.
4. **Per instance:**
   - `EMDASH_SITE_URL`: the origin users open, e.g. `https://www.dtstaffingsolutions.com` or the staging URL. It drives editor passkeys, CSRF and redirects.
   - The app URLs: staging points at staging apps.
5. **Upgrading EmDash:** it's pinned to an exact version on purpose. Upgrade it on every instance in the same deploy, because a newer instance would migrate the shared schema under an older one.
6. **Editing:** content edits appear on the instance they were made on immediately, and on the others within about 60 seconds (the per-process cache TTL). Passkeys are tied to the origin they were registered on, so editors should sign in on one canonical instance (production).
7. In `dental-staff-app`, set `PUBLIC_JOB_BOARD_ENABLED=true`, `PUBLIC_MARKETING_URL` (this instance's origin) and a shared `JOB_BOARD_SERVER_KEY` (the same value here).
