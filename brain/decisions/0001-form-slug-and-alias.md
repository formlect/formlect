# 0001 — Form slug and alias

Date: 2026-10-17 · Status: Accepted

## Context
Form links used one `slug` field that was sometimes server-generated and sometimes user-chosen (`slugType`).
Creation checked "is this slug free?" and inserted afterwards, so two concurrent requests could pick the same slug.

## Decision
- `slug`: always server-generated (nanoid, 8 chars, mixed case), never accepted from the client, never edited.
- `alias`: optional vanity link the owner chooses (3-40 chars, lowercase letters/digits/dashes, reserved words blocked).
- `slugType` is removed.
- Both have a partial unique index; soft-deleted forms keep them reserved.
- `FormService.createForm` generates the slug itself and retries (max 3) when the insert hits the unique index on `slug`.
  A duplicate on `alias` returns 409 "That alias is already taken".
- `GET /forms/by-slug/:value` looks up `slug` first, then `alias`.

## Why
- The unique index is the only real guard against the race; the availability check is just a cheap first filter. Retrying on
  the index error makes the race harmless instead of surfacing a misleading 409 for a slug the user never chose.
- Two fields keep the contract simple: `slug` is stable and unguessable, `alias` is human and can collide, so the owner
  gets a clear error only for the thing they typed.
- Slug wins over alias on lookup, so an alias can never shadow another form's real link.
- Rejected: one field with a `slugType` flag (the two kinds have different rules and error handling).

## Consequences
- Clients send `alias`, never `slug`, on create.
- Changing an alias after creation is not built yet (needs its own endpoint and a redirect decision).
- The availability check is case-insensitive but the index is case-sensitive, so it scans the collection. Fine at
  current volume.
