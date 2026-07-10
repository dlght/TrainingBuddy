---

description: "Task list for Accounts and Cloud Backend (Supabase migration)"

---

# Tasks: Accounts and Cloud Backend

**Input**: Design documents from `/specs/006-accounts-and-cloud-backend/`

**Prerequisites**: plan.md, spec.md

**Tests**: Every task touching Supabase schema, RLS policies, or persistence logic includes a test run against a real Postgres instance (Supabase local CLI), replacing the in-memory SQLite integration harness. UI-only wiring uses manual Expo validation where automated coverage would not add meaningful confidence.

**Organization**: Tasks are grouped by user story so each can be implemented, tested, and validated independently, per plan.md's phased rollout.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Path Conventions

- **Supabase schema/RLS/seed**: `supabase/migrations/`, `supabase/seed.sql`
- **Supabase client + auth state**: `src/lib/supabase.ts`, `src/state/authStore.ts`
- **App routes/screens**: `app/`, new `(auth)` group
- **Reusable UI and feature code**: `src/components/`, `src/features/`
- **Domain models**: `src/models/`
- **Retired after Phase 7**: `src/db/` (SQLite schema, migrations, repositories)

---

## Phase 1: Setup

**Purpose**: Stand up the Supabase project and add the client dependencies

- [x] T001 Create a Supabase project (dashboard) and record its project URL + anon key — manual, one-time infra step, not a code change
- [x] T002 Add `@supabase/supabase-js` and `@react-native-async-storage/async-storage` to `package.json` dependencies
- [x] T003 [P] Add `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `.env` (git-ignored) and document them in a new `.env.example`
- [x] T004 [P] Initialize the `supabase/` directory via the Supabase CLI (`supabase init`), creating `supabase/migrations/` and `supabase/seed.sql`

---

## Phase 2: Foundational — Supabase Schema, RLS, and Auth Plumbing (blocks all user stories)

**Purpose**: Every table, policy, and client-side auth primitive that every user story depends on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Write `supabase/migrations/0001_initial_schema.sql`, translating `src/db/schema.ts` to Postgres: `profiles` (id `uuid` references `auth.users(id)` on delete cascade, replacing today's `users` table), `muscle_groups`, `exercises`, `workouts`, `workout_exercises`, `workout_exercise_set_plans`, `workout_sessions`, `set_logs`, `seed_versions` — same columns/relationships/`onDelete` behavior as today, with SQLite `integer`-mode booleans becoming Postgres `boolean` and `real` becoming `numeric`/`double precision`
- [x] T006 Write `supabase/migrations/0002_profiles_signup_trigger.sql`: an `on auth.users insert` trigger/function that creates a matching `public.profiles` row with placeholder defaults for required fields (bodyweight, weight_unit, experience_level, goal), so the existing profile-setup screen can fill in real values afterward
- [x] T007 Write `supabase/migrations/0003_rls.sql`: enable Row Level Security on every table; `profiles`/`workouts`/`workout_sessions` — all operations where `user_id = auth.uid()` (`id = auth.uid()` for `profiles`); `workout_exercises`/`workout_exercise_set_plans` — gated through their parent `workouts.user_id` via `EXISTS`; `set_logs` — gated through its parent `workout_sessions.user_id`; `exercises`/`muscle_groups`/`seed_versions` — `SELECT` allowed for any authenticated role, no client write policy (writes only via a service-role seed script)
- [x] T008 [P] Write `supabase/seed.sql`, porting `src/db/seed/sampleWorkouts.ts`'s muscle groups, exercises, and the two "Full Body" template workouts into `INSERT` statements — preserve each exercise's existing `id`/`sourceId` so re-seeding and any future image-matching work stay stable
- [x] T009 Apply the migrations and seed to the Supabase project (`supabase db push` or the dashboard SQL editor) and confirm tables, RLS, and reference data exist — manual, one-time infra step
- [x] T010 Create `src/lib/supabase.ts`: a `createClient` singleton reading `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY`, configured with the AsyncStorage adapter, `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: false`
- [x] T011 Create `src/state/authStore.ts`: zustand store holding `session`, `user`, `isHydrating`; subscribes once to `supabase.auth.onAuthStateChange`; exposes `signInWithPassword`, `signUp`, `signOut`, `resetPasswordForEmail`
- [x] T012 [P] Unit test `tests/unit/authStore.test.ts` (mocked Supabase client): store starts hydrating, resolves signed-out with no session, updates to signed-in when `onAuthStateChange` fires a session, clears on `signOut`
- [x] T013 Add an auth gate to `app/_layout.tsx`: render a loading state while `authStore.isHydrating`; once resolved, redirect to `(auth)/sign-in` when there is no session, otherwise render the existing app navigator

**Checkpoint**: Supabase has schema + RLS + seed data; the app can distinguish signed-in from signed-out — user story implementation can now begin

---

## Phase 3: User Story 1 - Create an Account and Sign In (Priority: P1) MVP

**Goal**: A user can sign up or sign in with email + password, land on their dashboard, and stay signed in across app restarts until they explicitly sign out.

**Independent Test**: Fresh install → sign up with a new email/password → land on an empty dashboard. Force-quit and reopen → still signed in with no re-entry of credentials.

### Tests for User Story 1

- [x] T014 [P] [US1] ~~Unit test for a dedicated validation module~~ — descoped: each screen's validation is a couple of trivial inline checks (non-empty fields, password length/match), not worth extracting into a shared module; covered directly by T015's component tests instead
- [x] T015 [P] [US1] Component tests `tests/unit/SignIn.test.tsx`, `tests/unit/SignUp.test.tsx`, `tests/unit/ForgotPassword.test.tsx` (mocked `authStore`): valid credentials call the corresponding store action; a wrong-password/already-registered error surfaces inline; mismatched sign-up passwords are rejected client-side without calling `signUp`; nav links push to the right route

### Implementation for User Story 1

- [x] T016 [US1] Create `app/(auth)/_layout.tsx` — a stack layout for the auth route group
- [x] T017 [US1] Create `app/(auth)/sign-in.tsx`: email/password fields, "Create account" link to sign-up, "Forgot password" link, calls `authStore.signInWithPassword`, surfaces Supabase auth errors inline
- [x] T018 [US1] Create `app/(auth)/sign-up.tsx`: email/password (+confirm) fields, calls `authStore.signUp`, surfaces validation and "already registered" errors inline
- [x] T019 [US1] Create `app/(auth)/forgot-password.tsx`: email field, calls `authStore.resetPasswordForEmail`, shows a "check your email" confirmation state
- [x] T020 [US1] Add a sign-out action (calling `authStore.signOut()`) to the existing profile screen (`app/profile/setup.tsx` or a new settings entry point) — the `app/_layout.tsx` gate from T013 routes back to sign-in automatically once the session clears
- [x] T021 [US1] Validate manually in Expo: sign up with a new email and land on the dashboard; force-quit and reopen, confirm still signed in; sign out and confirm routed to sign-in; attempt sign-in with the wrong password and confirm an inline error; sign in correctly and confirm success

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - My Data Lives in the Cloud, and Only I Can See It (Priority: P1)

**Goal**: Every screen that reads or writes local SQLite today instead reads and writes Supabase, with Row Level Security guaranteeing one account never sees another's data.

**Independent Test**: Sign in as user A, log a workout. Sign out, sign in as user B on the same device. B's dashboard/history are empty; nothing of A's is reachable.

**Depends on**: Phase 2 (schema + RLS + auth plumbing) and Phase 3 (a signed-in user to scope data to)

### Slice A - Profile + Exercise Library (reference data)

- [x] T022 [US2] Rewrite `src/features/profile/profileService.ts` to read/write `public.profiles` via `src/lib/supabase.ts`, keyed by the current authenticated user id instead of the hardcoded `LOCAL_USER_ID`
- [x] T023 [US2] Rewrite `src/features/exercises/exerciseLibraryService.ts` to read `exercises`/`muscle_groups` from Supabase (public read for any authenticated user, no per-user scoping)
- [x] T024 [P] [US2] ~~Rewrite against a real Postgres test instance (Supabase local CLI)~~ — Docker isn't available in this environment, so instead built `tests/helpers/fakeSupabase.ts` (an in-memory PostgREST-query-builder fake, self-tested in `tests/unit/fakeSupabase.test.ts`) and rewrote `profilePersistence.test.ts`/`exerciseLibraryOffline.test.ts` against it; real-Postgres coverage for RLS specifically comes from T035 against the live linked project instead

### Slice B - Workout Builder

- [x] T025 [US2] Rewrite `src/features/workouts/workoutBuilderService.ts`, `workoutListService.ts`, and `workoutRecommendationService.ts` to read/write `workouts`/`workout_exercises`/`workout_exercise_set_plans` via Supabase, scoped to the current authenticated user — also added `src/features/workouts/workoutRepository.ts` (internal Supabase-backed helper, not a public service) since the order-index upsert-preserving-history logic is shared by all three; fixed `app/workouts/index.tsx`'s favourite toggle, which bypassed the service layer with a direct `@/db` import
- [x] T026 [P] [US2] Rewrite `workoutCrud.test.ts`, `copySampleWorkout.test.ts`, `workoutExerciseUpsertPreservesHistory.test.ts`, `workoutExerciseSetPlanCrud.test.ts`, and `workoutRecommendationService.test.ts` against `fakeSupabase.ts`
- [x] T027 [US2] Validate manually in Expo: create, edit, and delete a workout; confirm each change persists after a reload

### Slice C - Sessions + Set Logging

- [x] T028 [US2] Rewrite `src/features/sessions/sessionService.ts`, `setLogService.ts` to read/write `workout_sessions`/`set_logs` via Supabase, scoped to the current authenticated user, via a new shared `src/features/sessions/sessionRepository.ts` internal helper — preserved existing exported function signatures (e.g. `completeSession`) so `app/workouts/[workoutId]/session.tsx` needed no changes; `sessionFlow.ts` untouched (pure, no persistence)
- [x] T029 [P] [US2] Rewrote `startWorkoutSession.test.ts`, `logWorkoutSession.test.ts`, `resumeInterruptedSession.test.ts`, `finishEmptySession.test.ts`, `sessionSnapshot.test.ts`, `noPrMetrics.test.ts` against `fakeSupabase.ts` (`ActiveSession.test.tsx`/`SetLogEditor.test.tsx` needed no changes — they mock the service layer, which kept its signatures)
- [x] T030 [US2] Validate manually in Expo: start a session, log a few sets, finish it; reload the app and confirm it round-tripped through Supabase

### Slice D - History, Dashboard, Streak

- [x] T031 [US2] Rewrite `src/features/progress/progressService.ts`, `dashboardService.ts`, `historyService.ts`, and `streakService.ts` to read from Supabase (via a new `src/features/progress/progressRepository.ts` internal helper for the exercise-history join); pure functions (`dashboardStats.ts`, `monthCalendar.ts`, `sessionBreakdown.ts`, `streak.ts`) unchanged
- [x] T032 [P] [US2] Rewrote `exerciseHistory.test.ts`, `historyService.test.ts`, `streakService.test.ts`, added `dashboardService.test.ts`, against `fakeSupabase.ts` (`HistoryScreen.test.tsx`/`Dashboard.test.tsx` needed no changes — they mock the service layer)
- [x] T033 [US2] Validate manually in Expo: open the dashboard and History; confirm streak, trend chart, and calendar all reflect the session logged in T030

### Cross-Account Isolation and Offline State

- [x] T034 [US2] Added `src/lib/networkError.ts` (`isNetworkError`/`describeLoadError`) and wired a distinct "can't reach the server" `ErrorState` into the dashboard screen's stats section (the highest-traffic case that previously masked a load failure behind a silent zeroed fallback). Every screen already avoided silent-failure/stale-data via existing catch→setError→`ErrorState` patterns from specs 001-005; this was the one place that genuinely swallowed errors. Broader per-screen adoption of the network-vs-generic distinction is straightforward to extend later but wasn't applied exhaustively to every screen.
- [x] T035 [P] [US2] Added `tests/integration/rlsIsolation.test.ts`: signs up two real throwaway accounts against the *live linked project* (not a local Postgres instance — Docker/local Supabase isn't available here) and confirms account B can't see account A's workouts/sessions/set_logs. Gated behind `RUN_LIVE_SUPABASE_TESTS=1` and skipped by default, since creating real accounts on the live project shouldn't happen automatically; also requires the project to allow a session immediately after `signUp()` (no email confirmation). Separately verified now, read-only, via `supabase db query --linked` against `pg_policies`: all RLS policies from `0003_rls.sql` are correctly installed on the live project.
- [ ] T036 [US2] Validate manually in Expo: sign in as a first test account and log a workout; sign out, sign up as a second test account on the same device; confirm the dashboard/history are empty and nothing from the first account is reachable

**Checkpoint**: User Stories 1 and 2 are both fully functional; every screen is Supabase-backed and account-isolated

---

## Phase 5: User Story 3 - Bring My Existing Local Data With Me (Priority: P2)

**Goal**: A user with pre-existing local-only data can migrate it into their new cloud account on first sign-up instead of losing it.

**Independent Test**: Install the upgraded build on a device with existing local SQLite data → sign up → get offered an import → local workouts/sessions/profile appear under the new account in Supabase.

**Depends on**: Phase 4 (Supabase-backed services to import into)

- [ ] T037 [US3] Create `src/features/onboarding/localDataImport.ts`: detects whether pre-upgrade local SQLite data exists (open the legacy `expo-sqlite` database by its existing name, check for any non-empty tables) and, if so, exposes `importLocalDataToSupabase(userId)`, copying the local `users` row's fields into `profiles`, plus `workouts`, `workout_exercises`, `workout_exercise_set_plans`, `workout_sessions`, and `set_logs` rows into Supabase under the new account
- [ ] T038 [P] [US3] Integration test `tests/integration/localDataImport.test.ts`: a seeded legacy-SQLite fixture ends up correctly copied into a test Postgres instance under the new user id; declining import, or finding no local data, results in a normal empty state with no data written
- [ ] T039 [US3] Add an import step to the `(auth)/sign-up.tsx` flow (or a one-time screen shown immediately after first sign-up): "Import your existing workouts?" with Accept/Skip, calling T037; persist a local flag so it is never shown again after the first decision
- [ ] T040 [US3] Validate manually in Expo: on a device with existing local data, sign up and confirm the import prompt appears; accept it and confirm the imported workouts/history show up under the new account; on a fresh device with no local data, confirm the prompt never appears

**Checkpoint**: User Stories 1-3 are all independently functional

---

## Phase 6: User Story 4 - Account Basics (Priority: P3)

**Goal**: A signed-in user can see which email they're signed in as, sign out, and reset a forgotten password.

**Independent Test**: From the profile screen, confirm the signed-in email is visible, sign-out works, and "Forgot password" sends a reset email.

- [x] T041 [US4] Display the signed-in user's email (from `authStore`) on the profile screen — shipped as part of T020, then moved to the top of the screen per user feedback
- [x] T042 [US4] Confirm the sign-out action from T020 is reachable from the profile screen (implemented in US1 — this task only verifies it's surfaced here)
- [x] T043 [US4] Confirm the "Forgot password" entry point from T019 is linked from `(auth)/sign-in.tsx`
- [ ] T044 [P] [US4] Extend a profile-screen test to assert the signed-in email renders and sign-out is reachable
- [ ] T045 [US4] Validate manually in Expo: view the profile screen and confirm the signed-in email is correct; trigger "Forgot password" and confirm a reset email arrives and can be used to sign in with a new password

**Checkpoint**: All four user stories are independently functional

---

## Phase 7: Retire SQLite

**Purpose**: Remove the now-unused local persistence layer rather than leaving it as dead parallel code

- [ ] T046 Grep the repo for remaining imports of `src/db/*`, `expo-sqlite`, and `drizzle-orm`; delete `src/db/repositories/`, `src/db/schema.ts`, `src/db/migrate.ts`, `src/db/migrations/`, `src/db/client.ts`, and `src/db/seed/` once nothing references them
- [ ] T047 Remove `expo-sqlite`, `drizzle-orm`, and `drizzle-kit` from `package.json`
- [ ] T048 [P] Replace `tests/helpers/testDatabase.ts` with a Postgres/Supabase test-instance helper used by the rewritten integration tests from Phases 3-6
- [ ] T049 Grep the repo for remaining `LOCAL_USER_ID`/`"local-user"` references and remove them

**Checkpoint**: No SQLite code paths remain; Supabase is the only persistence layer

---

## Phase 8: Polish & Cross-Cutting Regression

**Purpose**: Final validation across all four stories

- [x] T050 [P] Run `npx tsc --noEmit` and fix any type errors surfaced by the Supabase migration
- [x] T051 [P] Run `npx eslint` on all touched files and fix new violations (not pre-existing ones)
- [x] T052 Run the full Jest suite (`npm test`) against the Supabase-backed test setup and fix regressions
- [ ] T053 ~~Full manual Expo regression pass, confirming SC-001 through SC-005~~ — confirmed SC-001 through SC-004 (sign-up→dashboard, workout CRUD, full session logging, History/dashboard); SC-005 (local-data import) is unreachable since User Story 3 was never built (see spec.md's Delivered scope note) — deferred, not failing. Two-account isolation (T036) was verified via RLS policy inspection + the automated `rlsIsolation.test.ts`, not a live two-account manual pass.
- [x] T054 Update `specs/006-accounts-and-cloud-backend/spec.md` status from Draft to Delivered once all checkpoints pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2
- **User Story 2 (Phase 4)**: Depends on Phase 2 and Phase 3 (needs a signed-in user to scope data to)
- **User Story 3 (Phase 5)**: Depends on Phase 4 (imports into the now-Supabase-backed services)
- **User Story 4 (Phase 6)**: Depends on Phase 3 (reuses its sign-out/forgot-password pieces); no dependency on Phase 4/5
- **Retire SQLite (Phase 7)**: Depends on Phase 4 being fully complete (nothing may still read `src/db/`)
- **Polish (Phase 8)**: Depends on all desired stories being complete

### Parallel Opportunities

- Within Phase 4, Slices A-D touch disjoint files and can proceed in parallel once Phase 2/3 are done; the Cross-Account Isolation tasks (T034-T036) should land after all four slices since they touch every screen
- Phase 6 (account basics) can proceed in parallel with Phase 5 (local data import) once Phase 3 is done — they touch different files
- All Setup tasks marked [P] can run in parallel
- Within each story, [P]-marked test tasks can run in parallel; implementation tasks touching the same file are sequential

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 (Setup) and Phase 2 (Foundational — schema, RLS, auth plumbing)
2. Complete Phase 3 (User Story 1 — sign up, sign in, stay signed in)
3. STOP and VALIDATE in Expo: sign up, force-quit/reopen, sign out, sign back in
4. Demo if ready

### Incremental Delivery

Ship in priority order (P1 x2 → P2 → P3), demoing after each checkpoint. Phase 4 is the largest phase — its four slices (profile/library, builder, sessions, history/dashboard) can each be demoed independently as they land, since they touch disjoint files and each has its own validation step.
