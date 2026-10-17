# apps/api — Express backend

Express 5, TypeScript (run via `tsx`), Mongoose 9 on MongoDB, Better Auth, zod 3 + zod-to-openapi, pino, vitest.
Formatter/linter: **biome** (tabs, 120 cols). Not ESLint/Jest/tsdown (those config files are leftovers).
Path alias: `@/*` → `src/*` (tsconfig `paths`; vitest uses `vite-tsconfig-paths`). `tsconfig.json` is standalone. Do not
add an `extends` to `@repo/typescript-config` (not installed here; it breaks tsx alias resolution).

## Commands (run in apps/api)

```sh
pnpm dev            # node --import=tsx --watch src/index.ts  (startup takes ~15-20s: Mongo connect)
pnpm test           # vitest run
pnpm check          # biome check --write
npx tsc --noEmit
pnpm build          # tsc && tsup
```
Verify: `curl localhost:8080/health-check`. Swagger UI is served by `src/api-docs/openAPIRouter.ts`.
`package.json` has no `"type": "module"`, so **no top-level await** (tsx compiles to CJS). Wrap startup code in an async `main()`.

## Structure

```
src/
  index.ts            entry: connectDB() -> app.listen -> graceful shutdown
  server.ts           builds `app` + exports `logger` (pino); middleware order matters (see below)
  api/<feature>/      one folder per resource: Router, Controller, Service, Model(zod)
    auth/             Better Auth, lazy `getAuth()` (needs the Mongo connection first)
    form/             forms: list/get/create, basic-information, fields, publish (snapshots a FormVersion), public by-slug
    formResponse/     submit a response (+ formResponseValidation.ts: answers checked against the published snapshot)
    workspace/        CRUD routes + workspaceAccess.ts (membershipsOf / ensurePersonalWorkspace / personalSlug)
    healthCheck/ user/
  api-docs/           OpenAPI generator + `createApiResponse` helper
  common/
    middleware/       requireAuth, rateLimiter, requestLogger, errorHandler
    models/serviceResponse.ts   the response envelope
    utils/envConfig.ts          THE ONLY place that reads process.env
    utils/httpHandlers.ts       validateRequest(zodSchema): replaces req.body with the PARSED body
    utils/mongoErrors.ts        toServiceFailure(ex, action): ValidationError/CastError -> 400, VersionError/duplicate -> 409, else generic 500
  db/index.ts         connectDB / disconnectDB / getMongoDbAndClient
  db/schema/          Mongoose models, one folder per domain (see "Data model"); import from `@/db/schema` (barrel)
  types/              shared TS types (IUser)
```

## Layering (follow for every new endpoint)

`Router` (zod OpenAPI registration + `requireAuth` + `validateRequest`) → `Controller` (thin: pull params/body/`req.user`,
call service, `res.status(r.statusCode).send(r)`) → `Service` (try/catch, Mongoose calls, returns `ServiceResponse`) →
`db/schema` model. Services never throw to the controller: they return `ServiceResponse.success/failure`.

Add a feature: create `src/api/<name>/{<name>Model,<name>Service,<name>Controller,<name>Router}.ts`, mount the router in
`server.ts` under `/api/v1/<name>`, and register its OpenAPIRegistry in `api-docs/openAPIDocumentGenerator.ts`.

## Routes (mounted in server.ts)

- `/health-check`, `/u/users`, `/api/auth/{*authPath}` (Better Auth)
- `/api/v1/forms`: `GET /`, `GET /:id`, `GET /by-slug/:slug`, `POST /create`, `PATCH /:id/basic-information`,
  `PATCH /:id/fields`, `PATCH /:id/publish` (all `requireAuth`). Access = member of the form's workspace or a form collaborator;
  writes need owner/admin/editor. `by-slug` returns only the PUBLISHED snapshot (public projection).
- `/api/v1/form-response`: `POST /create` (`requireAuth`)
- `/api/v1/onboarding`: `POST /complete` `{ workspaceName }` (`requireAuth`): renames the personal workspace, sets Better Auth `user.isOnboarded`
  (an `additionalFields` entry, `input: false`). A `databaseHooks.user.create.after` hook creates the "Default workspace" on sign-up;
  `user.update.before` caps name (100) and requires an https `image`.
- `/api/v1/workspaces`: `GET /`, `POST /create`, `GET /:id`, `PATCH /:id` (name, logoUrl, brand colours), `DELETE /:id` (all `requireAuth`).
  Membership is in the query (non-member = 404); PATCH needs owner/admin; DELETE is owner-only, soft delete, and refuses the personal
  workspace (409). Invites are not returned.

## Stable, current practices (always)

- Use the current stable API of the installed versions (see Stack line above; `pnpm --filter api list express mongoose better-auth zod`
  for exact ones). Never use deprecated, removed or legacy patterns, and never fall back to an older style because it is
  more familiar. Do not add or pin older dependency versions; do not use beta/canary/experimental features unless asked.
- Verify before using an API you are not sure about: the package's own README/types in `node_modules` and its official docs
  (Express, Mongoose, Better Auth, zod, pino). Express 5 is checked against `node_modules/express/History.md`; Mongoose and
  Better Auth ship no docs, so use their types (`.d.ts`) and official docs. Do not rely on memory of Express 4 / Mongoose 5-7 / zod 3 era tutorials.
- Express 5: handlers may be `async`; a rejected promise is forwarded to `next(err)` by the router (checked in `router` README), so
  do not wrap handlers in try/catch just to call `next`. Use `{*name}` wildcards, `res.status(int)` only, no `req.param()`,
  no `res.redirect("back")`. End every request with the final JSON error handler (`errorHandler`).
- Mongoose 9: promises/async-await only (no callbacks); `lean()` for read-only queries; set explicit `strict` schemas, indexes
  and `timestamps` in the schema, not in code paths; validate ObjectIds before querying (bad id must be 400/404, not 500);
  never build a filter from raw `req.body`/`req.query` (use the parsed zod output, see F-04/F-05).
- Validation: use the zod-**parsed** output (stripped, typed), not raw `req.body`. Put max lengths and array caps on every field.
- TypeScript strict; no `any`, no `@ts-ignore` without a reason. Prefer `unknown` + narrowing for caught errors. Biome must pass.
- Node: runtime target is the repo's `engines` (Node >= 24 LTS line); do not use APIs removed from it, and keep the Dockerfile
  base image on that same supported LTS (F-14).
- Security first: follow `brain/security/` (see below) for auth, ownership, logging, CORS, env and Docker. No `console.log`;
  use pino. Never trust the client for ids, ownership or timestamps.
- Dependencies: pnpm only, committed lockfile, `--frozen-lockfile` in CI/Docker. Run `pnpm audit --prod` when touching deps; prefer
  patched versions (e.g. `express-rate-limit` >= 8.0.2, F-06). Add a dependency only when the stdlib or an installed package cannot do it.
- After changing code: `pnpm --filter api exec tsc --noEmit`, `pnpm --filter api check` and `pnpm --filter api test`.

## Conventions

- Env: add the var to the zod schema in `envConfig.ts`, import `env` from `@/common/utils/envConfig`, add it to
  `.env.template` and to `turbo.json` `tasks.build.env`. Never read `process.env` elsewhere. The app refuses to boot on bad env.
- Validation: a zod schema shaped `{ body, query, params }` passed to `validateRequest`.
- Logging: use `logger` from `@/server` (pino), not `console.log`. Never log tokens, secrets or full user objects.
- Auth: `requireAuth` sets `req.user` (type via global augmentation in `requireAuth.ts`). Always scope DB queries by access
  (workspace membership / collaborator, see `formService.accessFilter`) so users only touch their own data.
- `sanitizeFilter` is on globally: a `$`-operator inside a filter VALUE (e.g. `$in`, `$elemMatch`) must be wrapped in
  `mongoose.trusted()`, otherwise Mongoose turns it into `$eq` and the query silently matches nothing.
- Edit documents with `find` + `set` + `save()` (not `findOneAndUpdate`) so schema validators, the `revision` bump and
  optimistic concurrency run.
- Express 5 typing: `req.params.x` is `string | string[]`; cast `as string`.
- Express 5 wildcard routes use `{*name}` syntax (see `/api/auth/{*authPath}`).
- The Better Auth handler must be mounted **before** `express.json()`. Keep that order in `server.ts`.
- Rate limit + `trust proxy` come from `TRUST_PROXY` (a proxy count, never `true`).
- CORS origins and Better Auth trusted origins both come from `CORS_ORIGINS` (comma-separated).

## Env vars (see `.env.template`)

`NODE_ENV PORT HOST TRUST_PROXY CORS_ORIGINS WEB_URL RESEND_API_KEY EMAIL_FROM COMMON_RATE_LIMIT_WINDOW_MS COMMON_RATE_LIMIT_MAX_REQUESTS DATABASE_URL
BETTER_AUTH_SECRET BETTER_AUTH_URL GOOGLE_ID GOOGLE_SECRET GOOGLE_REDIRECT_URI GITHUB_ID GITHUB_SECRET GITHUB_REDIRECT_URI`.
Callback URLs must match what is registered in the Google/GitHub consoles.

## Data model

Reference design: Formlect Mongoose models (workspace-centric). Enums live in `db/schema/constants.ts` and are imported by both
the Mongoose schemas and the zod models, so they cannot drift.

```text
db/schema/
  constants.ts      FIELD_TYPES (18), appearance groups, layouts, presets, statuses, roles, logic ops/actions, page sections
  plugins/          toJSONPlugin (id, no _id/__v, hides paths), softDeletePlugin (deletedAt, excluded from queries)
  user/User.ts      READ-ONLY mirror of Better Auth's `user` collection. Better Auth owns users/sessions/accounts. Do not add fields or writes.
  workspace/        Workspace (tenant: members + roles, invites, brand, limits), workspaceHelpers
  form/             Form (working draft) + FieldSchema, LogicSchema, DesignSchema, LandingPageSchema, SettingsSchema,
                    CollaboratorSchema, FormVersion (immutable snapshots), formHelpers (roleOf, isAcceptingResponses)
  response/         Response (typed answers pinned to a formVersion) + AnswerSchema
  file-asset/       FileAsset (upload lifecycle; no upload endpoint yet)
  comment/          Comment (pinned threads) + ReplySchema
  index.ts          barrel + global mongoose settings
```

- Every form belongs to a `Workspace`; each user gets one personal workspace on first use. Fields, rules, options and sections
  use a stable client `key`, not `_id`. Respondents answer against a `FormVersion` snapshot (created on publish).
- Deviations from the reference: `Field.name` (the builder's data key) was added; `Form.slug`/`Workspace.slug` unique indexes do
  not exclude soft-deleted docs (their slug stays reserved); hooks do not use `next()` (Mongoose 9 style); `stats.responses` and
  `Response.number` are updated atomically by `formResponseService`, not by a post-save hook; schema methods became typed helpers.
- Not exposed through the API yet: logic, design (beyond `showProgress`), landing page, webhooks/notifications/captcha, collaborators,
  comments, versions list/restore, file uploads. The models exist; add endpoints with their own review.
- JSON responses use `id` (not `_id`).
- Zod models in `api/*/**Model.ts` and Mongoose schemas in `db/schema/` are maintained separately (only enums are shared). Keep caps in sync.

## Known quirks and debt (be aware; don't change silently)

- The Google Sheets integration was removed on purpose. Don't reintroduce it unprompted.
- `GET /u/users` lists all users with no auth (security hole; pending decision).
- `by-slug` and response-create both still require login, so anonymous respondents can't view/submit yet. Confirm intent
  before changing. The schema's `settings.requireLogin` is not enforced for that reason.
- Email+password is on with `requireEmailVerification`; mail goes through Resend (`common/utils/mailer.ts`). Without
  `RESEND_API_KEY` (allowed outside production) the verification link is logged instead of sent. Better Auth answers
  duplicate sign-ups generically (no account enumeration); `onExistingUserSignUp` emails the existing owner.
- Tests live in `common/__tests__`, `api-docs/__tests__`, `healthCheck/__tests__`, `db/schema/__tests__` and
  `api/formResponse/__tests__` (the last two need no env or DB). The others import `server`, which validates env
  (reads `.env`), so CI must provide env vars.

## Security docs (read before touching auth, data access, logging, config or deployment)

@../../../brain/security/threat-model.md
@../../../brain/security/attack-surface.md
@../../../brain/security/secrets.md
