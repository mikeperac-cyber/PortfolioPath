# PortfolioPath architecture

## Route boundaries

- `app/[locale]/(public)` — bilingual acquisition, pricing, parent/school paths, policies, assessment, and quote requests.
- `app/[locale]/(auth)` — Supabase login, registration, and callbacks.
- `app/[locale]/(app)/student` — Student Studio.
- `app/[locale]/(app)/counselor` — assigned-student Counselor Practice.
- `app/[locale]/(app)/parent` — consented family progress view.
- `app/[locale]/(app)/mentor` — narrowly scoped verification inbox.
- `app/[locale]/(app)/school` — organization-scoped school workspace.
- `app/[locale]/(app)/owner` — Platform Owner console and isolated local-only student sandbox.
- `app/[locale]/(app)/admin` — essential platform administration.
- `app/share/[token]` — server-resolved, tokenized, minimal portfolio projection.
- `app/api` — authorized mutations, generation, signed storage, sharing, billing, payment callbacks, and commercial operations.

Layouts call `requireRole`; APIs call `getApiContext`; neither trusts editable auth metadata. Session claims identify the account, public profile and server-managed role grants determine access, and PostgreSQL RLS remains the final data boundary.

## Roles and contexts

`platform_owner`, `administrator`, `counselor`, `student`, `parent`, `mentor`, `school_admin`, and `school_counselor` are stored in `user_role_grants`, not user-editable metadata. The original `users.role` is retained for backwards compatibility while roles migrate safely.

- A Platform Owner may use Owner Console, Counselor Practice, and a browser-only Student Sandbox. Owner status is granted only by an explicit service-role bootstrap operation.
- A counselor sees only actively assigned students.
- A parent sees only student-consented progress summaries, selected evidence, and permitted updates; reflections are not a parent data source.
- A mentor sees only verification requests assigned to them.
- School staff access only their own organization, memberships, cohorts, templates, and aggregate completion signals.

## Provider contracts

`GenerationProvider` supports `project_ideas`, `project_blueprint`, `reflection_support`, `portfolio_text`, `presentation`, `recommendation_evidence`, `personal_statement_connection`, `interview_preparation`, and `progress_summary`. Every response is structured, source-linked, editable guidance and requires factual confirmation.

`PaymentProvider` provides server-created checkout, portal/cancellation capability, and signature-verified webhooks. The project includes a test adapter, Stripe-compatible adapter, and iyzico hosted-checkout adapter. The first release remains deterministic; a future live-model provider must preserve schema validation, ethical filtering, provenance, and fallback behavior.

## Data flow

1. Supabase Auth creates a profile via a restricted trigger; a migration creates compatible server-managed role grants.
2. Student source data is saved through validated forms and RLS.
3. Tasks, evidence, reflections, skills, reviews, confirmations, application-prep materials, relationship invitations, and portfolio settings are separate records with their own access rules.
4. Generation starts from an authorized source allowlist, validates schema and ethical rules, records provenance, then returns editable text.
5. Portfolio sharing resolves only a hashed, unexpired, unrevoked token and returns selected sections/evidence.
6. Private evidence files use short-lived signed operations after server authorization and Storage policy checks.
7. Checkout creates a payment session on the server; a trusted provider callback/webhook activates a subscription idempotently.

## Commercial model

Plan metadata sits in `plans.entitlements`; server routes enforce limits. Active subscriptions, complimentary grants, manual grants, and platform-owner access can grant entitlements. A discount grant is intentionally different: it adjusts an eligible checkout price but cannot create access on its own.

Schools use organizations, memberships, cohorts, and quote-led annual contracts. Parents and mentors are access participants, not individually sold plans.

## Operational model

Vercel hosts Next.js. Hosted Supabase provides Auth, PostgreSQL, private Storage, and RLS. Deterministic generation, PDF creation, share-token resolution, and payment operations run on the server. Production should add managed error monitoring, transactional email, asynchronous malware scanning, backups, distributed rate limiting, and feature flags.
