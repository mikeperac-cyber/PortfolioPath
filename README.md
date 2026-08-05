# PortfolioPath

PortfolioPath is an evidence-first, bilingual platform for Turkish students preparing authentic university-application projects. It helps students plan real work, keep dated evidence, reflect in their own voice, and present factual outcomes clearly.

> Build documented university portfolio projects—not artificial extracurricular activities.

PortfolioPath never creates fake activities, certificates, mentor comments, recommendation letters, admissions predictions, or unsupported impact claims.

## Product workspaces

- **Student Studio** — onboarding, project ideas, blueprints, planner, evidence vault, reflections, skills, portfolio, application preparation, sharing, and billing.
- **Counselor Practice** — assigned-student review queue, evidence and reflection review, factual feedback, skill confirmations, and progress reports.
- **Parent View** — consented milestones, selected evidence, and counselor updates. Private reflections are never shared by default.
- **Mentor Verification** — narrowly scoped, source-linked verification requests; never a pre-written recommendation.
- **School Workspace** — quote-led annual organizations, seats, cohorts, staff access, templates, and aggregate completion insights.
- **Owner Console** — live, privacy-safe operating metrics; customer access grants; school prospects; safety queue; and an isolated browser-only Student Sandbox.

The Platform Owner is not a billable customer. An owner can switch between Owner Console, Counselor Practice, and an isolated Student Sandbox. Owner-issued **complimentary** or **manual** grants unlock a plan; a **discount** only changes the server-authorized checkout price and never unlocks tools on its own.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, and next-intl
- Hosted Supabase Auth, PostgreSQL, private Storage, RLS, and audited server operations
- Deterministic, source-bound generation provider (a guarded live-model provider can be added later)
- Local test, Stripe-compatible, and iyzico payment adapters
- React PDF, Zod, React Hook Form, TanStack Table, Playwright, and Node tests

## Quick start with hosted Supabase (recommended)

This project does **not** require Docker for day-to-day development or production. A hosted Supabase development project is the lightest option on a Windows machine.

1. Install dependencies.

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local`, then set your hosted project URL, publishable key, and server-only secret key from Supabase.

3. Start the app.

   ```bash
   npm run dev
   ```

4. Open `http://127.0.0.1:3000/en` (or `/tr`).

### Apply hosted database migrations

From the project folder, authenticate and link the hosted Supabase project once:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --linked
```

Then check **Database → Migrations** in the Supabase dashboard. On some Windows setups the CLI may print a Docker warning after completing the remote migration step; confirm the migration list and tables in the dashboard rather than re-running it blindly.

Do not run `supabase/seed.sql` against production: it is local test fixture data only. Production begins with real accounts and the managed categories, templates, skills, and plans.

### Optional local Supabase

Docker is only necessary for a fully local Supabase stack. If you choose to use it, the low-memory profile is available through `npm run db:start:lite`. It is optional and is not required for hosted Supabase, Vercel, or normal local UI work.

## Configure the first owner safely

1. Create your normal PortfolioPath account first.
2. Keep your hosted Supabase URL and server secret in `.env.local` (they are loaded automatically and must never go into source control or a `NEXT_PUBLIC_*` variable).
3. Run the one-time, existing-account-only bootstrap command:

   ```powershell
   $env:BOOTSTRAP_OWNER_EMAIL="you@example.com"
   npm run bootstrap-owner
   ```

The command refuses to create a new account, grants `platform_owner`, `counselor`, and `student` roles to that exact existing account, writes an audit record, and asks you to sign out/in again. It must never be run with an unknown email.

## Environment variables

Required in Vercel and in a hosted local setup:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_APP_URL=
SHARE_TOKEN_SECRET=
GENERATION_PROVIDER=template
PAYMENT_PROVIDER=test
```

`SUPABASE_SECRET_KEY`, payment secrets, and `SHARE_TOKEN_SECRET` are server-only. Do not prefix them with `NEXT_PUBLIC_`; do not commit `.env.local`.

### Payment modes

- `PAYMENT_PROVIDER=test` — full local checkout testing without charging anyone.
- `PAYMENT_PROVIDER=stripe` — keeps the existing Stripe-compatible adapter available.
- `PAYMENT_PROVIDER=iyzico` — uses iyzico hosted checkout for Turkey. Set `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, and `IYZICO_BASE_URL` (`https://sandbox-api.iyzipay.com` while testing). Counselor subscriptions also require `IYZICO_COUNSELOR_PRICING_PLAN_REFERENCE_CODE` from an active iyzico pricing plan.

For iyzico, configure the deployed callback route and signed webhook route in the merchant console:

- Checkout callback: `https://YOUR_DOMAIN/api/billing/iyzico/callback`
- Webhook: `https://YOUR_DOMAIN/api/billing/webhook`

The app verifies provider callbacks and webhooks server-side, records payment sessions idempotently, and never stores card details or billing addresses in the PortfolioPath database. iyzico receives payer details only to perform its hosted checkout.

## Commercial plans

| Customer  | Plan                      | Launch price | Access                                                         |
| --------- | ------------------------- | -----------: | -------------------------------------------------------------- |
| Student   | Free Readiness Assessment |           ₺0 | profile and one direction                                      |
| Student   | Project Blueprint         |  ₺1,200 once | three ideas and one complete blueprint                         |
| Student   | Complete Portfolio        |  ₺5,500 once | up to three projects and the full student suite                |
| Counselor | Counselor Professional    | ₺2,500/month | up to 25 active students, reviews, templates, reports          |
| School    | School Partnership        | annual quote | organization seats, cohorts, counselors, reporting, onboarding |
| Owner     | Internal Owner Access     |           ₺0 | owner tools and intentional per-customer grants                |

Parents and mentors are consent-based participants, not separately sold plans. Schools are quote-led—there is no self-service school checkout.

## Security and privacy boundaries

- Files are private by default in the `evidence` bucket and use short-lived signed URLs.
- Every user-owned table has RLS. Students see only their work; counselors only assigned students; school staff only their organization; mentors only their assigned verification requests.
- Parents can see only consented summaries and selected evidence, never private reflections by default.
- Owner access and sensitive operations are audit logged; commercial aggregate metrics never expose reflection, evidence, or counselor-comment contents.
- Private share links keep only token hashes, default to 30 days, cap at 90 days, and are immediately revocable.
- Generation is source-bound and factual. Plans remain planned until evidence supports completion.

See [architecture notes](docs/ARCHITECTURE.md), [security notes](docs/SECURITY.md), and the [AI and launch specification](docs/PORTFOLIOPATH_AI_LAUNCH_SPEC.md).

## Commands

| Command                   | Purpose                                                                       |
| ------------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`             | Start the local Next.js server                                                |
| `npm run build`           | Create a production build                                                     |
| `npm run typecheck`       | Check TypeScript                                                              |
| `npm run lint`            | Run ESLint with zero warnings allowed                                         |
| `npm test`                | Run unit tests                                                                |
| `npm run test:e2e`        | Run Playwright journeys                                                       |
| `npm run bootstrap-owner` | One-time explicit promotion of an existing owner account                      |
| `npm run bootstrap-admin` | Create a separate administrator account from a protected operator environment |
| `npm run db:start:lite`   | Optional low-memory local Supabase profile (Docker required)                  |
| `npm run db:stop`         | Stop local Supabase without deleting its data                                 |

## Deploy to Vercel + hosted Supabase

1. Push this repository to GitHub and import it into Vercel.
2. Create or select the hosted Supabase project; link it and apply migrations as above.
3. In Supabase Auth, add your production and preview domains to the redirect URL allowlist.
4. In Vercel, add the required environment variables for **Production** (and Preview only when intentional). Redeploy after saving them.
5. Set `NEXT_PUBLIC_APP_URL` to your canonical production URL.
6. Set up your owner with `npm run bootstrap-owner` from a protected local operator environment.
7. Keep `PAYMENT_PROVIDER=test` until iyzico sandbox checkout, signed webhook delivery, cancellation, and receipts have been verified. Only then configure live iyzico credentials and webhook signing.

## Release checklist

- [ ] `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` are clean.
- [ ] Hosted migration appears in Supabase and RLS policies are enabled.
- [ ] Student, assigned counselor, unassigned counselor, parent, mentor, school staff, owner, and anonymous access boundaries are tested.
- [ ] A complementary grant unlocks only its intended plan; a discount changes checkout price but not entitlement.
- [ ] Upload type/size checks, signed download authorization, expired/revoked share links, and rate limits are verified.
- [ ] iyzico sandbox callback, V3-signed webhook, duplicate webhook, and counselor cancellation are verified before live payments.
- [ ] Mobile, keyboard, contrast, Turkish overflow, loading, error, and empty states are reviewed.
