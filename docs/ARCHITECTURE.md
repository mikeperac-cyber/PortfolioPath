# PortfolioPath architecture

## Route boundaries

- `app/[locale]/(public)`: acquisition, pricing, policy, privacy, and terms
- `app/[locale]/(auth)`: Supabase login/registration
- `app/[locale]/(app)/student`: student-only workspace
- `app/[locale]/(app)/counselor`: approved-counselor workspace
- `app/[locale]/(app)/admin`: administrator workspace
- `app/share/[token]`: server-resolved, tokenized, minimal portfolio projection
- `app/api`: authorized generation, storage, PDF, sharing, project, and billing routes

Server layouts call `requireRole`. API handlers call `getApiContext`; neither trusts client role metadata. Supabase session validation uses `getClaims`, and authorization is repeated in RLS.

## Provider contracts

`GenerationProvider` supports project ideas, presentations, recommendation evidence, and progress summaries. All results carry provenance and require factual review. A later model provider must preserve the same structured contract and ethics filtering.

`PaymentProvider` supports checkout, customer portal, and verified webhooks. The local adapter keeps development functional; the Stripe-compatible adapter is selected through environment configuration.

## Data flow

1. Supabase Auth creates a public profile row through a restricted trigger.
2. Student source records are written through validated forms and RLS.
3. Counselor decisions and confirmations are separate immutable-attribution records.
4. Generated guidance receives only authorized source IDs and is persisted with its input hash and warnings before being returned.
5. Portfolio sharing resolves a hashed token through the server and returns visible sections only.
6. Private evidence files are accessed through short-lived signed operations after both server authorization and Storage RLS.

## Project lifecycle

`draft → awaiting_counselor_review → revision_requested | approved → active → paused | completed → archived`

Only defined transitions are accepted by the domain helper. Completed claims require evidence; task submission does not equal counselor approval.

## Entitlements

Plan metadata is stored in `plans.entitlements`. Server routes enforce idea, project, workspace, and counselor-assignment limits; UI state is explanatory, not authoritative.

## Operational model

Vercel hosts Next.js. Hosted Supabase provides Auth/Postgres/Storage. PDF rendering and deterministic generation run in server routes. Production adds error monitoring, transactional email, backups, malware scanning, and rate limiting at the deployment edge/database boundary.
