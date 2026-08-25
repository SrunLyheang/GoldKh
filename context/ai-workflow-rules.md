# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven workflow.
The context files define what to build, how to build it, and the
current state of progress. Always implement against these specs
rather than inferring behavior from scratch.

The default mode is generated solutions, not explanation-only.
Implement the current unit directly against the specs, then hand
it back for review — describe what was built and why, rather than
describing what to build and waiting for it to be written by hand.

## Scoping Rules

- Work on one feature unit at a time.
- Prefer small, verifiable increments over large speculative
  changes.
- Do not combine unrelated system boundaries in a single
  implementation step.
- Follow the order in `progress-tracker.md` under "Next Up".
  That order exists because each step is far easier to debug once
  the one before it is known to work — proving a single price
  provider works before adding rotation, for example.

## When to Split Work

Split an implementation step if it combines:

- UI changes and price layer changes.
- Schema changes and the queries that use them.
- More than one route handler.
- A new provider and a change to the rotation logic.
- Any behavior not clearly defined in the context files.

If a change cannot be verified end to end quickly, the scope is
too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context
  files.
- If a requirement is ambiguous, resolve it in the relevant
  context file before implementing.
- If a requirement is missing, add it as an open question in
  `progress-tracker.md` before continuing.

## Protected Files

Do not modify the following unless explicitly instructed:

- `components/ui/*` — generated shadcn/ui components.
- Any migration that has already been applied. Correct a mistake
  with a new migration rather than editing an old one.
- Any third-party library internals.

## Keeping Docs in Sync

Update the relevant context file whenever implementation
changes:

- System architecture or boundaries → `architecture.md`
- Storage model decisions → `architecture.md`
- Code conventions or standards → `code-standards.md`
- Feature scope → `project-overview.md`
- Visual tokens and layout patterns → `ui-context.md`
- Anything resolved from the open questions list →
  `progress-tracker.md`, moved into Architecture Decisions with
  the reasoning attached

Record *why* a decision was made, not only what was decided. A
decision without its reasoning gets reversed by accident three
weeks later.

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope.
2. No invariant defined in `architecture.md` was violated —
   particularly the session-scoped user ID rule and the ban on
   floating point for money.
3. `progress-tracker.md` reflects the completed work.
4. `npm run build` passes.
