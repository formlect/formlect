# Formlect — Design Context

Read this before any UI work in `apps/web`. It is a hand-written summary of the design files in `Formlect design planning` (Components, Layouts and Fields, Plan, Color Directions, Sign In). Where this file and the code disagree, the tokens in `apps/web/src/app/globals.css` win for values and the design files win for intent. Companion: [apps/web/.claude/CLAUDE.md](../../apps/web/.claude/CLAUDE.md) (component conventions).

## Product

Formlect is an open-source form builder: people create forms, publish them anywhere, collect structured responses and study the answers. Three surfaces:

1. **Workspace app**: creators build forms (builder, dashboard, responses, analytics).
2. **Public form**: respondents fill them in. This is the most important screen to get right.
3. **Self-host admin**: developers running their own instance.

Users: researchers, NGOs, teachers, product teams. Not enterprise IT.

## Principles

- **Quick and kind to fill out.** Large targets, clear progress, instant validation, autosaved drafts.
- **The builder shows the real form, live.** No separate preview mode needed to trust what you built.
- **Keyboard first.** Every action has a shortcut and appears in ⌘K; keycap hints (`Kbd`) sit next to buttons so shortcuts are learned by use. Single-letter keys work only when no input is focused.
- **Structured by default.** Each field has a type, key and validation so responses export cleanly (CSV, JSON, API, webhooks).

## Brand and tone

Trustworthy, warm, made by people, **not another neon SaaS**. The look is deep flat violet on warm linen with plum-black text. Copy is plain and friendly ("We'll check if you have an account, and help create one if you don't."). No exclamation marks, no jargon, no marketing superlatives in product UI.

## Colour (tokens in `globals.css`; never hardcode hex)

| Role | Token | Light | Dark |
|---|---|---|---|
| Page | `background` | `#faf8f6` warm linen | `#16131c` plum-black |
| Surface | `card` / `popover` | `#ffffff` | `#1f1b25` |
| Text | `foreground` | `#1b1724` | `#efecf0` |
| Primary (actions, focus, selection, progress) | `primary` (+ `primary-hover`) | `#4b2bd1` / `#4024bd` | `#7b62f0` |
| Soft primary (soft button, selected tint) | `accent` / `tint` / `tint-soft` | `#ece7fb` / `#f4f1fc` / `#f8f6fd` | derived |
| Highlight (good news, new data) | `highlight` + `highlight-soft` | `#ffb38f` | same |
| Success | `success` + `success-soft` | `#2f9e62` | `#4cc283` |
| Danger | `destructive` + `destructive-soft/border` | `#c8401a` | `#ea7a4f` |
| Hairlines | `border`, `input`, `border-strong`, `control` | `#e6e1dc`, `#ddd8d3`, `#d6d0ca`, `#cfc8c2` | derived |
| Muted text | `muted-foreground`, `ink-2`, `ink-3` | `#77727d`, `#57525e`, `#8a8590` | |

Rules:
- Violet is for primary actions, focus, selection and progress. Nothing else.
- **Peach marks good news and new data** (new response, +18%, success moments). **Never peach text on white.**
- **Flat fills only. No gradients, no glows** (the one exception is the skeleton shimmer). Depth comes from the 2px inset edge on primary buttons and from `shadow-pop` / `shadow-modal` on overlays.
- Neutrals are warm, never cool grey.
- Dark values marked "derived" in `globals.css` are not in the design file; confirm them with the designer before relying on them.

## Typography

- **Sora 600** for headings and big numbers (tracking about -0.02 to -0.03em). Class `font-heading`.
- **Geist** for everything else: 500 body, 700 labels and buttons, 800 for small caps-like labels and badges. Class `font-sans`.
- **JetBrains Mono** for keys, field names, keycaps, code (`font-mono`).
- Tabular numbers (`tabular-nums`) in tables, stats and counters.
- Body 14 to 15px, labels 13.5px, helper text 12.5px. Page title about 28px.

## Shape, spacing, motion

- Radius: sm 6, md 8, lg 10 (controls), xl 14, cards 16, dialogs 18. Controls are 40px tall (sm 32, lg 48).
- Focus: 3px `ring-ring/20` plus primary border. Never remove focus rings.
- Motion 120 to 240ms, one spring for drags, press scale 0.98 (primary/destructive press down 1px instead). Honour `prefers-reduced-motion`. Motion confirms an action or shows where something went; it is never decoration.
- Icons: Lucide, 1.75px stroke, 16px in UI, 20px in navigation.

## Components

Use `components/ui/*` (shadcn on base-ui, already skinned) and `components/formlect/*` (ChoiceCard, Rating, ScaleButtons, FileDropzone, FieldBlock). Do not hand-roll buttons, inputs, labels, alerts, dividers or cards; if something is missing, `pnpm dlx shadcn@latest add <name>` and restyle to the tokens, then prune unrelated files the CLI adds.

Field types mirror the API enum: shortAnswer, longAnswer, multipleChoice, dropdown, checkbox, multiSelect, switch.

## Screens (build order from the plan)

Builder, respondent form, dashboard, responses, analytics, then the rest. Inside a form, five tabs cover the lifecycle (Build, Logic, Design, Share, Results; confirm names in the Plan file). Currently built: sign-in and a placeholder dashboard.

## Do and don't

| Do | Don't |
|---|---|
| Show the form as respondents will see it | Add a separate "preview" mode |
| Put the shortcut hint next to the action | Hide power features without a ⌘K entry |
| Validate instantly, say what to fix in plain words | Show raw API errors or codes |
| Use `Alert` for inline messages, `sonner` toast for confirmations | Use browser `alert()` or custom banners |
| Keep hit targets at least 40px on respondent screens | Pack dense controls into the public form |
| Reuse tokens (`bg-tint`, `border-control`) | Introduce new hex values or one-off colours |
| Respect light and dark | Design only for light |

## Security touchpoints for UI work

See [../security/security-checklist.md](../security/security-checklist.md). UI-relevant: no `dangerouslySetInnerHTML` for form content; user-authored colours and fonts must be validated before use (F-04); FileDropzone's checks are client-side only (server must re-validate); sign-in must not create side effects on failed logins (F-08).
