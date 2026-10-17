# apps/web — Next.js frontend

Next.js 16 (App Router, React 19), TypeScript, Tailwind CSS v4 (CSS-first, no `tailwind.config`), shadcn/ui
(style `base-nova`, config in `components.json`). Standalone: not wired into the turbo configs or `@repo/*` packages yet.
Path alias `@/*` → `src/*`. Package manager: pnpm (workspace).

## Commands (run in apps/web)

```sh
pnpm dev                 # http://localhost:3000
pnpm build / pnpm start
pnpm lint                # eslint (eslint-config-next)
pnpm exec tsc --noEmit
pnpm dlx shadcn@latest add <component>   # adds to src/components/ui
```
Status: `/sign-in` and `/sign-up` (separate pages, designed in Formlect design planning/Sign In.dc.html) and `/dashboard` exist.
`/` redirects to `/sign-in`. Dashboard = Dashboard v1 sidebar + Dashboard v2 main area (`components/dashboard/*`, state in
`dashboard-shell.tsx`, API calls in `lib/forms.ts` via `lib/api.ts`). Server-backed: list, create, publish/unpublish.
`/builder/[id]` is the form builder (design: Form Builder.dc.html; `components/builder/*`: `use-builder.ts` state + actions, `logic.ts`
rule engine, `model.ts` field catalogue/themes, `persist.ts` API mapping). Dashboard cards and "New form" open it. Saved to the API:
title, description, "allow multiple submissions"/progress bar and the 14 field types that map to the API enum (short, long, email, phone,
url, number, single, multiple, select, range, rating, date, time, file; label, help, placeholder, required, options, data key, choice
look, rating style/max, range/number min-max and labels). Session-only for now: date-time/image/audio/video fields, unit and
media options, Logic rules, Design (theme, font, layout, cover, button). Not built: Share/Results tabs (disabled), collaborator presence/invite,
"Turn this into a page", public respondent route `/to/[slug]` (the Publish dialog link points there).
Not built (no API yet): folders, usage meter, AI drafting, templates/import, activity log (derived from form timestamps),
completion rate and 7-day response trend. Sidebar items without a route render disabled.

## Structure

```
src/app/            routes (layout.tsx, page.tsx, globals.css = Tailwind + shadcn theme tokens)
src/components/ui/  shadcn components (generated; edit sparingly)
src/lib/utils.ts    `cn()` class merger
components.json     shadcn config (aliases for components, ui, lib, utils)
```

## Conventions

- One component per file (kebab-case filename = component name). No second component in the same file, not even a small private
  one; give it its own file. Shared constants/helpers go in a plain `.ts` next to it. Exception: `components/ui/*` (shadcn compound parts).
- **Stable, current APIs only.** Build with the installed Next 16 / React 19 / Tailwind v4 / TypeScript strict. Never use deprecated,
  removed or legacy patterns, and never "downgrade" to an older style because it is more familiar. Before using any Next, React
  or library API you are not sure is current, read `node_modules/next/dist/docs` (or the library's current docs). Do not use
  experimental or canary-only features unless asked. Do not add or pin older versions of dependencies.
- Next 16 rules of thumb (verify in the bundled docs): App Router only (no `pages/`, no `getServerSideProps`); `params`,
  `searchParams`, `cookies()`, `headers()` are async; request interception lives in `proxy.ts` (not `middleware.ts`); Turbopack is
  the default bundler; run eslint directly (`pnpm lint`), not `next lint`; use `next/image`, `next/font`, `next/link`, the
  Metadata API (`metadata` / `generateMetadata`), `loading.tsx`, `error.tsx`, `not-found.tsx`, route handlers (`route.ts`) and
  Server Actions for mutations where they fit.
  The first four were checked against `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` (installed 16.3.8).
  `reactCompiler: true` is stable but opt-in (slower builds); do not enable it unless asked.
- React 19 rules of thumb (React is not covered by the Next docs; check react.dev for anything not listed): pass `ref` as a prop
  instead of `forwardRef`, no `React.FC`, no `defaultProps`, prefer `use(Context)` for new code; use `useActionState` / `useOptimistic` / `useTransition` for async UI; derive state during render instead of
  `useEffect` + `setState`; effects only for syncing with external systems; keys must be stable ids, not array indexes.
- Client state management: **zustand** (v5, current stable). Stores live in `src/stores/<name>-store.ts`, one store per feature, all
  state and actions for that feature in that one file (`create<State>()((set, get) => ...)`). Do not use React Context
  (`createContext`/`useContext`/providers) for app state. Components select narrowly, one field per call
  (`useStore((s) => s.forms)`); never return a new object/array from a selector (use `useShallow` if several fields are needed
  at once). Read state inside event handlers/effects with `useStore.getState()` instead of subscribing. Keep navigation and
  other UI side effects in components; async actions return their result. Do not hold server-fetched data in a store for a
  Server Component to read. Group related state and actions together and keep unrelated
  concerns in separate stores: server-backed domain data (the forms list and its actions) is separate from screen UI state (open
  dialogs, filters). Current stores: `forms-store.ts` (forms, load status, load/create/publish) and `dashboard-store.ts`
  (dashboard filter query, command palette and new-form dialog open flags).
- Fetch data in Server Components where possible; keep `"use client"` boundaries small and push them to the leaves. Validate any
  external input (API responses, form data, search params) with a schema before trusting it. Handle loading, empty and error states.
- Accessibility is required: semantic elements, labels for every control, visible focus, keyboard support, `aria-*` only when
  native semantics are not enough. Respect `prefers-reduced-motion`.
- No `any`, no `@ts-ignore` / `@ts-expect-error` without a comment explaining why, no disabling eslint rules to silence real
  problems. No `dangerouslySetInnerHTML` for user content.
- Server Components by default; add `"use client"` only for state, effects or event handlers.
- Style with Tailwind utilities and the shadcn CSS variables (`bg-background`, `text-foreground`, `bg-primary`, ...) so
  light/dark theming works. Compose classes with `cn()`.
- New UI primitives: install via the shadcn CLI rather than hand-writing them.
- Next 16 provides typed route props helpers (`LayoutProps<"/">`, `PageProps<"/path">`); run `next typegen` if types are missing.
- Dynamic `params` / `searchParams` are async in Next 15+. `await` them.
- When unsure about a Next API, check `node_modules/next/dist/docs`; it differs from older versions.

## Talking to the API (`apps/api`, http://localhost:8080)

- Put the base URL in an env var (`NEXT_PUBLIC_API_URL` for browser calls); never hardcode it.
- Auth client: `src/lib/auth-client.ts` (`authClient`, base URL from `NEXT_PUBLIC_API_URL`, see `.env.example`).
  Sign-in flow in `components/auth/sign-in-form.tsx`: `SignInForm mode="signin"|"signup"` rendered by separate `/sign-in` and `/sign-up` pages (no fallback, F-08); `/reset-password` resets a password;
  EMAIL_NOT_VERIFIED / sign-up success show the "check your inbox" step. Redirect URLs passed to the API must be absolute
  and their origin must be in the API `CORS_ORIGINS`.
- Layout: form column scrolls with the page; the purple brand panel is `hidden lg:block sticky` (large screens only).
- Auth is Better Auth cookies. Use the `better-auth/react` client (`createAuthClient({ baseURL })`) for sign-in
  (email/password, Google, GitHub), and `fetch(..., { credentials: "include" })` for `/api/v1/*`.
- The API's `CORS_ORIGINS` must include this app's origin. `http://localhost:3000` is included in dev.
- Responses use `{ success, message, responseObject, statusCode }`; unwrap `responseObject`.
- Endpoints: `GET/POST /api/v1/forms` (`/create` for POST), `GET /api/v1/forms/:id`, `GET /api/v1/forms/by-slug/:slug`,
  `PATCH /api/v1/forms/:id/{basic-information,fields,publish}`, `POST /api/v1/form-response/create`, `POST /api/v1/onboarding/complete`.
  Onboarding: `DashboardShell` shows `components/onboarding/onboarding-flow.tsx` (full-screen, design: Onboarding.dc.html; slug, team type/size, use cases, AI draft, invites and the setup-progress finish screen are not built, no API) while `session.user.isOnboarded` is false (step 1 name +
  avatar URL via `authClient.updateUser`, step 2 workspace name via `lib/onboarding.ts`). `isOnboarded` is typed with `inferAdditionalFields`. See
  `apps/api/.claude/CLAUDE.md` and the API's Swagger UI for the authoritative list.
- Form field types (API enum, `apps/api/src/db/schema/constants.ts`): short_text, long_text, email, phone, url, number, single_choice,
  multiple_choice, dropdown, yes_no, rating, opinion_scale, nps, range, date, time, file_upload, statement. API JSON uses `id`
  (not `_id`) and `status` + `stats.responses`; `lib/forms.ts` maps that to the dashboard's `FormSummary` (`isPublished`, `submissionCount`).

## Security docs (read before touching auth, data access, logging, config or deployment)

@../../../brain/security/secrets.md

## Design system (source: Formlect Components.dc.html, Theme + Actions...Formlect fields)

- Tokens live in `src/app/globals.css` (`:root` and `.dark`). Use shadcn names (`bg-primary`, `text-muted-foreground`,
  `border-input`, `bg-accent`...) plus Formlect extras: `highlight` (peach), `success`, `*-soft`, `*-hover`, `neutral-soft`,
  `shadow-pop`, `shadow-modal`. Never hardcode hex in components. `brand/ink/line/canvas/coral` are legacy aliases (sign-in only).
- Dark values marked "derived" in globals.css are not in the design file; confirm them against the design.
- Rules: flat fills (no gradients/glows), radius sm 6 / md 8 / lg 10 / xl 14, focus = `ring-3 ring-ring/20` + primary border,
  motion 120-200ms, press `active:scale-[0.98]` (default/destructive use `active:translate-y-px` + inset edge).
- `components/ui/*` are shadcn (base-ui) restyled to the design: Button sizes sm h-8 / default h-10 / lg h-12 and a `soft`
  variant; Badge variants `success draft soft highlight secondary`; Tabs default to the underline style; ToggleGroup is
  the segmented control. Add more with `pnpm dlx shadcn@latest add <name>` then restyle to match, and prune unused extras.
- `components/formlect/*`: ChoiceCard, Rating, ScaleButtons, FileDropzone (UI only; no upload API exists, the server must
  re-validate type/size/count when one is added) and FieldBlock + SortableFieldList (dnd-kit; `FieldType` mirrors the API
  enum). Also added from shadcn: sidebar, command, field (this registry has no `form`; use `field`).
- Colour rule: only tokens in globals.css. Dark values for tint/tint-soft/primary-300/400/control/border-strong/skeleton/
  row-line/success-soft/highlight-soft/destructive-soft are derived (the design file has no dark spec for them).
- `TooltipProvider` and `Toaster` are mounted in `app/layout.tsx`.

## Design context (read before any UI work)

@../../../brain/design/design-context.md

UI design work: use the `/impeccable` skill (installed in `.claude/skills/impeccable`, hooks deliberately not installed).
`/impeccable init` writes PRODUCT.md and DESIGN.md; keep them consistent with `brain/design/design-context.md` and the
tokens in `globals.css`. Its launcher downloads a native binary on first run (checksum-verified from GitHub releases).
