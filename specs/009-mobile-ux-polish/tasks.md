---

description: "Task list for spec 009: mobile UX polish (safe areas, keyboard, session safety)"
---

# Tasks: Mobile UX Polish (Safe Areas, Keyboard, Session Safety)

**Input**: Design documents from `/specs/009-mobile-ux-polish/`

**Prerequisites**: plan.md, spec.md

**Tests**: Included for the new pause/resume logic (the one piece of real
data-changing behavior) using the existing fake-Supabase test double. The
remaining four stories (discard confirmation, keyboard avoidance, safe area,
button reorder) are UI-only wiring and use manual Expo validation, consistent
with spec 007/008's convention.

**Organization**: Tasks are grouped by user story (US1-US5, matching
spec.md). US1/US2 are P1; US3/US4 are P2; US5 is P3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Path Conventions

- **App routes/screens**: `app/`
- **Reusable feature code/services**: `src/features/`, `src/state/`
- **Domain models**: `src/models/`
- **Supabase schema**: `supabase/migrations/`
- **Tests**: `tests/unit/`, `tests/integration/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema change needed by US1 (pause) and, transitively, US2
(discard from a paused session). US3-US5 need no schema change and do not
depend on this phase.

- [x] T001 Author `supabase/migrations/0005_session_pause.sql`: widen
      `workout_sessions`'s `status` check constraint to
      `status in ('active', 'paused', 'completed', 'discarded')`; add
      `paused_at timestamptz` (nullable). No RLS policy change — existing
      `user_id = auth.uid()` policies already cover the new column/value.
- [x] T002 Apply the migration to the linked Supabase project
      (`supabase db push`) and verify via a read query that the constraint
      and column landed correctly.

**Checkpoint**: US1 and US2 are unblocked. US3-US5 can proceed independently
of this phase at any time.

---

## Phase 2: User Story 1 - Leaving an active session pauses it (Priority: P1)

**Goal**: Leaving the session screen via back (not "End workout"/"Discard
session") pauses the session; elapsed/rest time stops until resumed.

**Independent Test**: Start a session, log one set, leave via the header
back button, wait 30s, resume from the dashboard — elapsed time matches what
it was when the user left, not +30s.

**Depends on**: Phase 1 (migration).

### Tests for User Story 1

- [x] T003 [P] [US1] Unit test (fake-Supabase-backed) in
      `tests/unit/sessionRepository.test.ts` or
      `tests/integration/sessionPause.test.ts`: `pauseSession` sets
      `status='paused'` and `paused_at`; `resumeSession` shifts `started_at`
      forward by exactly the paused duration, sets `status='active'`, clears
      `paused_at`; resuming a session that was never paused is a no-op.
- [x] T004 [P] [US1] Unit test asserting `getActiveSession` returns a
      `paused` session (not just `active`), and `discardSession` succeeds
      from `paused` as well as `active` (covers US1 + US2's precondition
      together, since both repository changes land in the same file).

### Implementation for User Story 1

- [x] T005 [US1] `src/models/session.ts`: add `"paused"` to
      `WorkoutSessionStatus`; add `pausedAt: string | null` to
      `WorkoutSession`.
- [x] T006 [US1] `src/features/sessions/sessionRepository.ts`: add
      `pauseSession(sessionId)` (`status='paused', paused_at=now()`, guarded
      `.eq("status", "active")`) and `resumeSession(sessionId)` (reads the
      row, computes `pauseDurationMs = now - paused_at`, updates
      `started_at = started_at + pauseDurationMs`, `status='active'`,
      `paused_at=null`, guarded `.eq("status", "paused")`); change
      `getActiveSession`'s filter from `.eq("status", "active")` to
      `.in("status", ["active", "paused"])`.
- [x] T007 [US1] `src/features/sessions/sessionService.ts`: add
      `pauseActiveSession(sessionId)` wrapping the repository call; extend
      `resumeActiveSession()` so that when the loaded session's status is
      `paused`, it calls `sessionRepository.resumeSession` before returning
      the hydrated details.
- [x] T008 [US1] `app/workouts/[workoutId]/session.tsx`: register a
      `navigation.addListener('beforeRemove', ...)` guard — on trigger,
      call `sessionService.pauseActiveSession(sessionId)` then let the
      original navigation action proceed; explicitly bypass/remove the
      listener inside `finishSession`/`discardSession` before their own
      `router.replace`/navigation so an explicit end/discard is never
      misclassified as an accidental leave.
- [x] T009 [US1] `app/workouts/[workoutId]/session.tsx`: on session load,
      call the (now pause-aware) `sessionService.resumeActiveSession()`
      instead of a plain fetch, so navigating back into a paused session
      transitions it to active (with the `started_at` shift) before
      rendering.
- [x] T010 [US1] Manual Expo validation: start a session, log a set, leave
      via header back, wait, resume from dashboard — confirm elapsed time
      excludes the time spent away, and confirm "End workout"/"Discard
      session" still navigate away without triggering a pause.

**Checkpoint**: User Story 1 is independently functional.

---

## Phase 3: User Story 2 - Confirm before discarding a session (Priority: P1)

**Goal**: All three "Discard session" entry points require confirmation
before deleting anything.

**Independent Test**: Log two sets, tap "Discard session" from each of the
three entry points — a confirmation appears before deletion; canceling
leaves the session and its sets intact.

### Implementation for User Story 2

- [x] T011 [P] [US2] `app/workouts/[workoutId]/session.tsx`: wrap the
      mid-session "Discard session" `Pressable`'s `onPress={discardSession}`
      (line ~377) in an `Alert.alert("Discard session?", ..., [Cancel,
      {text: "Discard", style: "destructive", onPress: discardSession}])`.
- [x] T012 [P] [US2] `app/workouts/[workoutId]/session.tsx`:
      apply the same `Alert.alert` confirmation to `FinishDiscardActions`'s
      `onDiscard` (line ~418).
- [x] T013 [P] [US2] `app/index.tsx`: apply the same `Alert.alert`
      confirmation to the dashboard's `discardActiveSession` (line ~233).
- [x] T014 [US2] Manual Expo validation: trigger discard from each of the
      three entry points, cancel each time and confirm nothing is lost, then
      confirm the discard once and verify the session is gone.

**Checkpoint**: User Stories 1 and 2 both work independently — P1 slice
complete.

---

## Phase 4: User Story 3 - Keyboard never covers the field or button being used (Priority: P2)

**Goal**: Every text-input screen keeps the focused field and its primary
action button reachable while the keyboard is open.

**Independent Test**: On a small-screen simulator, focus the last field on
each of sign-in, sign-up, forgot-password, workout name, profile, and the
set-log editor — field and nearest button stay visible/reachable.

### Implementation for User Story 3

- [x] T015 [P] [US3] `app/(auth)/sign-in.tsx`: wrap the form root in
      `KeyboardAvoidingView` (`behavior={Platform.OS === "ios" ? "padding" :
      "height"}`).
- [x] T016 [P] [US3] `app/(auth)/sign-up.tsx`: same `KeyboardAvoidingView`
      wrap.
- [x] T017 [P] [US3] `app/(auth)/forgot-password.tsx`: same
      `KeyboardAvoidingView` wrap.
- [x] T018 [P] [US3] `app/workouts/new.tsx`: wrap the `ScrollView` (name
      field + exercise editors + Save/Add-exercise buttons) in
      `KeyboardAvoidingView`.
- [x] T019 [P] [US3] `src/features/profile/ProfileForm.tsx`: wrap the
      `ScrollView` in `KeyboardAvoidingView`.
- [x] T020 [US3] `app/workouts/[workoutId]/session.tsx`: wrap the region
      containing `SetLogEditor` in `KeyboardAvoidingView` so the "Log set"
      button and End/Discard actions stay reachable while entering
      reps/weight.
- [x] T021 [US3] Manual Expo validation: focus the last input on each of the
      six screens above with the keyboard open, confirm the field and
      nearest primary button remain visible or scrollable into view, and
      that dismissing the keyboard returns the layout to normal.

**Checkpoint**: User Stories 1-3 all independently functional.

---

## Phase 5: User Story 4 - Screen content respects device safe areas (Priority: P2)

**Goal**: No interactive content renders under the notch/status bar or
home-indicator area on any screen; no dead padding introduced on standard
devices.

**Independent Test**: On a notched/gesture-bar simulator, open the
dashboard, workout builder, and session screen — no button/input sits under
those system areas. On a standard device, layout is unchanged.

### Implementation for User Story 4

- [x] T022 [US4] `app/_layout.tsx`: wrap the root `Stack` (and its existing
      `GestureHandlerRootView`) in `SafeAreaProvider` from
      `react-native-safe-area-context`.
- [x] T023 [P] [US4] `app/(auth)/sign-in.tsx`, `sign-up.tsx`,
      `forgot-password.tsx`: swap the outermost `View` for `SafeAreaView`
      (from `react-native-safe-area-context`), `edges={["top", "bottom"]}`
      (these screens render without a `Stack` header).
- [x] T024 [P] [US4] `app/index.tsx`, `app/workouts/index.tsx`,
      `app/workouts/new.tsx`, `app/workouts/[workoutId]/session.tsx`,
      `app/history/index.tsx`, `app/challenges/index.tsx`: swap each
      screen's root container for `SafeAreaView`, `edges={["bottom"]}` only
      (top inset already handled by the `Stack` header on these routes).
- [x] T025 [P] [US4] `src/features/profile/ProfileForm.tsx`: same
      `SafeAreaView` treatment, `edges={["bottom"]}`.
- [x] T026 [US4] Manual Expo validation: on a notched/gesture-bar simulator,
      confirm no interactive content sits under the status bar or
      home-indicator on the screens above; on a standard simulator, confirm
      no new dead padding appears.

**Checkpoint**: User Stories 1-4 all independently functional.

---

## Phase 6: User Story 5 - Workout builder: "Add exercise" above "Save workout" (Priority: P3)

**Goal**: In the workout builder, "+ Add exercise" renders above "Save
workout"/"Update workout", with Save as the bottom-most element.

**Independent Test**: Open the workout builder, scroll to the bottom — "+
Add exercise" appears above "Save workout".

### Implementation for User Story 5

- [x] T027 [US5] `app/workouts/new.tsx`: move the "+ Add exercise" block
      (currently after "Save/Update workout") to render before it, so "Save
      workout" is the last element in the form; no style or handler changes.
- [x] T028 [US5] Manual Expo validation: open both the create and edit
      workout builder flows, confirm the new order and that both buttons
      still behave exactly as before.

**Checkpoint**: All five user stories independently functional.

---

## Phase 7: Polish & Regression

**Purpose**: Cross-cutting verification after all stories land.

- [x] T029 [P] `tsc` clean across the whole project.
- [x] T030 [P] `eslint` clean across the whole project.
- [x] T031 Full `jest` suite green, including the new pause/resume tests.
- [x] T032 Full manual Expo regression pass: create workout, log a full
      session end-to-end, end early, discard (confirmed), view history,
      dashboard — confirm none of the five changes above regressed existing
      flows.
- [x] T033 Update `specs/009-mobile-ux-polish/spec.md` Status to `Delivered`
      once the above is confirmed.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. Only blocks US1/US2 — US3-US5 can
  start immediately and in parallel with Phase 1.
- **User Stories (Phases 2-6)**: US1 depends on Phase 1. US2 depends on
  US1's repository changes (T006) for the paused-session discard case, but
  its confirmation-dialog work (T011-T013) can be written in parallel and
  merged once T006 lands. US3, US4, US5 depend on nothing but the current
  codebase and can proceed fully in parallel with everything else.
- **Polish (Phase 7)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- Phases 4, 5, 6 (US3, US4, US5) can run entirely in parallel with Phases
  1-3 (US1, US2) and with each other — no shared files with the
  session-pause/discard work except `app/workouts/[workoutId]/session.tsx`
  and `app/index.tsx`, which US1/US2/US3/US4 all touch; sequence those two
  files' edits within a single contributor or rebase carefully if split
  across people.
- Within Phase 4/5, all `[P]`-marked screen tasks touch different files and
  can run fully in parallel.

---

## Implementation Strategy

### Suggested order

1. Phase 1 (Setup) then Phase 2 + Phase 3 (US1, US2 — the P1 session-safety
   pair).
2. Phase 4 + Phase 5 (US3, US4 — P2, no schema dependency, can start anytime
   including in parallel with step 1).
3. Phase 6 (US5 — P3, trivial, any time).
4. Phase 7 (Polish & Regression), then close the spec.

### Incremental delivery

Each story phase ends with its own manual-Expo checkpoint — stop and demo
after any phase without blocking on the rest.

---

## Notes

- `[P]` tasks touch different files with no dependency between them.
- `[Story]` maps each task to its spec.md user story for traceability.
- `app/workouts/[workoutId]/session.tsx` is the one file touched by four of
  the five stories (US1 pause guard, US2 discard confirms, US3 keyboard
  wrap, US4 safe area) — do that file's edits as one coordinated pass rather
  than four independent ones to avoid merge churn.
- The pause/resume `started_at`-shift math (T003) is the one subtle
  correctness requirement in this batch — its test is the authoritative
  check that paused time is never counted as elapsed or rest time.
