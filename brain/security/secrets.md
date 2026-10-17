# Formlect — Secrets Assessment

Assessed: 2026-10-07. **No secret values appear in this document.** Only names, locations, types, lengths/shape and risk are recorded. Companion: [threat-model.md](threat-model.md) · [attack-surface.md](attack-surface.md) · [security-checklist.md](security-checklist.md)

Finding classes: CONFIRMED · WEAKNESS · MISSING · VERIFY · REC (see [threat-model.md](threat-model.md#how-to-read-this-document)).

## 1. Where secrets are expected

| Name | Type | Consumer | Defined in | Required by schema | Sensitivity |
|---|---|---|---|---|---|
| `BETTER_AUTH_SECRET` | Signing/encryption secret for sessions, tokens | API (Better Auth) | `apps/api/.env`, deployment env | Yes, `min(32)` | **Critical** |
| `DATABASE_URL` | MongoDB connection string **with embedded credentials** | API (Mongoose + Better Auth adapter) | `apps/api/.env` | Yes, non-empty | **Critical** |
| `GOOGLE_SECRET` (+ `GOOGLE_ID`) | OAuth client secret | API | `apps/api/.env` | Yes, non-empty | High |
| `GITHUB_SECRET` (+ `GITHUB_ID`) | OAuth client secret | API | `apps/api/.env` | Yes, non-empty | High |
| `RESEND_API_KEY` | Email-sending API key | API (`mailer.ts`) | `apps/api/.env` | Optional; **mandatory when `NODE_ENV=production`** | High |
| `NEXT_PUBLIC_API_URL` | Public API base URL (not a secret) | Web (browser) | `apps/web/.env.local` | n/a | Public by design |

Non-secret but security-relevant config: `CORS_ORIGINS`, `TRUST_PROXY`, `BETTER_AUTH_URL`, `WEB_URL`, `*_REDIRECT_URI`, `COMMON_RATE_LIMIT_*`, `NODE_ENV`, `EMAIL_FROM`.

Not used by the code today: `@neondatabase/serverless` is declared in `apps/api/package.json` but never imported (Postgres/Neon, a different datastore than Mongo) — no related secret exists.

## 2. Environment / configuration handling

**What is done well (verified):**
- All env access goes through [envConfig.ts](../../apps/api/src/common/utils/envConfig.ts); `process.env` is read nowhere else in `apps/api/src` (grep).
- Zod validates at boot and throws on failure; secret length floor of 32 for `BETTER_AUTH_SECRET`; production requires `RESEND_API_KEY`.
- `.env` is git-ignored ([apps/api/.gitignore:16](../../apps/api/.gitignore), root `.gitignore`); `apps/web/.gitignore:34` ignores `.env*`. `git ls-files` shows **no tracked `.env` file** anywhere.
- Template with empty values exists: [apps/api/.env.template](../../apps/api/.env.template). OAuth callback URLs are env vars (not hardcoded).
- Client-side env use is limited to one `NEXT_PUBLIC_` URL; no secret is referenced in `apps/web/src`.
- Dockerfile does not `COPY` any `.env` into the final image (runner copies only `node_modules` and `dist`).
- `turbo.json` (api) lists env names (names only) for build hashing.

**Gaps:**
- **WEAKNESS** — `envConfig.ts` only checks length for `BETTER_AUTH_SECRET`; a 32-char repeated string passes. No entropy check, no rotation tooling.
- **WEAKNESS** — `NODE_ENV` defaults to `"production"` in the zod schema when unset ([envConfig.ts:18](../../apps/api/src/common/utils/envConfig.ts)) but the Dockerfile never sets it, and Express uses its own default (development). See F-09.
- **WEAKNESS** — `apps/web/.gitignore` uses `.env*`, so `apps/web/.env.example` (the only template for `NEXT_PUBLIC_API_URL`) is also ignored and will not be committed. REC: add `!.env.example`.
- **MISSING** — No secret scanning (gitleaks/GitHub push protection config), no pre-commit hook, no CI.
- **MISSING** — No documented production secret store (platform secret manager) or ownership of each credential.

## 3. Findings with evidence

### S-01 — CONFIRMED (local state) — Live credentials exist in the local `apps/api/.env`
- **Severity:** Informational now; **High if the file leaks** (laptop sharing, backups, AI-tool context, screen-share, accidental `git add -f`).
- **Evidence:** `apps/api/.env` exists, is ignored by git, and contains non-empty values for `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_ID/SECRET`, `GITHUB_ID/SECRET` (checked by key name and value length only; `BETTER_AUTH_SECRET` length satisfies the 32-char rule; `RESEND_API_KEY` is empty). `DATABASE_URL` uses the `mongodb+srv://` scheme with embedded user credentials, i.e. a **hosted Atlas cluster**, not a local Mongo.
- **Risk:** The development process points at a cloud database holding real account/response data if anyone uses it for more than throwaway data; whoever reads the file owns the DB and OAuth apps.
- **Affected:** `apps/api/.env`.
- **Why it matters:** The file sits inside a workspace that AI tooling and editors index; the repo has no secret-scanning backstop.
- **Recommended fix:** Use a separate dev database/user with least privilege and an Atlas IP allow-list; keep prod secrets only in the deployment platform; ensure the dev OAuth apps are separate from production ones.

### S-02 — VERIFY — Stale Google Sheets service-account instructions in `.env`
- **Severity:** Low–Medium
- **Evidence:** `apps/api/.env` still contains comment lines for a "Google Sheets Integration (Service Account)" and a duplicated block of settings, although no such variables are defined and [apps/api/.claude/CLAUDE.md](../../apps/api/.claude/CLAUDE.md) says the integration "was removed on purpose".
- **Risk:** If a service-account JSON key was ever created for that integration, it is still valid until revoked, and may exist in a Downloads folder or password manager.
- **Fix:** Revoke/delete the service-account key in Google Cloud if it is no longer used; delete the dead comment block locally.

### S-03 — CONFIRMED (absence) — No hardcoded secrets in source
- **Evidence:** Regex scan of the tree excluding `node_modules`, `.next`, `.git`, `.turbo` and `.env*` files for Mongo URIs with credentials, `re_…`/`ghp_…`/`AIza…`/`GOCSPX-…` key shapes, private-key headers and `sk_live`: **0 matches**. Source files read in full contain no literals of that kind.
- **Note:** The scan is pattern-based; it cannot prove the absence of every secret format.

### S-04 — Git / history exposure
- **Evidence:** One commit in history (`68a8213 Initial commit from create-turbo`); `git ls-files` lists no `.env*`; nothing under `apps/api` or `apps/web` is committed yet (everything is untracked/modified). History therefore cannot contain these secrets today.
- **Risk (forward-looking, REC):** First commit of the new apps is the exposure point. `.env` is ignored in both `.gitignore` files (good), but `.env.local`/`.env.example` in web are covered only by `.env*`, and a forced add or a different filename (`.env.production`, `credentials.json` is ignored in api only) is not guarded at the root.
- **Fix:** Before the first commit run a secret scan (`gitleaks detect --no-git` on the tree), add root-level `.env*` + `!.env.example`/`!.env.template` patterns, and enable GitHub secret scanning/push protection on the remote.

### S-05 — Client-side exposure
- **Evidence:** [apps/web/src/lib/auth-client.ts](../../apps/web/src/lib/auth-client.ts) reads only `NEXT_PUBLIC_API_URL`. A grep of `apps/web/src` for `process.env` shows no other variable. No API keys, DB strings or OAuth secrets exist in the web package.
- **Class:** No finding. Keep `NEXT_PUBLIC_*` limited to non-secret URLs; the build bakes that value into the JS bundle.
- **Related (hygiene):** The session cookie is HttpOnly by Better Auth default (**VERIFY** in the deployed response headers); the dashboard renders only name/email from the session.

### S-06 — Logging / error exposure
| Item | Evidence | Class |
|---|---|---|
| Request bodies printed | [httpHandlers.ts:8-9](../../apps/api/src/common/utils/httpHandlers.ts) `console.log(req.body)` on every validated request (F-07). Today's validated bodies are form content and responses, not credentials; but any future route that accepts a token/secret through `validateRequest` would be logged. | CONFIRMED |
| Saved documents printed | `formService.ts:12,44`, `formResponseService.ts:12` | CONFIRMED |
| Verification links logged in dev | [mailer.ts:22](../../apps/api/src/common/utils/mailer.ts) logs the verification URL (a bearer-like token) when `RESEND_API_KEY` is unset. Guarded: the env schema forbids that state when `NODE_ENV=production`. | WEAKNESS (dev only; risk if prod runs with `NODE_ENV=development`) |
| Invalid-env dump | [envConfig.ts:61](../../apps/api/src/common/utils/envConfig.ts) prints `parsedEnv.error.format()`. Zod formats messages, not received values for string checks, so values are not echoed, but custom messages could change that. | REC |
| DB URI logging | `db/index.ts` logs only static strings ("MongoDB connected"). `DATABASE_URL` is not logged. | OK |
| Stack traces | Possible via Express default handler if `NODE_ENV` is unset (F-09). A stack can reveal file paths and, for driver errors, connection details. | VERIFY |
| Request URL logging | `pino-http` serializer logs `req.url` including query strings ([requestLogger.ts:39-43](../../apps/api/src/common/middleware/requestLogger.ts)). Better Auth's verify-email URL carries a token in the query, but those requests are handled **before** `requestLogger` and are not logged by it. If the order is ever changed (recommended in F-11) the serializer must strip query strings. | REC |
| Log redaction | No pino `redact` configuration anywhere. | MISSING |

### S-07 — Better Auth secret usage
- `BETTER_AUTH_SECRET` is consumed implicitly by Better Auth from `process.env` and also validated in `envConfig.ts` (the code does not pass `secret:` explicitly in [auth/index.ts](../../apps/api/src/api/auth/index.ts)). Better Auth refuses the default secret when its own `NODE_ENV` is `production`.
- **Rotation impact:** changing it invalidates existing sessions and any signed/encrypted values derived from it. Plan a rotation window.

### S-08 — Secrets at rest in the database
- **VERIFY** — Better Auth stores OAuth provider tokens in the `account` collection; encryption of those tokens is not configured here (`account.encryptOAuthTokens` is not set). Password hashes are managed by Better Auth. The DB therefore holds sensitive material beyond form data; protect the Atlas cluster accordingly (network allow-list, least-privilege DB user, encryption at rest on Atlas, backups with the same protections).

### S-09 — Dependency / supply-chain notes (secret-adjacent)
- `pnpm install --frozen-lockfile --ignore-scripts` in the Dockerfile reduces install-time secret exfiltration risk; `pnpm-workspace.yaml` limits `allowBuilds` to four packages.
- **VERIFY** — `apps/web` depends on `cn@0.4.0` (a small third-party package) instead of the standard `clsx` + `tailwind-merge`; confirm provenance. It runs in the browser bundle.
- `.npmrc` `auto-install-peers = true` is why test-runner packages (`vitest`, `tinypool`) appear in the prod dependency tree of `apps/api` via `better-auth` peers (audit: critical advisories, not executed at runtime).

## 4. Rotation requirements

| Secret | Rotate when | How | Side effects |
|---|---|---|---|
| `BETTER_AUTH_SECRET` | Suspected leak, staff change, at least yearly | Generate new random value (≥32 bytes), deploy, accept session invalidation | All users signed out; pending verification links invalid |
| `DATABASE_URL` credentials | Leak, staff change, 90 days | Create new Atlas DB user, switch env, delete old user | Brief reconnect; update every consumer |
| `GOOGLE_SECRET` | Leak; console shows it was pasted anywhere | Reset in Google Cloud Console, update env, redeploy | Sign-in with Google fails until deployed |
| `GITHUB_SECRET` | Same | Regenerate in GitHub OAuth App settings | Same |
| `RESEND_API_KEY` | Leak, staff change | Create new key, delete old | Email paused during swap |
| Any Google Sheets service-account key (if it ever existed) | Now (S-02) | Delete key in Google Cloud | None (feature removed) |

Because the current `.env` has been used on a developer machine with AI tooling and editors, treat a **first rotation before any production launch** as required, not optional.

## 5. Hardcoded-secret risk patterns to watch (project-specific)

- `.env.template` defaults for `CORS_ORIGINS`/URLs are non-secret, but copying the template verbatim to production keeps `localhost` trusted origins (F-10).
- `EMAIL_FROM` default is `onboarding@resend.dev`, which Resend limits to the account owner's address; production needs a verified domain (functional + deliverability).
- Docs in `apps/api/src/docs/*.mdx` discuss storing third-party credentials in `FormSchema` for native integrations. If built, those credentials must be encrypted at application level (KMS/libsodium) and never returned by form read endpoints (note that `GET` form endpoints currently return the whole document).

## 6. Checklist for the next change touching config

1. New env var → zod schema, `.env.template`, `apps/api/turbo.json` `env`, and this document.
2. No secret in `NEXT_PUBLIC_*`.
3. No `console.log` of env, bodies, headers, cookies, URLs with tokens.
4. Run a secret scan before the first commit and on every PR.
