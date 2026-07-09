# Implementation Plan: Accounts and Cloud Backend

**Branch**: `006-accounts-and-cloud-backend` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-accounts-and-cloud-backend/spec.md`

## Summary

Replace the local-only SQLite persistence layer with Supabase (Postgres +
Auth + Row Level Security), gate the app behind email/password sign-in, and
migrate the existing exercise seed data plus any pre-existing local user data
into the cloud — while continuing to run unmodified inside standard Expo Go
(no EAS custom dev client, no paid Apple Developer account). This satisfies
"parallel users" through Postgres + RLS directly; no bespoke backend server is
introduced.

## Technical Context

**Language/Version**: TypeScript (unchanged)

**Primary Dependencies (new)**: `@supabase/supabase-js`,
`@react-native-async-storage/async-storage` (session persistence — ships
inside Expo Go, no native config required)

**Dependencies retired once migration completes**: `expo-sqlite`,
`drizzle-orm` (SQLite dialect) — the SQLite schema, repositories, and
migration/`ensure*` self-healing functions are deleted once every screen is
ported.

**Storage**: Supabase Postgres, accessed via `supabase-js` using the signed-in
user's session; Row Level Security enforced server-side. No local database.

**Testing**: Jest unit tests for pure logic unchanged. Integration tests that
today spin up an in-memory SQLite instance instead run against a real
Postgres instance (Supabase local CLI / Docker) seeded per test; a dedicated
RLS test suite proves cross-account isolation using two distinct auth
contexts against the same tables.

**Target Platform**: Expo Go (iOS/Android/web), unmodified — a hard
constraint, not a preference.

**Project Type**: mobile-app + managed cloud backend (Supabase project; no
custom server)

**Performance Goals**: Sign-in and dashboard load complete within a couple of
seconds on a typical mobile connection; set-logging writes feel instant via
optimistic local UI state reconciled against the Supabase response.

**Constraints**: No paid Apple Developer account, no EAS custom dev client, no
offline requirement beyond a clear error state (explicit user decision),
exercise images stay bundled local assets for now.

**Scale/Scope**: Personal-scale multi-user. Standard Postgres + RLS handles
"parallel users" trivially at this scale — no custom concurrency engineering
needed.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*
*Checked against constitution v2.0.0, amended alongside this plan.*

- Beginner-first: Unaffected — sign-in/sign-up screens use the same plain,
  low-friction copy standard as the rest of the app; email/password is the
  simplest sign-in a beginner already knows.
- Cloud-backed, per-user data ownership: Satisfied by design — every
  user-owned table gets an RLS policy (`auth.uid() = user_id`); FR-009
  requires an explicit "can't reach the server" state everywhere full offline
  isn't supported.
- Approved stack: Satisfied — Expo, React Native, TypeScript stay; Supabase
  is the newly-approved persistence/identity layer (constitution v2.0.0); the
  only new dependency beyond `supabase-js` itself is AsyncStorage, which is
  Expo-Go-safe. No custom backend server is introduced.
- Simplicity: No bespoke sync engine, no OAuth providers, no custom server —
  smallest shape that satisfies "accounts + parallel users."
- Testable increment: Each user story (auth, cloud-backed data, import,
  account basics) has an Independent Test in the spec and maps to its own
  task phase below.

## Project Structure

### Documentation (this feature)

```text
specs/006-accounts-and-cloud-backend/
|-- spec.md              # Feature spec
`-- plan.md               # This file
```

(No `research.md`/`data-model.md`/`contracts/` split for this phase — the
design decisions below cover that ground at a size appropriate to the
feature; add them if `/speckit-tasks` work later reveals real ambiguity.)

### Source Code (repository root)

```text
supabase/
|-- migrations/            # raw SQL: tables, RLS policies, profiles-on-signup trigger
`-- seed.sql               # exercises/muscle_groups reference data seed

src/
|-- lib/
|   `-- supabase.ts        # supabase-js client singleton (URL/anon key from env)
|-- state/
|   `-- authStore.ts       # zustand store: session, user, hydration state
|-- features/
|   `-- */\*Service.ts     # existing service layer; internals swapped from
|                          # DatabaseAdapter/SQLite calls to supabase-js queries,
|                          # same function signatures where practical
`-- db/                    # retired after migration completes; deleted, not archived

app/
|-- (auth)/
|   |-- sign-in.tsx
|   |-- sign-up.tsx
|   `-- forgot-password.tsx
`-- _layout.tsx             # gains an auth gate: redirect to (auth) group when no session

tests/
|-- integration/            # re-pointed at a real Postgres instance instead of in-memory SQLite
`-- unit/                   # unchanged in shape
```

**Structure Decision**: Keep the existing `features/*Service.ts` boundary
(established since spec 001) as the seam between screens and persistence —
swap what's behind each service from SQLite repositories to Supabase queries
so screens and components need minimal changes. Add a new `(auth)` route
group and a root-level auth gate in `app/_layout.tsx`. Retire `src/db/`
entirely once every service is ported, rather than keeping it as a dead
parallel path.

## Design Decisions

1. **Supabase over a custom Node/Express backend.** Postgres + Auth + RLS +
   auto-generated REST already satisfies "backend for parallel users" with
   nothing to host, patch, or pay for beyond Supabase's free tier — directly
   serves the "don't want to pay for infrastructure" constraint behind
   avoiding the Apple fee.
2. **`supabase-js` works inside Expo Go.** It's a pure JS `fetch`/WebSocket
   client with no native module compilation step. The only quasi-native
   dependency is AsyncStorage for session persistence, which ships inside
   Expo Go — no custom dev client is required.
3. **Drizzle is dropped for the Postgres side.** The current schema targets
   `drizzle-orm/sqlite-core`; porting it to Postgres means maintaining a
   second dialect with different types (`real` -> `numeric`, integer-mode
   booleans -> real `boolean`) for a schema this small. Plain versioned SQL
   under `supabase/migrations/` (the standard Supabase CLI workflow) is
   simpler to read, diff, and apply than a second ORM dialect.
4. **Online-only.** The user's explicit call for this phase — the single
   biggest complexity reduction available (no write queue, no conflict
   resolution, no background sync). Revisit as its own future phase if
   gym/basement connectivity turns out to be a real problem in practice.
5. **Session storage via AsyncStorage**, per Supabase's official Expo
   integration guide. `expo-secure-store` is more secure but has a ~2KB
   per-key limit that complicates storing a full session payload; can be
   swapped in later without any schema impact since it's purely a client
   storage adapter.
6. **RLS is the only authorization layer.** No permission checks are
   duplicated in application code. Every user-owned table's policy is
   `auth.uid() = user_id` (or public-read for `exercises`/`muscle_groups`) —
   this is the actual mechanism that satisfies "a user only sees their own
   data" (FR-007), not client-side filtering, which a user could bypass.
7. **`profiles` replaces the hardcoded `local-user`.** A `public.profiles`
   table (`id uuid references auth.users(id)`) populated via an
   on-signup trigger becomes the FK target for `workouts`/`workout_sessions`,
   replacing today's single `LOCAL_USER_ID = "local-user"` constant in
   `profileRepository.ts`.
8. **Migration is a single-branch cutover, not a toggle.** Partial cutover —
   some screens still reading SQLite while others read Supabase — would be
   confusing to build, test, and reason about. Ported vertical slices land
   together; `src/db/` is deleted once the last screen is ported rather than
   kept around as a second, unused code path.

## Suggested Task Phases

(For `/speckit-tasks` / manual task breakdown when implementation starts —
not yet broken into individual tasks in this plan.)

1. **Supabase project setup** — create project, author `supabase/migrations/`
   (tables + RLS policies + profiles-on-signup trigger), seed
   `exercises`/`muscle_groups` via `supabase/seed.sql`, wire env vars
   (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
2. **Auth screens + gate** — `(auth)/sign-in.tsx`, `sign-up.tsx`,
   `forgot-password.tsx`, `authStore.ts`, root layout redirect logic,
   AsyncStorage session persistence. Delivers User Story 1 end to end.
3. **Port core data services** — one vertical slice at a time, profile and
   workout builder first (nothing else depends on them), then sessions/set
   logging, then history/dashboard/streak — each slice swaps a
   `*Service.ts`'s internals to `supabase-js` behind its existing call
   signature. Delivers User Story 2.
4. **Local-data import flow** — first-sign-up prompt, one-time copy of
   existing local SQLite rows into the new Supabase account. Delivers User
   Story 3.
5. **Account basics** — profile screen shows signed-in email, sign-out,
   forgot-password entry point. Delivers User Story 4.
6. **Retire SQLite** — delete `src/db/`, `expo-sqlite`, and the SQLite build
   of `drizzle-orm` once nothing references them; update tests to run against
   Postgres instead of in-memory SQLite.
7. **Full regression pass** — every existing manual Expo QA flow re-run
   against Supabase; RLS isolation test (two accounts, one device) added to
   the automated suite per SC-002.

## Complexity Tracking

*Documented per constitution Governance — this phase is an intentional,
user-directed stack pivot, not an incidental violation.*

| Change | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Cloud service (Supabase) replaces local-only SQLite | Accounts + parallel-user access were explicitly requested | Local SQLite is inherently single-device/single-user; no local-only option satisfies "accounts" |
| Offline-first dropped to online-only | Explicit user decision to keep this phase small | An offline queue or full local-first sync engine were both considered and explicitly deferred by the user as unnecessary complexity for now |
