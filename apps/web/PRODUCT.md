# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: **form creators**: researchers, NGOs, teachers and product teams who build forms, publish them by link, and study the structured answers. They are not enterprise IT; they want something quick and trustworthy.
Secondary: **respondents**, the people filling those forms (currently must sign in; public access is pending). Tertiary: developers who self-host or integrate through the API.

## Product Purpose
Formlect is an open-source form builder. Users create forms, publish them anywhere, collect structured responses and understand the data. Success: a creator goes from blank to a published form in minutes, respondents finish it without friction, and the answers arrive as clean, typed data.

## Positioning
Confirmed by the owner (all four):
- Open source: self-host it or use Formlect Cloud.
- Forms people actually enjoy filling out (respondent-first design).
- Structured data with AI-assisted insight into responses.
- A central integrations hub (Sheets, Notion, Slack, webhooks).

Status caveat: AI insight and the integrations hub are **roadmap, not built** (Google Sheets was removed on purpose). Do not present them in UI as shipped.

## Operating Context
Three surfaces: the workspace app for creators (builder, dashboard, responses, analytics), the public form for respondents, and the self-host admin for developers. The builder shows the real form live; every action has a shortcut and a ⌘K entry. Today only sign-in and a placeholder dashboard exist in `apps/web`; the backend (`apps/api`) supports forms CRUD, publish and response submission.

## Capabilities and Constraints
- Field types (API enum): shortAnswer, longAnswer, multipleChoice, dropdown, checkbox, multiSelect, switch. The design plans more (18 fields in 6 families); confirm before assuming.
- Stack: Next.js 16 App Router, Tailwind v4, shadcn/ui on base-ui; auth via Better Auth cookies against `apps/api`; responses use the `{ success, message, responseObject, statusCode }` envelope.
- Must work in light and dark. WCAG 2.2 AA is required. Multilingual and RTL content is possible, so layouts must not assume LTR English.
- Security constraints that touch UI are in `brain/security/` (e.g. never inject user-authored HTML/colours unvalidated; file-upload checks must be re-validated server-side).
- Undecided: the public respondent flow (login requirement), the five form tabs' final names, dark values the design file does not define.

## Brand Commitments
The current look is confirmed and binding: flat deep violet `#4b2bd1` on warm linen, plum-black text, peach `#ffb38f` as a highlight for good news and new data (never text on white), Sora headings, Manrope body, JetBrains Mono for keys, Lucide icons. Tone: trustworthy, warm, made by people, not neon SaaS. Tokens live in `apps/web/src/app/globals.css`; the written summary is `brain/design/design-context.md`; the source design files are in `Formlect design planning`.

## Evidence on Hand
- Design files: Components, Layouts and Fields, Plan, Color Directions, Sign In (+ variations), Dashboard variants, File Upload variations.
- Built UI: sign-in/sign-up screen, brand panel, placeholder dashboard, shadcn component set, Formlect field components (ChoiceCard, Rating, ScaleButtons, FileDropzone, FieldBlock).
- Absent, do not fabricate: customer logos, testimonials, usage numbers, pricing, case studies, a licence statement beyond "open source", real form templates.

## Product Principles
1. The respondent's experience decides the product: large targets, clear progress, instant validation, autosaved drafts.
2. The builder shows the real form, live; no separate preview mode.
3. Keyboard first: every action has a shortcut and a ⌘K entry, with keycap hints beside buttons.
4. Structured by default: every field has a type, key and validation so data exports cleanly.
5. Say only what is true: roadmap features are labelled as such; no claims the product cannot back.

## Accessibility & Inclusion
WCAG 2.2 AA minimum. Full keyboard operation, visible focus rings, `prefers-reduced-motion` respected, sufficient contrast in both themes, and layouts that tolerate RTL and long translated strings.
