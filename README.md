# PortfolioPath

PortfolioPath is a bilingual, evidence-first SaaS MVP for Turkish high-school students building authentic portfolio projects for international university applications.

> Build documented university portfolio projects—not artificial extracurricular activities.

The application separates planned work, student-reported work, submitted evidence, counselor review, and counselor-confirmed skills. It does not generate recommendation letters, admissions predictions, fabricated achievements, or unsupported impact claims.

## What is included

- English and Turkish public pages, authentication, legal/ethical pages, and pricing
- Student onboarding, deterministic three-idea generator, ten-step project wizard, project workspace, weekly planner, evidence vault, reflections, skills, feedback, portfolio, presentation, recommendation-evidence, PDF, sharing, and billing surfaces
- Counselor roster, queue, proposal/task/evidence/reflection review, skill confirmation, comments, ethical flags, progress summaries, and subscription surface
- Minimal administrator account, assignment, category, template, plan, flag, suspension, and settings surfaces
- Supabase Auth/Postgres/Storage with RLS, explicit grants, append-only audit events, demo accounts, and five demo projects
- Server-only deterministic generation and Stripe-compatible/test payment interfaces
- Unit, database/RLS, and browser acceptance tests

Excluded by design: parent/school accounts, cohorts, team projects, mentor accounts, school analytics, social features, chat/video, points/badges, scoring, admissions predictions, university matching, white-labeling, and automated recommendation letters.

## Stack

- Next.js App Router, React, and TypeScript
- Tailwind CSS and shadcn/ui primitives
- Supabase Auth, PostgreSQL, private Storage, and local Docker stack
- next-intl request configuration for English/Turkish
- React Hook Form + Zod
- Deterministic `GenerationProvider`
- Local test and Stripe-compatible `PaymentProvider`
- React PDF renderer
- Node test runner, pgTAP, and Playwright

## Local setup

Requirements: Node.js 20+, npm, Docker Desktop, and Git.

1. Install dependencies.

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local`.

3. Start Docker Desktop, then start the low-memory Supabase profile and seed it.

   ```bash
   npm run db:start:lite
   npm run db:reset
   ```

4. Copy the `PUBLISHABLE_KEY` and `SECRET_KEY` printed by `db:start` into `.env.local`.

5. Start the web application.

   ```bash
   npm run dev
   ```

6. Open `http://127.0.0.1:3000/en` or `/tr`.

The lite profile keeps PostgreSQL, Auth, REST, Storage, and the API gateway. It leaves Studio, Realtime, local mail preview, image transformation, Edge Functions, analytics/logging, and connection pooling off to reduce memory use. Use `npm run db:start` when you specifically need the full local stack; Supabase Studio is then available at `http://127.0.0.1:54323` and local mail at `http://127.0.0.1:54324`.

Stop the local database with `npm run db:stop`. It preserves your local data. After stopping Docker Desktop, `wsl --shutdown` in PowerShell releases the remaining WSL virtual-machine memory. The Supabase CLI still uses Docker for local development; to avoid Docker entirely, point `.env.local` at a hosted Supabase development project and run only `npm run dev`.

### Demo credentials

All local accounts use `Portfolio123!`.

| Role | Email |
|---|---|
| Student | `student@demo.portfoliopath.example.com` |
| Approved counselor | `counselor@demo.portfoliopath.example.com` |
| Administrator | `admin@demo.portfoliopath.example.com` |

The seed includes Marine Observation, Local Tourism Website, Sports Leadership Documentation, Environmental Awareness, and Small Student Research projects. Evidence URLs are inert demo metadata; original production uploads always use the private `evidence` bucket.

## Environment variables

Required in production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (server only)
- `NEXT_PUBLIC_APP_URL`
- `SHARE_TOKEN_SECRET` (at least 32 random characters)

Generation defaults to `template`. Payments default to `test`. To enable Stripe-compatible checkout, set `PAYMENT_PROVIDER=stripe`, the Stripe secret/webhook values, and the three price IDs listed in `.env.example`.

Never expose the Supabase secret key or Stripe secret to the browser. Never commit `.env.local`.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Local Next.js server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript validation |
| `npm run lint` | ESLint with zero warnings |
| `npm test` | Unit tests |
| `npm run test:e2e` | Playwright public/browser journeys |
| `npm run db:start:lite` | Start low-memory local Supabase (recommended) |
| `npm run db:start` | Start the full local Supabase stack |
| `npm run db:stop` | Stop local Supabase and preserve its data |
| `npm run db:reset` | Recreate schema and seed |
| `npm run db:test` | pgTAP schema and RLS role tests |
| `npm run db:types` | Regenerate Supabase database types |
| `npm run bootstrap-admin` | Create a production administrator using server credentials |

## Database and storage

The migration is in `supabase/migrations/20260805013259_initial_portfoliopath_schema.sql`; demo data is in `supabase/seed.sql`.

- Every exposed user-owned table has RLS.
- Students see their records only.
- Approved counselors see active assignments only.
- Pending and unassigned counselors see no student projects.
- Administrators can inspect evidence only when it belongs to an open/reviewing content flag.
- Storage objects are private and scoped as `{studentId}/{projectId}/{uuid}-{safeFileName}`.
- Upload routes validate ownership, plan access, MIME type, extension, and 25 MiB limit before issuing short-lived signed URLs.
- Share links store a SHA-256 token hash, default to 30 days in the UI, cap at 90 days, and can be revoked immediately.
- Audit records have no client insert/update/delete grants and are written by database triggers.

## Generation and ethical behavior

`GenerationProvider` returns structured data with source record IDs, warnings, an editable-guidance label, and a factual-confirmation requirement. The launch provider is deterministic and does not call a live model.

Project suggestions are explicitly future plans. Recommendation evidence includes the required warning and is not a letter. Unsupported superlatives are blocked before project submission. Publishing, PDF export, and sharing require factual-accuracy confirmation.

## Payments

`PaymentProvider` has local and Stripe-compatible implementations. Checkout is server-authorized by role. Webhooks are signature-verified by the selected provider, deduplicated by provider event ID, and write server-owned payment/subscription records. The seeded prices are:

- Free Assessment: ₺0
- Project Blueprint: ₺1,200 one-time
- Complete Student Portfolio: ₺5,500 one-time
- Counselor Professional: ₺2,500/month, 25 active assignments

## Admin product and commercial insights

The administrator overview reads live aggregate data from an administrator-only database function. It shows the student activation funnel, projects/evidence/portfolio activity, pending operational work, active paid accounts, active plan mix, and recognized TRY payment revenue. Revenue includes only completed payment records and does not invent forecasts.

The endpoint never returns student names, reflections, evidence files, or evidence content. Marketing attribution and page-level behavior are not inferred. A consent-aware analytics provider can be added later if acquisition-channel and campaign analysis becomes necessary for selling the product.

## Deployment: Vercel + hosted Supabase

1. Create a hosted Supabase project and link the CLI.
2. Apply migrations with `supabase db push`; seed production templates/plans separately. Do not seed demo auth users in production.
3. Create the private `evidence` bucket with the migration settings and verify RLS.
4. Configure Supabase Auth redirect URLs for the Vercel production and preview domains.
5. Add all required environment variables to Vercel. Keep server secrets out of preview environments unless needed.
6. Run `BOOTSTRAP_ADMIN_EMAIL=... BOOTSTRAP_ADMIN_PASSWORD=... npm run bootstrap-admin` once from a protected operator environment.
7. Configure Stripe products/prices and point its webhook to `/api/billing/webhook`.
8. Deploy to Vercel, run the checklist below, then rotate bootstrap credentials.

Deployment rehearsal acceptance: `npm run build`, migration push/reset on staging, auth callback, signed upload/download, test checkout/webhook, PDF, share expiry/revocation, and role isolation must all pass before production promotion.

## Test checklist

- [x] Type checking, linting, production build
- [x] Unit tests: schemas/domain helpers, lifecycle, entitlements, ethics, tokens, source filtering, generation, file validation
- [x] Clean Supabase reset and seed
- [x] pgTAP: RLS enabled, policies present, student, unrelated user, assigned/unassigned/pending counselor, administrator, anonymous
- [x] Local Playwright: public routes, role-gated login, desktop/mobile layouts, and visual captures
- [ ] Rerun Playwright on each deployment target
- [ ] Student: signup → onboarding → ideas → wizard → evidence/reflection → portfolio share/revoke
- [ ] Counselor: signup → approval → assignment → proposal/evidence review → skill confirmation
- [ ] Admin: activation → assignment → template/plan/flag/suspension
- [ ] Billing: plan limits, test checkout, repeated webhook, upgrade, portal/cancellation
- [ ] Security: MIME spoofing, oversized upload, cross-student object access, XSS, unsupported URL, expired/revoked token
- [ ] Accessibility: keyboard, visible focus, headings, contrast, reduced motion, loading/error/empty states, mobile, Turkish overflow

See `docs/ARCHITECTURE.md` and `docs/SECURITY.md` for implementation boundaries.
