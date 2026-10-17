# Formlect — Security Checklist

Assessed: 2026-10-07 against the current working tree. Companion: [threat-model.md](threat-model.md) · [attack-surface.md](attack-surface.md) · [secrets.md](secrets.md).

Status values: ✅ in place (verified in code) · ⚠️ partial / weak · ❌ missing or broken · ❓ cannot tell from repo (needs deployment check) · ➖ not applicable yet.
Each ⚠️/❌/❓ row names its finding ID (`F-xx`, details and the *Severity → Evidence → Risk → Location → Why → Fix* breakdown are in [threat-model.md §8](threat-model.md#8-findings-in-detail)). Status as of the 2026-10-12 schema migration: F-02, F-03, F-04, F-05 (mostly) and F-07 are fixed (see threat-model §8); everything else is unchanged.

## 1. Authentication

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | Email + password via a maintained library (Better Auth) | ✅ | auth/index.ts |
| ☐ | Email verification required before session | ✅ | `requireEmailVerification: true` |
| ☐ | Generic error for bad credentials; generic duplicate-sign-up response | ✅ | web comments, `onExistingUserSignUp` |
| ☐ | Password policy beyond length 8 (breach check, max length) | ❌ | F-15 |
| ☐ | Brute-force protection on sign-in (per-IP **and** per-account) | ❌ | F-06, F-08 |
| ☐ | Password reset flow with expiring single-use token (also the "set password" path for OAuth-only users) | ✅ `sendResetPassword`, 1 h expiry (rate limiting still F-08) | F-15 |
| ☐ | MFA for form owners | ❌ | F-15 |
| ☐ | OAuth callback URLs from env and registered in provider console | ✅ / ❓ console | envConfig |
| ☐ | Account-linking behaviour reviewed (Google/GitHub same email) | ✅ explicit `accountLinking`, trusted: google, github | F-15 |
| ☐ | Sign-in UI does not trigger side effects for failed logins | ✅ sign-in and sign-up are separate modes | F-08 |

## 2. Authorization / RBAC

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | Every `/api/v1/*` route requires a session | ✅ | formRouter, formResponseRouter |
| ☐ | `GET /u/users` requires auth + admin role, or is removed | ❌ | **F-01** |
| ☐ | Object-level ownership on every read/write (workspace membership / collaborator in the query) | ✅ `FormService.findForMember` | F-02 |
| ☐ | PATCH routes resolve access in the query and require an edit role | ✅ | formService.ts `findForMember` |
| ☐ | Public respondent route returns a projection and only for `isPublished` forms | ✅ published snapshot only (still requires login) | F-03 |
| ☐ | Role model for future admin features | ➖ none exists | — |
| ☐ | Two-user authorization tests for each route | ❌ | F-19 |
| ☐ | Respondent (`respondent.user`) taken from session, not body | ✅ | F-05 |

## 3. Session / token security

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | Server-side sessions (Mongo), revocable | ✅ (Better Auth) | — |
| ☐ | Session lifetime bounded (7 d, refresh 1 d) | ✅ library default | — |
| ☐ | Cookie `Secure`, `HttpOnly`, `SameSite` verified in production response | ❓ | F-15, F-17 |
| ☐ | `BETTER_AUTH_SECRET` ≥ 32 chars enforced | ✅ | envConfig.ts:43 |
| ☐ | Secret rotation procedure documented | ❌ | [secrets.md §4](secrets.md#4-rotation-requirements) |
| ☐ | Email-verification token kept out of logs | ✅ for auth routes (not passed through `requestLogger`); dev-mode link logging exists | secrets S-06 |
| ☐ | Session revocation on password change / sign-out everywhere | ❓ | F-15 |

## 4. Input validation

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | Zod schema on every write route | ✅ | routers |
| ☐ | **Parsed** (stripped) output is used, not raw `req.body` | ✅ `validateRequest` replaces `req.body` | F-04 |
| ☐ | Max lengths on `title`, `description`, `slug`, labels, options, answers | ✅ forms + responses (zod caps mirror the Mongoose schema) | F-04, F-05 |
| ☐ | Slug charset/length enforced on create | ✅ `^[a-z0-9-]{3,80}$` in zod and Mongoose; server generates one when omitted | F-04 |
| ☐ | Colors / fonts validated against pattern or allow-list | ✅ hex regex + preset/font/layout enums | F-04 |
| ☐ | `:id` validated as ObjectId (avoid CastError → 500) | ✅ `commonValidations.id` | attack-surface §2 |
| ☐ | Answers validated server-side against the published form fields | ⚠️ done; logic rules and `validation.pattern` not evaluated | F-05 |
| ☐ | Request body size limit | ✅ Express default 100 kB | — |
| ☐ | Cap on `fields[]`, `options[]`, `answers[]` counts | ✅ 500 / 200 / 500 | F-04/F-05 |

## 5. Injection

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | NoSQL operator injection: filters built from strings/session only | ✅ (none found) | attack-surface §4 |
| ☐ | Mongoose strict mode (unknown keys dropped) | ✅ | db/schema |
| ☐ | No `$where`, `eval`, shell, template rendering in api | ✅ | grep |
| ☐ | `validation.pattern` never executed server-side without ReDoS guard | ➖ not executed today | F-04 |
| ☐ | Email templates escape user/URL values | ✅ | mailer.ts `escapeHtml` |
| ☐ | Add `express-mongo-sanitize`-style guard if body keys ever reach filters | REC | — |

## 6. XSS / CSRF

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | React default escaping; no `dangerouslySetInnerHTML`/`innerHTML` in web | ✅ | grep |
| ☐ | Stored user content (form titles, labels, settings) escaped/validated before the future public renderer | ⚠️ settings validated; `design.customCss` (schema field, not accepted by the API yet) must be sanitised before it is ever exposed | F-04 |
| ☐ | Content-Security-Policy on web | ❌ | F-18 |
| ☐ | Helmet on API | ✅ mounted before auth handler | F-08 |
| ☐ | CSRF: `SameSite` cookie + CORS preflight + Better Auth origin check | ⚠️ ❓ depends on prod domains | F-17 |
| ☐ | `express.urlencoded` removed if unused | ❌ | F-17 |
| ☐ | `rel="noreferrer"` on `target=_blank` links | ✅ | sign-in-form.tsx |

## 7. API security

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | Consistent response envelope | ✅ | ServiceResponse |
| ☐ | Error messages generic to the client | ⚠️ services generic; default Express handler may leak | F-09 |
| ☐ | Public docs not exposing internals in prod | ⚠️ Swagger always on, spec drifts from routes | F-16 |
| ☐ | Pagination on list endpoints | ❌ (`/forms`, `/u/users`) | F-01 |
| ☐ | API versioning | ✅ `/api/v1` | — |
| ☐ | Public (respondent) API separated from owner API | ❌ | F-03/F-05 |
| ☐ | Request timeouts / slow-request protection | ❌ | attack-surface §11 |
| ☐ | Mount order reviewed (auth handler before `helmet`/limiter/logger) | ❌ | F-08, F-11 |

## 8. Rate limiting / abuse

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | Global limiter present | ⚠️ in-memory, per instance | rateLimiter.ts |
| ☐ | Limiter key cannot be spoofed by the client | ❌ (`request-ip` trusts `X-Forwarded-For`, `X-Client-IP`) | **F-06** |
| ☐ | `express-rate-limit` patched (≥ 8.0.2) | ❌ 8.0.1 | F-06, F-13 |
| ☐ | Limits on `/api/auth/*` (sign-in, sign-up, send-verification, reset) | ⚠️ Better Auth `rateLimit` on in all envs, custom rules; in-memory, per instance | F-08 |
| ☐ | Per-recipient email throttling | ✅ 5/h per address in mailer (in-memory) | F-08 |
| ☐ | Per-user / per-form limits for form creation and response submission | ❌ | F-05 |
| ☐ | Duplicate-submission enforcement (`settings.oneResponsePerUser`) | ✅ per logged-in user | F-05 |
| ☐ | CAPTCHA / bot protection on public form submission and sign-up | ❌ | F-05, F-08 |
| ☐ | Template values sensible (30 req/min; default 1000/s window math: `windowMs = 60 × WINDOW_MS`) | ⚠️ confusing config | rateLimiter.ts:10 |

## 9. File uploads

| ✓ | Item | Status |
|---|---|---|
| ☐ | No upload endpoint exists | ✅ ➖ |
| ☐ | If added: type/size allow-list, content sniffing, random names, separate storage origin, AV scan, signed URLs | REC (design before building) |

## 10. Database security

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | Connection string only in env; TLS via `mongodb+srv` | ✅ | envConfig, `.env` |
| ☐ | Dev and prod use separate clusters/users | ❓ (local `.env` points to a hosted cluster) | secrets S-01 |
| ☐ | Least-privilege DB user (no admin role) | ❓ | — |
| ☐ | Atlas IP allow-list, no `0.0.0.0/0` | ❓ | — |
| ☐ | Atlas encryption at rest and tested backups | ❓ | — |
| ☐ | Unique `slug` and `alias` indexes; slug race handled by retry on the index error | ✅ | db/schema/form/Form.ts, decisions/0001 |
| ☐ | Tenancy enforced in queries | ✅ forms (workspace/collaborator filter); responses are only created, never read, today | F-02, F-03 |
| ☐ | Retention / TTL for responses | ❌ | F-12 |
| ☐ | Separate credentials for auth data vs app data | ❌ (single user) | attack-surface §6 |
| ☐ | `User` Mongoose mirror is read-only (no writes) | ✅ | db/schema/user/User.ts usage |

## 11. Secrets

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | `.env` git-ignored; none tracked | ✅ | secrets §2 |
| ☐ | No hardcoded secrets (pattern scan) | ✅ | secrets S-03 |
| ☐ | Env validated at boot, fails closed | ✅ | envConfig.ts |
| ☐ | Secret scanning in CI / pre-commit / push protection | ❌ | secrets S-04 |
| ☐ | `.env.example` committed for web | ❌ ignored by `.env*` | secrets §2 |
| ☐ | Stale Google Sheets credentials revoked | ❓ | secrets S-02 |
| ☐ | Rotation before production launch | ❌ not yet done/documented | secrets §4 |
| ☐ | No secret in `NEXT_PUBLIC_*` | ✅ | secrets S-05 |

## 12. Encryption

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | TLS to Mongo, Resend, OAuth providers | ✅ (client defaults) | — |
| ☐ | TLS for API ↔ browser (terminator/HSTS) | ❓ | attack-surface §11 |
| ☐ | Password hashing | ✅ Better Auth | — |
| ☐ | OAuth tokens at rest encrypted | ❓ not configured | secrets S-08 |
| ☐ | Respondent data encrypted at app level (if sensitive forms are in scope) | ❌ plaintext in Mongo | F-12 |

## 13. CORS

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | Explicit allow-list, no `*` with credentials | ✅ | server.ts:28-41 |
| ☐ | Production list = web origin only (https) | ❓ template includes `localhost:8080` and dead `:5173` | F-10 |
| ☐ | Same list reused for Better Auth `trustedOrigins` intentionally | ⚠️ coupling | F-10 |
| ☐ | Rejected origin returns clean 403, not an unhandled error | ❌ | F-09 |
| ☐ | Requests without `Origin` allowed | ⚠️ expected for non-browser clients; cookies still required | — |

## 14. Dependency security

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | Lockfile committed and used with `--frozen-lockfile` | ✅ | Dockerfile (note path issue F-14) |
| ☐ | `pnpm audit --prod` clean | ❌ 13 (3 critical, 3 high, 7 moderate) | F-13 |
| ☐ | Runtime-relevant fix: upgrade `express-rate-limit` ≥ 8.0.2 | ❌ | F-06 |
| ☐ | Remove test-runner packages from the prod tree (`auto-install-peers`) | ❌ | F-13 |
| ☐ | Move `shadcn` CLI to `devDependencies`; verify `cn@0.4.0` provenance | ❌ / ❓ | F-13, F-18 |
| ☐ | Remove unused `@neondatabase/serverless`, `request-ip` (if keying fixed), leftover `packages/*` | REC | — |
| ☐ | Automated updates (Renovate/Dependabot) — README claims Renovate, none configured | ❌ | F-19 |
| ☐ | Node version supported (repo ≥ 24; Docker uses 23.11.1) | ❌ | F-14 |
| ☐ | `better-auth` client/server versions aligned (api resolves 1.7.7, web 1.7.7) | ✅ (pin api to avoid drift) | — |

## 15. Logging / monitoring

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | Structured logging (pino) with request ids | ✅ | requestLogger.ts |
| ☐ | No bodies/documents printed with `console.log` | ✅ | F-07 |
| ☐ | Redaction configured | ❌ | secrets S-06 |
| ☐ | Auth events and authorization denials logged | ❌ (`/api/auth/*` precedes logger; 401/404 silent) | F-11 |
| ☐ | Alerting / uptime / error tracking | ❌ none in repo | F-11 |
| ☐ | `/health-check` covers DB connectivity | ❌ static | — |
| ☐ | Client-supplied `X-Request-Id` length-bounded | ❌ | REC |

## 16. Admin security

| ✓ | Item | Status |
|---|---|---|
| ☐ | No admin UI/routes exist | ✅ ➖ |
| ☐ | Role model + MFA + audit trail designed before adding any admin | REC |
| ☐ | Remove or protect `/u/users` (the only de-facto admin-style endpoint) | ❌ F-01 |

## 17. Deployment / infrastructure

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | Non-root container user | ✅ | Dockerfile:29 |
| ☐ | Multi-stage build, prod deps only, `--ignore-scripts` | ✅ | Dockerfile |
| ☐ | LTS Node base pinned by digest | ❌ | F-14 |
| ☐ | `.dockerignore` excludes `.env*`, `.git`, `node_modules` | ❌ | F-14 |
| ☐ | `NODE_ENV=production` set in runtime | ❌ in image; ❓ platform | F-09, F-14 |
| ☐ | `HEALTHCHECK` | ❌ | F-14 |
| ☐ | Build actually works with repo layout (lockfile at root) | ❓ | F-14 |
| ☐ | `TRUST_PROXY` matches real proxy count | ❓ | envConfig |
| ☐ | Swagger disabled/protected in production | ❌ | F-16 |
| ☐ | CI pipeline with typecheck, tests, audit, secret scan | ❌ | F-19 |
| ☐ | Security headers on web | ❌ | F-18 |

## 18. Data privacy

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | Data inventory (user email/name; respondent answers; IP/UA metadata) | ⚠️ implicit only | threat-model A1–A4 |
| ☐ | Delete form / delete responses / delete account | ❌ (delete routes commented out) | F-12 |
| ☐ | Export (access request) | ❌ | F-12 |
| ☐ | Retention policy | ❌ | F-12 |
| ☐ | Respondent notice/consent text; Terms/Privacy pages exist | ❌ footer links are `#` | F-12 |
| ☐ | IP/UA captured server-side with a stated purpose | ⚠️ UA is server-derived; IP is not stored (`settings.collectIp` ignored) | F-05 |
| ☐ | Third-party processors listed (Resend, Atlas, Google, GitHub) | ❌ undocumented | — |
| ☐ | No PII in logs | ❌ | F-07 |

## 19. Error handling

| ✓ | Item | Status | Ref |
|---|---|---|---|
| ☐ | Services catch and return generic failures | ✅ | formService.ts |
| ☐ | Final JSON error handler that never returns stack/message | ❌ | F-09 |
| ☐ | Distinguish 400/404/409 from 500 (bad ObjectId, duplicate slug) | ✅ `toServiceFailure` | attack-surface §2 |
| ☐ | Process-level handlers do not hide crashes | ⚠️ `unhandledRejection` only logs | index.ts:28 |
| ☐ | Fire-and-forget email errors observed | ⚠️ Resend error object logged; thrown errors become unhandled rejections | mailer.ts |
| ☐ | `requireAuth` fails closed | ✅ | requireAuth.ts:33-36 |

## 20. Backup / recovery

| ✓ | Item | Status |
|---|---|---|
| ☐ | Atlas backups/PITR enabled and **restore tested** | ❓ nothing in repo |
| ☐ | Recovery runbook (DB loss, secret leak, session invalidation) | ❌ |
| ☐ | Secrets recoverable from a secret manager, not only from developer machines | ❌ (local `.env` is the only evidenced copy) |
| ☐ | Soft-delete / undo for forms and responses | ❌ (no delete at all yet) |
| ☐ | Graceful shutdown | ✅ index.ts:14-22 |

## Priority order for remediation

1. **F-01** `/u/users` (open) · ~~F-02, F-03, F-04, F-05, F-07~~ fixed 2026-10-12 (F-05: rate limits/CAPTCHA still open).
2. **F-07** remove `console.log` of data · **F-06/F-08** limiter keying, library upgrade, auth throttling.
3. **F-09/F-10/F-14** `NODE_ENV`, error handler, CORS list, Dockerfile.
4. **F-13/F-19** dependency upgrades, CI, authorization tests.
5. **F-11/F-12/F-15** audit logging, privacy lifecycle, account hardening; then **F-16/F-17/F-18**.
6. Before first commit and before production: secret scan and credential rotation ([secrets.md](secrets.md)).
