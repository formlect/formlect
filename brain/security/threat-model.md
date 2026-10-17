# Formlect — Threat Model

Assessed: 2026-10-07 · Scope: `apps/api` (Express 5 + Mongoose 9 + Better Auth), `apps/web` (Next.js 16 scaffold), root/monorepo config, `apps/api/Dockerfile`.
Method: static review of the current working tree (uncommitted) + three runtime checks (`pnpm audit --prod`, a Mongoose cast check, a `request-ip` header check). No code or config was changed.

Companion files: [attack-surface.md](attack-surface.md) · [secrets.md](secrets.md) · [security-checklist.md](security-checklist.md)

## How to read this document

Every finding has a stable ID (`F-xx`) used across all four files and one of these classes:

| Class | Meaning |
|---|---|
| **CONFIRMED** | Vulnerability proven from code and/or a reproduced check. |
| **WEAKNESS** | A control exists but is flawed or too weak. |
| **MISSING** | A control that should exist for this product does not exist. |
| **VERIFY** | Plausible from evidence; needs deployment/runtime confirmation before it is treated as real. |
| **REC** | Recommendation / hardening, no concrete defect. |

Severity = Likelihood × Impact for *this* product at its *current* stage (local dev, no production deployment evidence in the repo).

## 1. System summary (from code)

- **API** (`apps/api`): Express 5. Middleware order in [server.ts](../../apps/api/src/server.ts): `request-ip` → CORS → **Better Auth handler (`/api/auth/*`)** → `express.json` / `urlencoded` → `helmet` → rate limiter → request logger → routes → Swagger UI → error handlers.
- **Auth**: Better Auth (email+password with mandatory email verification, Google and GitHub OAuth). Sessions are cookie-based, stored in MongoDB by Better Auth. App routes use `requireAuth` ([requireAuth.ts](../../apps/api/src/common/middleware/requireAuth.ts)), which resolves the session and sets `req.user`. **There are no roles**; authorization is "owner = `userId`".
- **Data**: one MongoDB database (`DATABASE_URL`, Atlas SRV in the local `.env`). Mongoose models `Form`, `FormResponse`, and a read-only mirror `User` of Better Auth's `user` collection. Better Auth additionally owns `session`, `account`, `verification`.
- **Email**: Resend ([mailer.ts](../../apps/api/src/common/utils/mailer.ts)), verification + "someone tried to sign up with your email".
- **Web** (`apps/web`): sign-in/sign-up page + placeholder dashboard. Talks to the API through the Better Auth client only. No form builder, no public form renderer, no `/api/v1/*` calls yet.
- **Not present in code** (despite notes in `apps/api/src/docs/*.mdx`): file uploads, webhooks, Google Sheets/Notion/Zapier integrations, queues/workers, admin UI, payments, AI features. These are roadmap only; see "Future threats" below.

## 2. Assets

| # | Asset | Where | Sensitivity |
|---|---|---|---|
| A1 | End-user accounts: email, name, password hash, OAuth tokens | Mongo `user`, `account` (Better Auth) | High |
| A2 | Sessions / session cookies | Mongo `session`, browser cookie | High |
| A3 | Form definitions (titles, questions, theme) | Mongo `forms` | Medium (drafts may be confidential) |
| A4 | **Form responses** (answers are `Mixed`, arbitrary respondent PII) | Mongo `formresponses` | High |
| A5 | Secrets: `BETTER_AUTH_SECRET`, `DATABASE_URL` credentials, Google/GitHub OAuth client secrets, `RESEND_API_KEY` | `apps/api/.env`, deployment env | Critical (see [secrets.md](secrets.md)) |
| A6 | Sender reputation / Resend quota / domain | Resend | Medium |
| A7 | Service availability | API process, Mongo | Medium |
| A8 | Source code and dependency chain | repo, npm | Medium |

## 3. Actors

| Actor | Capability |
|---|---|
| Anonymous internet user | Reach any public route (`/u/users`, `/health-check`, Swagger, `/api/auth/*`). |
| Registered (verified) user | Holds a valid session; can call every `requireAuth` route. **Hostile registered user is the main adversary**: sign-up is open to any email. |
| Form respondent | Currently must also be a registered user (`by-slug` and response-create both need auth). |
| Victim third party | Owner of an email address that an attacker types into the sign-in form. |
| Malicious website visitor | A logged-in user lured to an attacker's page (CSRF / CORS). |
| Insider / developer | Has `.env`, Atlas access, CI. |
| Supply-chain attacker | Compromised npm package. |
| Operator | Deploys the Docker image / sets env. |

## 4. Trust boundaries

```
 Browser ──(B1: internet, cookies, CORS)──▶ Express API ──(B3)──▶ MongoDB Atlas
    │                                          │   └──(B4)──▶ Resend API
    │                                          └──(B5)──▶ Google / GitHub OAuth
    └──(B2)──▶ Next.js server (static pages only, no data)
 Build/CI ──(B6: npm registry, Docker base image)──▶ artifacts
```

| ID | Boundary | Controls actually present |
|---|---|---|
| B1 | Internet → API | CORS allow-list, Helmet (for routes after it), express rate limit (IP, in-memory), Better Auth origin/CSRF checks, JSON body cap (Express default 100 kB) |
| B2 | Browser → Next | None specific (no CSP, no middleware) |
| B3 | API → MongoDB | TLS via Atlas `mongodb+srv`, credentials in env. No query-level tenancy enforcement outside services. |
| B4 | API → Resend | API key in env; `escapeHtml` on URL fields in email templates |
| B5 | API ↔ OAuth providers | Client secrets server-side only; callback URLs from env |
| B6 | Supply chain | `pnpm-lock.yaml` + `--frozen-lockfile --ignore-scripts` in Dockerfile; **no CI, no Dependabot/Renovate config, no `pnpm audit` gate** |

## 5. Entry points

Full list in [attack-surface.md](attack-surface.md). Summary: 1 unauthenticated data route (`GET /u/users`), `/health-check`, Swagger UI (`/`, `/swagger.json`), Better Auth (`/api/auth/*`, unmetered by the app rate limiter), 8 authenticated `/api/v1/*` routes, the Next sign-in page, process env, Docker build context.

## 6. Existing mitigations (verified in code)

- **Strict env validation** at boot; app refuses to start on bad env; `BETTER_AUTH_SECRET` must be ≥ 32 chars ([envConfig.ts:43](../../apps/api/src/common/utils/envConfig.ts)); `TRUST_PROXY` is a number, never `true`; `RESEND_API_KEY` mandatory when `NODE_ENV=production`.
- Secrets are env-only; `.env` is git-ignored in both `apps/api` and root; no tracked `.env`; a regex scan of the tree found no hardcoded keys.
- `requireAuth` **fails closed** (any error → 401).
- Access scoping in the query (workspace membership / collaborator, plus an edit role for writes) on every form read and PATCH route and on `GET /` (since 2026-10-12; previously `{ _id, userId }` on the PATCH routes only).
- Better Auth: email verification required; generic "invalid email or password" error; duplicate sign-up answered generically and email sends are **not awaited** to avoid timing enumeration ([auth/index.ts:19-21](../../apps/api/src/api/auth/index.ts)); origin/CSRF checks are not disabled; session lifetime 7 days (library default).
- CORS is an explicit allow-list with `credentials: true`; wildcard not used.
- Helmet enabled; JSON body size bounded by Express default.
- Mongoose strict schemas drop unknown fields and cast types (this blunts, but does not remove, mass assignment; see F-04).
- Zod validation on every write route; since 2026-10-12 handlers receive the **parsed** body (F-04 fixed for the forms API).
- Email templates HTML-escape URLs/`WEB_URL`.
- Docker runner stage uses non-root `node` user, prod-only deps, `--ignore-scripts`.
- React escapes output; no `dangerouslySetInnerHTML` / `innerHTML` / `eval` in `apps/web/src`.
- Response bodies are only captured in non-production, and not logged.

## 7. Threat register

Likelihood/Impact: L/M/H. Detailed evidence per finding is in section 8.

| ID | Class | Threat (STRIDE) | Likelihood | Impact | **Severity** |
|---|---|---|---|---|---|
| F-01 | CONFIRMED | Unauthenticated listing of every user's email/name (Info disclosure) | H | H | **High** |
| F-02 | CONFIRMED | IDOR: any logged-in user reads any form by id (Info disclosure / EoP) | M | H | **High** |
| F-03 | CONFIRMED | Any logged-in user reads any form (incl. drafts, owner id) by slug | M | M | **Medium** |
| F-04 | CONFIRMED | Mass assignment / validated-but-unused input on create & update (Tampering) | H | M | **Medium** |
| F-05 | CONFIRMED | Response submission with no form/publish/ownership/answer checks; spoofable `submittedBy`/IP/UA (Tampering, Repudiation) | H | M | **Medium** |
| F-06 | CONFIRMED | Rate-limit bypass via client-controlled IP headers; vulnerable `express-rate-limit` (DoS, brute force) | H | M | **Medium** |
| F-07 | CONFIRMED | Request bodies (incl. respondent PII) and saved documents printed with `console.log` in all environments (Info disclosure) | H | M | **Medium** |
| F-08 | WEAKNESS | Auth endpoints outside app rate limit/Helmet; email-bombing and quota abuse via sign-in→sign-up fallback and `sendOnSignIn` (DoS, harassment) | H | M | **Medium** |
| F-09 | VERIFY | Express default error handler may leak stack traces if `NODE_ENV` is unset in the container (Info disclosure) | M | M | **Medium** |
| F-10 | WEAKNESS | `CORS_ORIGINS` doubles as Better Auth `trustedOrigins`; template includes the API's own origin and a dead dev origin | L | M | **Low–Medium** |
| F-11 | MISSING | No production-grade audit logging / alerting of security events | M | M | **Medium** |
| F-12 | MISSING | No privacy lifecycle for responses (no delete/export/retention), PII stored plaintext | M | M | **Medium** |
| F-13 | WEAKNESS | Dependency advisories (13 in `pnpm audit --prod`; 1 high is a direct runtime dep) | M | M | **Medium** |
| F-14 | WEAKNESS | Dockerfile: EOL/odd Node base, no `.dockerignore`, no `NODE_ENV`, lockfile path likely wrong | M | M | **Low–Medium** |
| F-15 | MISSING | Account security features: no MFA, no password-reset flow, no lockout, session/cookie attrs unverified | M | M | **Medium** |
| F-16 | WEAKNESS | Swagger UI and `/swagger.json` public in every environment | M | L | **Low** |
| F-17 | VERIFY | Cross-site cookie/CSRF posture depends on production domain layout; `urlencoded` parser enabled | L | M | **Low** |
| F-18 | MISSING | No security headers/CSP in Next, no `middleware.ts` | L | L | **Low** |
| F-19 | MISSING | No authorization/negative tests; no CI security gates | H | M | **Medium** |
| F-20 | REC | Roadmap features (webhooks, integrations, uploads) will add SSRF/credential-storage risk | — | — | **Forward-looking** |

## 8. Findings in detail

Format: **Severity → Evidence → Risk → Affected location → Why it matters → Recommended fix** (nothing below has been applied).

### F-01 — CONFIRMED — `GET /u/users` is unauthenticated and returns all users
- **Severity:** High
- **Evidence:** [server.ts:66](../../apps/api/src/server.ts) mounts `app.use("/u", User)`; [user/index.ts:5-14](../../apps/api/src/api/user/index.ts) handles `GET /users` with no `requireAuth` and `User.find({})`. The `User` Mongoose schema ([User.ts](../../apps/api/src/db/schema/user/User.ts)) exposes `id, name, email, emailVerified, image, createdAt, updatedAt`. The repo itself flags it as "security hole; pending decision" ([apps/api/.claude/CLAUDE.md](../../apps/api/.claude/CLAUDE.md)).
- **Risk:** Full email list harvest (phishing, spam, credential stuffing target list); defeats the generic-sign-up anti-enumeration design; unbounded response (no pagination) → heavy query/DoS as users grow.
- **Affected:** `apps/api/src/api/user/index.ts`, `apps/api/src/server.ts:66`.
- **Why it matters:** Zero-effort data exposure for any internet client; also not listed in Swagger, so it is easy to forget.
- **Recommended fix:** Remove the route, or require auth + an admin role and paginate/project fields. Decide before any deployment.

### F-02 — CONFIRMED — **FIXED 2026-10-12** — IDOR in `getformById` (ownership filter silently dropped)
- **Severity:** High
- **Status (2026-10-12):** fixed in the schema migration. Every form read/write goes through `FormService.findForMember`, which puts access in the query (`{ _id, $or: [workspace in the user's memberships, collaborators.user] }` via `findOne`, never `findById` with a filter); writes also need owner/admin/editor (403). Still open: two-user authorization tests (F-19).
- **Evidence:** [formService.ts:45-48](../../apps/api/src/api/form/formService.ts) calls `FormModel.findById({ _id: formId, userId })`. `findById` takes an id, not a filter. Reproduction (Mongoose 9.11.0, project's installed version): `Model.findById({_id:A, userId:B})` casts to filter `{"_id":"A"}` — **`userId` is not in the resulting filter**.
- **Risk:** Any verified user can fetch any other user's form (title, description, all questions, `userId`) by ObjectId through `GET /api/v1/forms/:id`.
- **Affected:** `FormService.getformById`, route `GET /api/v1/forms/:id`.
- **Why it matters:** The API's own convention says "always scope DB queries by the authenticated userId". This is a broken-object-level-authorization bug (OWASP API1). ObjectIds are not secret (timestamp + counter prefix).
- **Recommended fix:** `FormModel.findOne({ _id: formId, userId })` (match the three PATCH methods). Add a test with two users.

### F-03 — CONFIRMED — **FIXED 2026-10-12** — `GET /api/v1/forms/by-slug/:slug` has no ownership or publish check
- **Severity:** Medium
- **Status (2026-10-12):** fixed. The route only serves `status: "published"` forms and returns a public projection built from the published `FormVersion` snapshot (no `createdBy`/`workspace`, collaborators, counters, webhooks or `page.enabledBy`). It still requires login; opening it to anonymous respondents is a separate decision.
- **Evidence:** [formService.ts:65-72](../../apps/api/src/api/form/formService.ts) `findOne({ slug })`, no `isPublished`, no `userId`; route requires only `requireAuth` ([formRouter.ts:67](../../apps/api/src/api/form/formRouter.ts)). Returns the full document, including owner `userId`, `viewCount`, `submissionCount`.
- **Risk:** Unpublished drafts are readable by any logged-in user who knows/guesses the slug. Slugs are client-chosen (min 10 chars, [formModel.ts:93](../../apps/api/src/api/form/formModel.ts)); if the UI derives them from titles they are guessable.
- **Why it matters:** Today the route also blocks anonymous respondents (documented as pending intent). When it is opened to the public, the missing `isPublished` check turns into public draft disclosure.
- **Recommended fix:** For the public endpoint: require `isPublished: true` and return a **public projection** (no `userId`, counts, or settings not needed). Keep an owner-only endpoint for drafts.

### F-04 — CONFIRMED — **FIXED 2026-10-12 (forms + responses API)** — Zod validates but the validated value is discarded (mass assignment / unvalidated input)
- **Severity:** Medium
- **Status (2026-10-12):** `validateRequest` now replaces `req.body` with the parsed output, and the models were rewritten with length/array caps, a slug regex, hex-colour and enum validation (presets, fonts, layouts), a whitelisted `settings` subset (webhooks, notifications, captcha, IP collection are not accepted) and `design` limited to safe keys. Server-managed fields (`status`, counters, `workspace`, `createdBy`, `publishedVersion`) can no longer be set by the client. `validation.pattern` is stored but never executed (ReDoS guard still needed before it is).
- **Evidence:** [httpHandlers.ts:11](../../apps/api/src/common/utils/httpHandlers.ts) does `await schema.parseAsync(...)` and never assigns the result back to `req`. Controllers then use the raw `req.body`: `createForm` spreads it (`...formData`, [formController.ts:13-16](../../apps/api/src/api/form/formController.ts)); `updateBasicInformation` writes `data.settings` wholesale ([formService.ts:96](../../apps/api/src/api/form/formService.ts)).
- **Risk:** On `POST /forms/create` a client can set server-managed schema fields (`isPublished`, `publishedAt`, `viewCount`, `submissionCount`, even `_id`). On `PATCH basic-information`, `settings` is replaced by an object whose inner values (`backgroundColor`, `primaryColor`, `foregroundColor`, `primaryFont`, `secondaryFont`) are never validated (the Zod schema only lists three booleans; extras are allowed by Mongoose) → future CSS/HTML-injection sink when the public renderer consumes them. `title`/`description` in `BasicFormInformationSchema` have **no max length**, and `slug` on create has no max/charset (the safe regex exists only on the unused `UpdateFormSchema`). Also `validation.pattern` is arbitrary user text (future ReDoS if evaluated).
- **Mitigation present:** Mongoose strict mode drops unknown keys and casts primitives; `userId` is set after the spread so ownership cannot be forged on create; body ≤ 100 kB.
- **Why it matters:** Integrity of counters/publish state, plus stored-injection primitives that become exploitable once rendered.
- **Recommended fix:** Replace `req.body` with the parsed output; use `.strict()`/`.pick()` per endpoint; add max lengths and a slug regex; validate color/font values against an allow-list or regex.

### F-05 — CONFIRMED — **MOSTLY FIXED 2026-10-12** — Response submission is unchecked
- **Severity:** Medium
- **Status (2026-10-12):** `formResponseService` now loads the form, requires `status: published` and `isAcceptingResponses` (schedule, limit, switch), pins the response to the published `FormVersion`, validates answers against that snapshot (`formResponseValidation.ts`: unknown/duplicate fields, type slots, option keys, lengths, ranges, required), takes `respondent.user` from the session, derives the user agent server-side (client IP/UA no longer accepted), increments the counter atomically and enforces `oneResponsePerUser`. Still open: per-user/per-form rate limits and CAPTCHA, logic-driven required/hidden fields and `validation.pattern` are not evaluated server-side, `responseLimit` can overshoot under concurrency.
- **Evidence:** [formResponseService.ts:10](../../apps/api/src/api/formResponse/formResponseService.ts) saves `new FormResponseModel(data)` where `data` is the raw body ([formResponseController.ts:12-14](../../apps/api/src/api/formResponse/formResponseController.ts)). No lookup of the form; `formSlug` is not tied to `formId`; `isPublished` and `settings.allowMultipleSubmissions` are never enforced; `submissionCount` is never incremented; `answers[].value` is `Mixed`/`unknown` and not validated against the form's `elements` (required, `maxLength`, `pattern`, option membership). `submittedBy` and `metadata.ipAddress` / `userAgent` come from the client.
- **Risk:** Spam/orphan documents; unbounded per-user submissions (duplicate prevention absent); forged attribution (`submittedBy`) and forged IP/UA metadata, which undermines any later abuse investigation; arbitrarily shaped values (nested objects up to 100 kB) stored in the owner's dataset.
- **Recommended fix:** Load the form by `formId`, require `isPublished`, check `formSlug === form.slug`, enforce multi-submission policy, validate answers server-side against `elements`, set `submittedBy` from `req.user.id`, and derive IP/UA server-side (or drop them).

### F-06 — CONFIRMED — Rate limiter keyed on a client-controlled value, plus a vulnerable library version
- **Severity:** Medium
- **Evidence:** [rateLimiter.ts:11](../../apps/api/src/common/middleware/rateLimiter.ts) uses `req.clientIp` from `request-ip`. Reproduced with the installed `request-ip`: a request with `X-Forwarded-For: 6.6.6.6` yields client IP `6.6.6.6` regardless of the socket address (and `X-Client-IP` is honoured too). This makes the `TRUST_PROXY` setting irrelevant for rate limiting. `express-rate-limit@8.0.1` ([package.json:26](../../apps/api/package.json)) is flagged high by `pnpm audit` (GHSA-46wh-pxpv-q5gq, IPv4-mapped-IPv6 bypass; fixed ≥ 8.0.2). Store is in-memory (per instance).
- **Risk:** Any client rotates a header value to get unlimited requests. Also the memory store grows with attacker-chosen keys.
- **Recommended fix:** Use `req.ip` with a correct `TRUST_PROXY` (express-rate-limit's default keying), upgrade the library, and use a shared store (Redis) if more than one instance runs. Remove `request-ip` unless needed.

### F-07 — CONFIRMED — **FIXED 2026-10-12** — Bodies and saved documents logged with `console.log`
- **Severity:** Medium
- **Status (2026-10-12):** all `console.log` of schemas, bodies and saved documents were removed (`validateRequest` and the form/response services). The remaining `console.*` calls log static strings or env-validation/auth errors, not request data. Pino redaction (S-06) is still missing.
- **Evidence:** [httpHandlers.ts:8-9](../../apps/api/src/common/utils/httpHandlers.ts) logs the Zod schema and `req.body` on **every validated request**; [formService.ts:12,44](../../apps/api/src/api/form/formService.ts) and [formResponseService.ts:12](../../apps/api/src/api/formResponse/formResponseService.ts) log whole saved documents (respondent answers) and user/form ids. Not gated by `NODE_ENV`. Violates the project rule "use `logger`, never log tokens/secrets/full objects".
- **Risk:** Respondent PII and form content land in stdout/log aggregators with unknown retention and wider access than the DB.
- **Recommended fix:** Delete these `console.log` calls; log ids/counts via the pino `logger` with redaction.

### F-08 — WEAKNESS — Auth endpoints bypass the app rate limiter and Helmet; sign-in UX amplifies email sending
- **Severity:** Medium
- **Evidence:** [server.ts:47-54](../../apps/api/src/server.ts) mounts Better Auth **before** `helmet()` (line 58) and `rateLimiter` (line 59), so `/api/auth/*` gets neither. Better Auth's own limiter is `enabled: options.rateLimit?.enabled ?? isProduction` (library source, `create-context.mjs:172`), defaults 100 requests / 10 s, in-memory — i.e. **off in development** and not configured here. [auth/index.ts:26](../../apps/api/src/api/auth/index.ts) sets `sendOnSignIn: true`. The web form ([sign-in-form.tsx:69-92](../../apps/web/src/components/auth/sign-in-form.tsx)) falls back to `signUp.email` whenever sign-in returns `INVALID_EMAIL_OR_PASSWORD`; for an existing account that triggers `sendExistingAccountEmail` (a "someone tried to sign up with your email" message) to the owner.
- **Risk:** (a) An attacker can make the platform send repeated emails to any victim address (verification mails for unverified accounts, "existing account" notices for verified ones); (b) credential stuffing against `/api/auth/sign-in/email` is limited only by Better Auth's default; (c) Resend quota / domain reputation burn.
- **Recommended fix:** Configure Better Auth `rateLimit` explicitly (tight per-path rules for sign-in/sign-up/send-verification, enabled in production, shared storage), apply per-recipient email throttling, and consider separating sign-in from sign-up in the UI. Move Helmet before the auth handler.

### F-09 — VERIFY — Express default error handler may leak stacks
- **Severity:** Medium (if confirmed)
- **Evidence:** [errorHandler.ts](../../apps/api/src/common/middleware/errorHandler.ts) only annotates `res.locals.err` and calls `next(err)`; no handler sends a response, so Express's default handler responds. That handler includes the stack when `NODE_ENV !== "production"` (Express reads `process.env.NODE_ENV`, defaulting to development). `envConfig` defaults `NODE_ENV` to `"production"` when unset, but the [Dockerfile](../../apps/api/Dockerfile) never sets it, so the two disagree. Easily triggered errors: a rejected CORS origin (`new Error("Not allowed by CORS")`, [server.ts:33](../../apps/api/src/server.ts)) and malformed JSON.
- **Verify:** `curl -H "Origin: https://evil.example" <api>/health-check` and send `{` as a JSON body in the deployed container; the response must not contain file paths.
- **Fix:** Set `NODE_ENV=production` in the image/runtime and add a final JSON error handler that never echoes `err.stack`/`err.message`.

### F-10 — WEAKNESS — CORS list is also the auth trust list
- **Severity:** Low–Medium
- **Evidence:** [auth/index.ts:44](../../apps/api/src/api/auth/index.ts) `trustedOrigins: env.CORS_ORIGINS`; `.env.template` (and the local `.env`) include `http://localhost:8080` (the API itself) and `http://localhost:5173` (the deleted Vite admin app). `!origin` requests are always allowed ([server.ts:31](../../apps/api/src/server.ts)).
- **Risk:** Every origin in the list can make credentialed calls *and* is accepted as a callback/redirect target by Better Auth. A stray `localhost` entry in production lets any local process page act as a trusted origin.
- **Fix:** Production list = exact web origin(s) only (https). Remove `5173` and `8080` from the template.

### F-11 — MISSING — Security event logging
- **Severity:** Medium
- **Evidence:** `requireAuth` failures are returned without logging; ownership misses return 404 silently; no logging of sign-in failures/sign-ups (Better Auth is mounted before `requestLogger`, so `/api/auth/*` requests are not logged at all). No alerting, no log shipping config.
- **Fix:** Log auth failures, authz denials, validation-failure bursts and rate-limit hits with request-id and IP, redacted. Mount `requestLogger` before Better Auth.

### F-12 — MISSING — Data privacy lifecycle
- **Severity:** Medium
- **Evidence:** Form DELETE routes exist only as commented-out code ([formRouter.ts:109-118](../../apps/api/src/api/form/formRouter.ts)); no endpoint to list/export/delete responses or users; `FormResponse` stores IP/UA and arbitrary answers in plaintext, with no retention field/TTL index; no account deletion.
- **Fix:** Define retention, add delete/export for forms, responses and accounts, and a privacy notice (the sign-in page footer links to `#`).

### F-13 — WEAKNESS — Dependency advisories
- **Severity:** Medium
- **Evidence:** `pnpm audit --prod` (2026-10-07): 13 findings (3 critical, 3 high, 7 moderate). Relevant breakdown in [secrets.md](secrets.md#dependency-secret-adjacent-notes) and [security-checklist.md](security-checklist.md#14-dependency-security). Runtime-relevant: `express-rate-limit@8.0.1` (+ its `ip-address@10.0.1`). Dev/peer-only (not executed at runtime): `vitest`/`tinypool` pulled in through `better-auth` peers because `.npmrc` sets `auto-install-peers = true`; `braces` via `shadcn` (a CLI listed under `dependencies` in web); `sprintf-js` via the unused `packages/jest-presets`.
- **Fix:** Upgrade `express-rate-limit`; move `shadcn` to `devDependencies`; remove unused leftover packages; add audit to CI.

### F-14 — WEAKNESS — Dockerfile hygiene
- **Severity:** Low–Medium
- **Evidence:** [Dockerfile:2,23](../../apps/api/Dockerfile) `node:23.11.1` (odd-numbered, non-LTS, out of support; repo requires Node ≥ 24); no `.dockerignore`, so `COPY . .` (line 19) sends `apps/api/.env` and `node_modules` into the build context/stage (the final image does not copy them); no `NODE_ENV`; no `HEALTHCHECK`; base images not pinned by digest. It copies `pnpm-lock.yaml` from the `apps/api` directory, but the lockfile lives at the repo root (**VERIFY**: build as written likely fails when the context is `apps/api`).
- **Fix:** Pin an LTS image by digest, add `.dockerignore` (`.env*`, `node_modules`, `.git`), set `NODE_ENV=production`, fix the build context.

### F-15 — MISSING — Account security features
- **Severity:** Medium
- **Evidence:** `emailAndPassword` only sets `enabled`, `requireEmailVerification`, `minPasswordLength: 8` ([auth/index.ts:15-22](../../apps/api/src/api/auth/index.ts)). No `sendResetPassword` (no reset flow), no 2FA plugin, no lockout, no explicit `session`/`advanced` config. Cookie `Secure`/`SameSite`/`HttpOnly`, OAuth-token-at-rest encryption, and account-linking behaviour are therefore library defaults — **VERIFY** against the deployed domain (see F-17).
- **Fix:** Pin cookie options for production; add MFA for owners of forms with response data; add reset flow; consider `account.encryptOAuthTokens`.

### F-16 — WEAKNESS — Swagger UI is public
- **Severity:** Low
- **Evidence:** [openAPIRouter.ts](../../apps/api/src/api-docs/openAPIRouter.ts) serves UI at `/` and spec at `/swagger.json` unconditionally. The spec documents `/api/v1/forms-response/create`, but the real mount is `/api/v1/form-response`; `/u/users` and `/api/auth/*` are absent.
- **Fix:** Disable or protect in production; fix the path.

### F-17 — VERIFY — CSRF/cookie posture
- **Severity:** Low
- **Evidence:** No CSRF token on `/api/v1/*`; protection relies on cookie `SameSite` (Better Auth default; unverified here) plus CORS preflight for JSON. `express.urlencoded({ extended: true })` ([server.ts:57](../../apps/api/src/server.ts)) lets a plain cross-site HTML form post a body that the API accepts. Safe in dev (`localhost` ports are same-site); production domain layout is undefined in the repo.
- **Fix:** Confirm `SameSite=Lax/Strict` and `Secure` on the session cookie in production; remove `urlencoded` if no form-encoded endpoints exist; keep web and API on one registrable domain.

### F-18 — MISSING — Web hardening
- **Severity:** Low
- **Evidence:** [next.config.ts](../../apps/web/next.config.ts) is empty (no CSP/headers); no `middleware.ts`; `/dashboard` is a client-side redirect only (acceptable now because it fetches no data). `shadcn` and an unfamiliar `cn@0.4.0` utility package are runtime dependencies (**VERIFY** the `cn` package provenance; the usual shadcn stack is `clsx` + `tailwind-merge`).
- **Fix:** Add CSP and standard headers via `headers()`; enforce session server-side for protected routes when real data arrives.

### F-19 — MISSING — Security tests and CI gates
- **Severity:** Medium
- **Evidence:** Tests exist only for health check, OpenAPI router, error handler and request logger; `apps/api/src/__tests__/server.test.ts` is deleted in the working tree; no test covers `requireAuth` or cross-user access (which would have caught F-02). No `.github/` workflows, no Renovate/Dependabot config in the repo (README mentions Renovate; none present).
- **Fix:** Add two-user authorization tests for every `/api/v1` route; run `pnpm audit`, typecheck and tests in CI.

### F-20 — REC — Forward-looking risks from roadmap notes
`apps/api/src/docs/*.mdx` describe outbound webhooks, third-party tool connections (Notion, Slack, Sheets), a queue/outbox worker, QR/links and AI processing. None exist yet. When added they introduce SSRF (user-supplied webhook URLs), third-party credential storage, prompt-injection from respondent text into an AI pipeline, and file/response exports. Plan controls first (URL allow-listing, credential encryption, per-tenant isolation).

## 9. Attack scenarios

1. **User harvest → targeted phishing.** `curl https://api/u/users` → JSON of all emails (F-01). No login, no rate-limit bypass needed.
2. **Draft form theft.** Attacker signs up (open registration), calls `GET /api/v1/forms/<victimFormId>` (F-02) or `/by-slug/<slug>` (F-03) and reads unpublished questions and the owner's id.
3. **Counter / publish-state tampering.** Attacker creates a form posting `{"viewCount":999999,"isPublished":true,...}`; fields persist (F-04).
4. **Fake responses.** Any verified user posts responses to *any* `formId`, with forged `submittedBy` and IP, unlimited times (F-05) — pollutes the owner's data and analytics.
5. **Brute force / email bombing.** Attacker scripts `/api/auth/sign-in/email` with rotating `X-Forwarded-For` for the app-level limiter (F-06) and relies on the unlimited auth mount (F-08); each wrong password against a real account also triggers the web form's sign-up fallback → victim receives notices.
6. **Log mining.** Anyone with log access reads respondent PII printed by `console.log` (F-07).
7. **Stack-trace recon.** Send a disallowed `Origin` to a container running without `NODE_ENV` (F-09).

## 10. Missing-mitigation summary (priority order)

1. Remove/lock `/u/users` (F-01). 2. Fix `findById` scoping (F-02). 3. Public-form projection + `isPublished` check + response validation (F-03, F-05). 4. Use parsed Zod output everywhere (F-04). 5. Remove `console.log` of data (F-07). 6. Fix rate limiting + auth throttling (F-06, F-08). 7. `NODE_ENV`, error handler, CORS list (F-09, F-10). 8. Upgrade/clean dependencies, CI gates, tests (F-13, F-19). 9. Account hardening and privacy lifecycle (F-12, F-15). 10. Web headers, Dockerfile (F-14, F-18).

## 11. Limits of this assessment

Static review of the working tree; no live deployment, DB contents, production env values, Atlas network rules, DNS/TLS or Resend/Google/GitHub console settings were available. Items marked VERIFY depend on those. Better Auth defaults were read from the installed library (v1.7.7), not from its docs.
