# Security notes

## Authorization

Authentication is Supabase-based. Role and account status are read from `public.users`, not mutable `user_metadata`. Counselor accounts begin pending; administrators are created only through a service credential bootstrap.

Protected layouts and API routes authorize server-side. PostgreSQL RLS is the final boundary. pgTAP tests cover owner, unrelated user, assigned/unassigned/pending counselor, administrator, and anonymous sessions.

## Evidence privacy

The `evidence` bucket is private. File paths begin with the authenticated student ID. The server checks project ownership, matching MIME/extension, allowed type, and a 25 MiB cap before signing. Downloads expire after 60 seconds.

Administrators do not receive routine private-evidence access. Metadata and object access require an open/reviewing flag. Sensitive access and changes are audit logged.

Production should add asynchronous malware scanning and quarantine before counselor downloads; signed-upload validation is not a malware scanner.

## Sharing

Raw share tokens are returned once and never stored. The database stores a salted SHA-256 hash. Links expire in 1–90 days and are immediately revocable. The public route uses a server credential only to resolve one token and returns visible portfolio sections—never a general database client.

## Generation

Generation routes are authenticated and rate-limited by recent persisted requests. The launch provider is deterministic. Outputs record source IDs, input hash, warnings, provider, and factual-confirmation requirements. No counselor observation or recommendation prose is invented.

## Billing

Checkout requires the correct user role. Stripe webhooks require signatures; provider event IDs are unique for idempotency. Payment and subscription tables are server-owned and have client mutations revoked.

## Audit integrity

Audit logs are append-only to clients. Database triggers cover project/evidence/assignment/share/flag/user/review/confirmation/billing/generation changes. Service operations may have a null database `auth.uid`; production operators should also attach request or job correlation IDs in application monitoring.

## Production hardening checklist

- Use unique production secrets and rotate bootstrap credentials.
- Enable Supabase leaked-password protection and MFA for administrators.
- Add edge/distributed rate limiting; the database-backed generation limit is the fallback.
- Configure CSP, HSTS, secure cookies, webhook replay monitoring, error monitoring, and alerting.
- Run malware scanning and image metadata review.
- Test backups and point-in-time recovery.
- Complete Turkish KVKK, age-appropriate consent, privacy, retention, deletion, and international-transfer legal review.
- Perform a penetration test before processing real student evidence.
