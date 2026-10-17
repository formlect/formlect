# Formlect — Attack Surface

Assessed: 2026-10-07 from the current working tree. Companion: [threat-model.md](threat-model.md) · [secrets.md](secrets.md) · [security-checklist.md](security-checklist.md). Finding IDs (`F-xx`) are defined in the threat model.

Legend — Auth column: **None** = anonymous; **Session** = `requireAuth` (any verified logged-in user); **Owner** = Session + `userId` ownership scoping in the service.

## 1. Public endpoints (reachable by anyone)

| Method / path | Handler | Auth | Rate limit | Notes |
|---|---|---|---|---|
| `GET /health-check` | [healthCheckRouter.ts](../../apps/api/src/api/healthCheck/healthCheckRouter.ts) | None | App limiter | Static response, no dependency check. |
| **`GET /u/users`** | [user/index.ts](../../apps/api/src/api/user/index.ts) | **None** | App limiter | **F-01.** Returns every user (name, email, verified flag, image, timestamps). |
| `GET /` | [openAPIRouter.ts](../../apps/api/src/api-docs/openAPIRouter.ts) | None | App limiter | Swagger UI, always on (F-16). |
| `GET /swagger.json` | same | None | App limiter | Machine-readable endpoint list. |
| `ALL /api/auth/{*authPath}` | Better Auth via `toNodeHandler` ([server.ts:47](../../apps/api/src/server.ts)) | None (it *is* auth) | **Not covered by app limiter or Helmet** (mounted earlier, F-08). Better Auth's own limiter is on only when `NODE_ENV=production`. | See §3. |
| Next `/` → `/sign-in`, `/sign-in`, `/dashboard` | [apps/web/src/app](../../apps/web/src/app) | None (dashboard redirects client-side if no session) | n/a | Static/client pages; no data fetched except the session. |

## 2. Authenticated application endpoints (`/api/v1/*`)

All use `requireAuth` ([requireAuth.ts](../../apps/api/src/common/middleware/requireAuth.ts)): resolves the Better Auth session from the cookie; any error → 401. No roles exist.

| Method / path | Validation | Data access | Authorization | Findings |
|---|---|---|---|---|
| `GET /api/v1/forms` | none | `Form.find({ userId })` + count | Owner | OK (lists only own forms; unpaginated). |
| `GET /api/v1/forms/:id` | none (`:id` string) | `findById({_id, userId})` | **Session only — `userId` dropped by Mongoose** | **F-02** IDOR (reproduced). Invalid ObjectId → CastError → generic 500 message. |
| `GET /api/v1/forms/by-slug/:slug` | none | `findOne({ slug })` | **Session only; no `isPublished`** | **F-03**. Returns owner `userId`, counts. |
| `POST /api/v1/forms/create` | Zod `CreateFormSchema` (result discarded) | `new Form({...req.body, userId})`, `save()` | Owner set server-side | **F-04** mass assignment; client-chosen slug (min 10, no charset/max); unique index on `slug` → duplicate returns a generic 500. |
| `PATCH /api/v1/forms/:id/basic-information` | Zod (result discarded) | `findOneAndUpdate({_id, userId}, $set{title, description, settings})` | Owner | **F-04**: whole `settings` replaced by unvalidated object; no max lengths. |
| `PATCH /api/v1/forms/:id/elements` | Zod `FormElementSchema[]` (result discarded) | `findOneAndUpdate({_id, userId}, $set{elements})` | Owner | No cap on array length beyond 100 kB body; `validation.pattern` is free text (future ReDoS). |
| `PATCH /api/v1/forms/:id/publish` | Zod `{ publish: boolean }` | `findOneAndUpdate({_id, userId}, $set{isPublished, publishedAt})` | Owner | OK. |
| `POST /api/v1/form-response/create` | Zod (formId, formSlug, answers[], metadata) (result discarded) | `new FormResponse({...req.body}).save()` | **Session only** | **F-05**: no form lookup/publish/slug match/answer validation; `submittedBy`, `ipAddress`, `userAgent` client-controlled; no duplicate control. |

**Status 2026-10-12 (schema migration):** the table above describes the pre-migration state. Now: `GET /:id` and the PATCH routes resolve access by workspace membership/collaborator and writes need owner/admin/editor (F-02 fixed); `:id` params are validated as ObjectIds (400 instead of a Mongoose CastError 500); `by-slug` serves only published snapshots through a public projection (F-03 fixed); `create`/PATCH use the parsed body with caps (F-04 fixed); `PATCH /:id/elements` is now `PATCH /:id/fields`; form-response create is validated against the published snapshot (F-05 mostly fixed). Still session-only: `by-slug` and response-create require login. A duplicate slug now returns 409.

Routes that exist only as **commented-out code** (not reachable): `PUT/DELETE /forms/:id`, publish/unpublish variants, `increment-view`, `GET /slug/:slug`. There is **no endpoint to read responses**.

## 3. Authentication / authorization surfaces

| Surface | Detail | Evidence |
|---|---|---|
| Email + password | `signUp/signIn` through Better Auth; verification required before session; min password length 8 (max = library default). | [auth/index.ts:15-22](../../apps/api/src/api/auth/index.ts) |
| Email verification | Link emailed via Resend; `sendOnSignUp` and **`sendOnSignIn: true`** (re-sent when an unverified user signs in); `autoSignInAfterVerification`. Token lives in the URL query. | auth/index.ts:24-31 |
| Duplicate sign-up | Generic response + "existing account" email, not awaited (anti-enumeration/timing). | auth/index.ts:19-21 |
| Social login | Google, GitHub; callback URLs from env; client secrets server-side. Account linking = library default (**VERIFY**). | auth/index.ts:32-43 |
| Session | Cookie session in Mongo; 7-day expiry, 1-day refresh (library defaults); cookie flags not explicitly set (**VERIFY** Secure/SameSite/HttpOnly in prod). | `better-auth` `create-context.mjs:147-148` |
| Origin / CSRF | Better Auth origin check against `trustedOrigins = CORS_ORIGINS`; not disabled. | auth/index.ts:44 |
| App-route auth | `requireAuth` (cookie → session). No bearer/API-key auth. `Authorization` header is allowed by CORS but unused. | requireAuth.ts, server.ts:39 |
| Authorization model | **Owner-only by `userId`**; no roles/RBAC; no org/team sharing; no per-form respondent access control. | services |
| Missing | Password reset flow, MFA, lockout, session listing/revocation UI, re-auth for sensitive actions (F-15). | — |
| Web client | `better-auth@1.7.7` React client; `signIn.email`→fallback `signUp.email`; passes absolute `callbackURL` built from `window.location.origin`. | [sign-in-form.tsx:40-92](../../apps/web/src/components/auth/sign-in-form.tsx) |

## 4. User-controlled inputs

| Input | Where it enters | Server-side constraint | Sink |
|---|---|---|---|
| Email, password, name | `/api/auth/*` | Better Auth validation; password ≥ 8 | DB (Better Auth), outbound email `to` |
| `callbackURL` | `/api/auth/*` body | Must match `trustedOrigins` (library check; **VERIFY** for sign-up/verify routes) | Redirect after verification/OAuth |
| `title`, `description`, `slug` | create/update | Zod lengths on create (title ≤ 200, description ≤ 1000, slug ≥ 10 only); none on basic-information | Mongo; shown to respondents later (stored-XSS sink once rendered) |
| `elements[]` (labels, help text, options, `validation.pattern`, `errorMessage`) | PATCH elements | Zod shape, enum for `type`; strings unbounded except by 100 kB body | Mongo; rendered later; pattern may be evaluated as a RegExp later |
| `settings.*` (colors, fonts) | create / basic-information | **Unvalidated strings** (F-04) | Mongo; CSS/HTML context later |
| `answers[].value` | form-response create | `unknown`/`Mixed`; any JSON shape | Mongo; read by form owner; exported/integrated later |
| `metadata.ipAddress/userAgent/timeToComplete`, `submittedBy` | form-response create | client-supplied (F-05) | Mongo |
| `:id` / `:slug` params | Express params (always strings) | No format validation | Mongoose queries (strings, not operators → no NoSQL operator injection found) |
| `X-Request-Id`, `X-Forwarded-For`, `X-Client-IP` headers | all routes | Request-id echoed in header/log (unbounded); IP headers trusted by `request-ip` (F-06) | Logs, rate-limit key |
| `Origin` header | CORS | Allow-list; missing origin allowed | Error path (F-09) |

**Injection assessment:** every Mongo filter is built from `req.params` strings or the session `user.id`; body values only feed `$set`/inserts, where Mongoose casts to the schema type (object-valued `title` etc. → cast error, not operator execution). No raw `$where`, no string-concatenated queries, no `eval`/`child_process`/template rendering found in `apps/api/src`. **No confirmed injection vector.**

## 5. File uploads

**None.** No multer/busboy, no multipart handling, no storage SDK in either app. `express.json` and `urlencoded` only. (Roadmap mentions integrations/exports; revisit when added.)

## 6. Database access

| Aspect | State |
|---|---|
| Engine | MongoDB (Atlas SRV in local `.env`); Mongoose 9.11 + Better Auth Mongo adapter share one connection/`DATABASE_URL`. |
| Collections | `forms`, `formresponses` (Mongoose); `user`, `session`, `account`, `verification` (Better Auth). Mongoose `User` model is a **read-only mirror** of `user`. |
| Credentials | One DB user for everything (no separation between app data and auth data). |
| Tenancy | Enforced only in service-layer filters; DB-level none. F-02 shows the weak spot. |
| Indexes | `forms.slug` unique; `forms{userId,createdAt}`; `formresponses.formId`. No TTL/retention index. |
| Query safety | Parameterised through Mongoose casting; see injection assessment. |
| Exposure | Atlas network allow-list, TLS, backups, encryption at rest: **not visible in the repo (VERIFY)**. |

## 7. Storage

No object/file storage. Persistent data = MongoDB only. Browser storage in web: none beyond Better Auth cookie/session client state (no `localStorage` use found). Logs go to stdout (pino + `console.log`).

## 8. Webhooks

**Inbound webhooks: none.** **Outbound webhooks: none.** The Better Auth OAuth callbacks (`/api/auth/callback/google|github`) are the only provider-initiated inbound requests; they are handled by Better Auth. Roadmap notes describe outbound webhooks (F-20): they will need SSRF protection.

## 9. Third-party integrations

| Service | Direction | Credential | Data sent | Notes |
|---|---|---|---|---|
| Resend | API → Resend | `RESEND_API_KEY` | recipient email, subject, HTML (verification URL) | Failure paths logged without secrets; send is fire-and-forget (`void`). |
| Google OAuth | Browser ↔ Google ↔ API | client id/secret | profile, email | Callback URL env-configured. |
| GitHub OAuth | same | client id/secret | profile, email | same |
| MongoDB Atlas | API → DB | creds in `DATABASE_URL` | all app data | Single shared credential. |
| Google Fonts | Build-time (`next/font/google`) | none | none at runtime (self-hosted by Next) | — |
| Gmail / Outlook links | Browser navigation only | none | none | `target=_blank` with `rel="noreferrer"`. |
| Google Sheets, Notion, Slack, Zapier | **Not implemented** (removed / roadmap) | — | — | Do not reintroduce without threat review. |

## 10. Admin surfaces

None: no admin UI, no admin routes, no role field. `apps/admin` was deleted from the working tree. Consequence: there is currently no legitimate caller for `GET /u/users`, which strengthens the case for removing it (F-01). Any future admin feature needs a role model first.

## 11. Network / deployment exposure

| Item | State |
|---|---|
| Ports | API `PORT` (default 8080, `app.listen(port)` binds all interfaces; `HOST` is only used for the log line). Web 3000. |
| Dockerfile | [apps/api/Dockerfile](../../apps/api/Dockerfile): multi-stage, non-root `node`, `EXPOSE 8080`. Issues: Node 23.11.1 base, no `.dockerignore`, no `NODE_ENV`, no `HEALTHCHECK`, lockfile path (F-14). |
| TLS / HSTS | Not terminated by the app; Helmet adds HSTS to routes after it. Must be provided by the proxy/platform. |
| Reverse proxy | `TRUST_PROXY` = number of proxies (template `0`). Wrong value distorts `req.ip`, but the limiter uses `request-ip` anyway (F-06). |
| CORS | Allow-list from `CORS_ORIGINS`, credentials on; requests without `Origin` allowed (F-10). |
| Security headers | Helmet defaults for app routes; **none** on `/api/auth/*`; none configured in Next (F-18). |
| CI/CD | None in repo (no `.github`). No IaC. Platform unknown. |
| Request limits | JSON/urlencoded 100 kB (Express default); no server timeouts configured. |
| Process | Graceful shutdown with 10 s forced exit; `unhandledRejection` logged, not fatal. |

## 12. Dependencies and other reachable surfaces

- `pnpm audit --prod` (2026-10-07): **13 findings — 3 critical, 3 high, 7 moderate.**
  - Runtime-relevant: `express-rate-limit@8.0.1` (high, GHSA-46wh-pxpv-q5gq) and its `ip-address@10.0.1` (3 moderate + 1 high advisories). Fix by upgrading `express-rate-limit`.
  - Present only because of `auto-install-peers`: `vitest@3.2.4`, `tinypool`, `@vitest/mocker` (critical/moderate advisories) via `better-auth`. Not executed at runtime; they still ship in `pnpm install --prod`.
  - `braces` via `shadcn` (a CLI in web `dependencies`); `sprintf-js` via unused `packages/jest-presets`.
- Version notes: `apps/api` declares `better-auth ^1.3.31` and resolves **1.7.7** (equal to web's pinned 1.7.7 — keep client and server in sync). Direct dependency `@neondatabase/serverless` is unused.
- Starter-leftover packages (`packages/ui`, `logger`, `config-*`, `jest-presets`) are in the workspace but not used by the apps; they widen the audited dependency tree for no benefit.
- Process env, `.env` files, local logs, Docker build context and the npm registry are non-network surfaces to protect (see [secrets.md](secrets.md)).
- Documentation inconsistency that affects consumers: OpenAPI declares `/api/v1/forms-response/create`; the real route is `/api/v1/form-response/create`.

## 13. Summary matrix

| Surface | Exposure | Top issue |
|---|---|---|
| Anonymous HTTP | `/u/users`, Swagger, health, auth | F-01, F-16 |
| Authenticated HTTP | 8 routes | F-02, F-03, F-04, F-05 |
| Auth flows | email, Google, GitHub | F-08, F-15 |
| Logs | stdout | F-07, F-11 |
| DB | single Atlas cluster/user | F-02, F-12 |
| Build/deploy | Dockerfile, no CI | F-13, F-14, F-19 |
| Web | sign-in + placeholder | F-18 |
