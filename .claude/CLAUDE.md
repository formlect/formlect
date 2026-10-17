# Formlect monorepo

Form-builder product (think Google Forms/Typeform): users build forms, publish them, and collect responses.
pnpm + Turborepo workspace. Node >= 24, `pnpm@11`.

## Layout

| Path | What | Notes |
|------|------|-------|
| `apps/api` | Express 5 + Mongoose + Better Auth backend | Real, active. See `apps/api/.claude/CLAUDE.md` |
| `apps/web` | Next.js 16 (App Router) + Tailwind v4 + shadcn/ui frontend | Fresh scaffold. See `apps/web/.claude/CLAUDE.md` |
| `packages/ui` | Dummy React lib (CounterButton, Link) | Turbo starter leftover, unused |
| `packages/logger` | `console.log` wrapper | Starter leftover, unused (api uses pino) |
| `packages/config-eslint`, `config-typescript`, `jest-presets` | Shared configs | Starter leftovers. **Neither app uses them** (api uses biome + its own tsconfig; web has its own eslint/tsconfig) |

The root README is the stock `create-turbo` kitchen-sink text and is stale: `storefront`, `admin`, `blog` apps no longer exist.

## Commands

Run from the repo root unless noted.

```sh
pnpm install
pnpm dev                          # turbo run dev (all apps)
pnpm --filter api dev             # API only, http://localhost:8080
pnpm --filter web dev             # web only, http://localhost:3000
pnpm --filter api test            # vitest
pnpm --filter api check           # biome check --write
pnpm --filter api exec tsc --noEmit
pnpm --filter web exec tsc --noEmit
```

Turbo tasks (`turbo.json`): `build`, `dev`, `lint`, `test`, `check-types`. Env vars read by a task must be listed in that
app's `turbo.json` `env` array (eslint rule `turbo/no-undeclared-env-vars`). Update it whenever you add an env var.

## Cross-app contract

- Web talks to the API over HTTP: `http://localhost:8080` in dev. Auth is cookie-based (Better Auth), so web requests need
  `credentials: "include"` and the web origin must be in the API's `CORS_ORIGINS`.
- Every API response is the `ServiceResponse` envelope: `{ success, message, responseObject, statusCode }`.
  Type frontend fetchers against that shape.
- Auth endpoints live under `/api/auth/*` (Better Auth); app endpoints under `/api/v1/*`.

## Working rules

- Keep changes minimal and local; match the surrounding style (see per-app files for specifics).
- Never commit `.env` files. Secrets live in `apps/api/.env`; the template is `apps/api/.env.template`.
- Do not add new top-level packages or abstractions without need; do not wire the starter-leftover packages in unless asked.
- After changing code, run the app's typecheck (and tests for api) before reporting done.
- Do not hardcode URLs, origins or callback URLs. They are env vars.
- Always use the current stable way of doing things (installed framework versions, their bundled docs) and established best
  practices. Do not use deprecated or removed APIs, and do not fall back to older patterns. See `apps/web/.claude/CLAUDE.md`
  for the frontend rules.

## Decisions

Design/architecture decisions live in `brain/decisions/` (one short file each, index in its README). Check it before
revisiting a settled choice; add a file when you make a new one.

## Security docs (read before touching auth, data access, logging, config or deployment)

@../brain/security/security-checklist.md

Rule: before writing or changing code that touches auth, data access/ownership, validation, logging, CORS, env/config or
Docker, check the checklist above and the finding IDs (`F-xx`) in `brain/security/threat-model.md`. Do not reintroduce a
listed weakness; when you fix one, update its status in `brain/security/` in the same change.
