# Decisions

One file per decision, named `NNNN-short-title.md`. Read the index, open only the one you need.
New decision: copy the template below, take the next number, add a row here. Never rewrite an old decision; write a new
one that supersedes it and mark the old row `Superseded by NNNN`.

| # | Decision | Status |
|---|----------|--------|
| [0001](0001-form-slug-and-alias.md) | Form links: server-generated `slug` + optional user `alias`; slug race handled by retry | Accepted |

## Template

```md
# NNNN — Title

Date: YYYY-MM-DD · Status: Accepted | Superseded by NNNN

## Context
Why this came up (2-4 lines).

## Decision
What we do (short list).

## Why
Reasons, and what we rejected.

## Consequences
What gets easier, what to watch.
```
