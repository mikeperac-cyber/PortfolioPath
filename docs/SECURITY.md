# Security notes

## Identity and access

Supabase Auth authenticates the account. `public.users` carries account status; `public.user_role_grants` carries server-managed roles. Neither client-submitted role fields nor editable auth metadata grant access.

Roles are enforced three times: in protected route layouts, in server API handlers, and through PostgreSQL RLS. The Owner role is never self-service: the bootstrap script requires an exact pre-existing email and a service credential, then writes an audit record.

## Minimum-necessary access

- Students access their own projects and evidence.
- Counselors access actively assigned students only.
- Parents access only consented project progress, selected evidence, and permitted updates—never private reflections by default.
- Mentors access only their own assigned verification requests and source references.
- School staff are constrained to organization memberships and cohorts in their organization.
- Platform Owner data access is audited; commercial insights return counts and lifecycle signals, not evidence files, reflections, or counselor-comment contents.

## Evidence and sharing

The `evidence` bucket is private. Object paths begin with the student and project IDs. The server validates ownership, plan access, MIME/extension consistency, allowed type, and a 25 MiB cap before issuing short-lived signed uploads/downloads.

Public share tokens are returned once, stored only as hashes, expire in 1–90 days, and are immediately revocable. A public share page resolves one token server-side and returns selected portfolio data only; it never gives the browser broad database access.

## Generation ethics

Generation receives only authorized source record IDs. Outputs record source IDs, source state, input hash, provider, warnings, unsupported-claim flags, and factual-confirmation requirements. Planned work stays planned until evidence supports completion. The system never invents achievements, impact numbers, participants, partnerships, certificates, emotions, mentor/counselor observations, recommendations, admissions outcomes, or scholarship outcomes.

## Billing

Checkout is server-authorized by role, entitlement, plan, and rate limit. The checkout server creates a short-lived payment session before calling a provider. Payment records, subscriptions, invoices/receipts, and grants are server-owned and client writes are revoked.

The test provider is safe for development only. Stripe uses verified webhook signatures. iyzico uses its documented IYZWSv2 server authorization protocol and verifies signed V3 webhook payloads. Provider event IDs and payment-session state make fulfillment idempotent. PortfolioPath does not persist card details or billing addresses; iyzico receives payer information only for its hosted payment form.

## Audit integrity

Clients cannot append, modify, or delete audit records. Database triggers capture sensitive record changes; explicit server operations record role grants, access grants, invitations, payment state, and owner actions. Service operations can have no database `auth.uid`, so application monitoring should add request/job correlation identifiers in production.

## Production hardening checklist

- Use unique production secrets; rotate service and bootstrap credentials.
- Enable Supabase leaked-password protection and MFA for owner/admin operators.
- Use a distributed edge rate-limit provider when traffic grows; in-process limits are a safe baseline, not a multi-region solution.
- Configure CSP, HSTS, secure cookies, alerting, error monitoring, webhook replay monitoring, and backup/restore drills.
- Add malware scanning/quarantine and image metadata review before routine counselor downloads.
- Test expired/revoked links, cross-student access, role escalation, payment replays, provider outages, XSS, URL validation, and file MIME spoofing.
- Complete Turkish KVKK, age-appropriate consent, deletion/retention, and international-transfer legal review before handling real student data at scale.
