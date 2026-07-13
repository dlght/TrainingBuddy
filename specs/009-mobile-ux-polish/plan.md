# Implementation Plan: Mobile UX Polish (Safe Areas, Keyboard, Session Safety)

**Branch**: `009-mobile-ux-polish` | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-mobile-ux-polish/spec.md`

## Summary

Five independent, additive fixes on top of the spec-006/007/008 Supabase app:
auto-pause an active session (new `paused` status) when the user leaves the
session screen without an explicit end/discard action; require confirmation
before every "Discard session" tap; wrap every text-input screen in
`KeyboardAvoidingView`; wrap every screen in safe-area-aware containers via
`react-native-safe-area-context`; and swap the workout builder's button order
so "+ Add exercise" sits above "Save workout." No new screens, no new
navigation pattern — everything builds on the existing `features/*Service.ts`
seam and `app/` route files.

## Technical Context

**Language/Version**: TypeScript (unchanged)

**Primary Dependencies**: Expo, React Native, `@supabase/supabase-js`,
expo-router ~6.0.0 — all unchanged from spec 006-008. One dependency goes
from transitive to direct: `react-native-safe-area-context` (~5.6.0, already
resolved in the lockfile via `react-native-gesture-handler`/expo-router; this
feature is the first to import it directly). No new package installed.

**Storage**: Supabase Postgres, RLS-scoped. One migration
(`0005_session_pause.sql`) extending `workout_sessions`: widen the `status`
check constraint to add `'paused'`, and add a nullable `paused_at
timestamptz` column. No new table, no RLS policy change (existing
`user_id = auth.uid()` policies on `workout_sessions` already cover the new
column/status value).

**Testing**: Jest unit tests for the new pure logic (pause/resume
`started_at` shift math, discard-confirmation gating) using the existing fake
Supabase test double for repository/service tests; manual Expo validation per
story, consistent with specs 001-008. Keyboard/safe-area stories are
validated manually (Expo Go on a notched-device simulator) since layout
insets aren't meaningfully unit-testable.

**Target Platform**: Expo Go (iOS/Android/web), unmodified — unchanged
constraint.

**Project Type**: mobile-app (unchanged)

**Performance Goals**: Unchanged — no story introduces a new query or a
heavier read than the app already performs per screen.

**Constraints**: Per-user isolation via RLS for the touched table; Expo Go
compatibility; no new native module (`react-native-safe-area-context` is a
pure-JS-bridged Expo-compatible library already resolvable in Expo Go, same
class of dependency as `react-native-gesture-handler`, which the app already
depends on directly in `app/_layout.tsx`).

**Scale/Scope**: Personal-scale multi-user, same as spec 006-008. Pause/
resume touches exactly one row (the caller's own active/paused session).

## Constitution Check

*GATE: Must pass before task breakdown. Re-checked after design below.*
*Checked against constitution v2.0.0.*

- Beginner-first: All five stories reduce accidental data loss/confusion
  (unattended session time, un-confirmed discard, hidden buttons/inputs,
  content under system UI) without adding any new concept a beginner must
  learn — no new screen, no new setting.
- Cloud-backed, per-user data: Satisfied — `paused`/`paused_at` live on the
  existing RLS-scoped `workout_sessions` row, same isolation as every other
  session field; no offline behavior introduced beyond the existing "can't
  reach the server" state (edge case in spec.md covers this for the pause/
  discard writes specifically).
- Approved stack: Satisfied — no new dependency installed;
  `react-native-safe-area-context` and `KeyboardAvoidingView` (core React
  Native) are both Expo Go-compatible with no native config/plugin required.
- Simplicity: No new settings/social/analytics/gamification surface; the
  `paused` state is the minimum needed to stop a timer, with no new
  user-facing pause button beyond the existing dashboard "Resume" entry
  point.
- Testable increment: Each of the five user stories has its own Independent
  Test in spec.md; US1/US2 (pause, discard confirm) need the migration and
  ship/test together as the session-safety pair, US3-US5 (keyboard, safe
  area, button order) are pure UI and independently shippable in any order.

## Project Structure

### Documentation (this feature)

```text
specs/009-mobile-ux-polish/
|-- spec.md                # Feature spec
`-- plan.md                # This file
```

(No separate `research.md`/`data-model.md`/`contracts/` — same call as specs
006/007: nothing here is ambiguous enough to warrant a split; the pause/
resume design decision below covers the one piece of real design work.)

### Source Code (repository root)

```text
supabase/
`-- migrations/
    `-- 0005_session_pause.sql        # status check + paused_at column on workout_sessions

src/
|-- models/
|   `-- session.ts                     # WorkoutSessionStatus gains "paused"; WorkoutSession gains pausedAt
|-- features/
|   `-- sessions/
|       |-- sessionRepository.ts       # pauseSession/resumeSession; getActiveSession + discard match ["active","paused"]
|       `-- sessionService.ts          # pauseActiveSession, resumeActiveSession does the started_at shift
`-- components/
    `-- ConfirmDialog.ts (or reuse Alert.alert directly — see Design Decisions)

app/
|-- _layout.tsx                        # wrap root Stack in SafeAreaProvider
|-- (auth)/
|   |-- sign-in.tsx                    # KeyboardAvoidingView + safe-area root
|   |-- sign-up.tsx                    # KeyboardAvoidingView + safe-area root
|   `-- forgot-password.tsx            # KeyboardAvoidingView + safe-area root
|-- index.tsx                          # discardActiveSession gains confirm; safe-area root
|-- workouts/
|   `-- new.tsx                        # KeyboardAvoidingView; swap Save/Add-exercise order; safe-area root
`-- workouts/[workoutId]/session.tsx   # beforeRemove guard -> pause; discardSession gains confirm; safe-area root

src/features/sessions/SetLogEditor.tsx # wrapped by session.tsx's new KeyboardAvoidingView, no own change expected
src/features/profile/ProfileForm.tsx   # KeyboardAvoidingView + safe-area root

tests/
`-- unit/
    `-- sessionRepository.test.ts (or sessionService.test.ts)  # pause/resume started_at-shift cases, discard-from-paused case
```

**Structure Decision**: Keep the existing `features/*Service.ts` seam — pause/
resume is added to `sessionRepository`/`sessionService` alongside the
existing `completeSession`/`discardSession` methods, not a new feature
folder. Safe-area and keyboard-avoidance are applied at each screen's root
element individually (no shared custom wrapper component introduced) since
the app has ~10 top-level screens and a generic `<ScreenContainer>` would be
the only consumer of itself — not worth the abstraction for this batch;
`SafeAreaProvider` itself is the one truly global piece and goes in
`app/_layout.tsx` once, same pattern as spec 007's single `headerRight` wire-up.

## Design Decisions

1. **Pausing shifts `started_at` forward on resume instead of tracking
   accumulated elapsed time.** `session.tsx`'s elapsed-time display is
   `useElapsedSeconds(session.startedAt, ...)` — a live `now - startedAt`
   computation with no separate "elapsed seconds" field anywhere
   (`session.tsx:187-190`). Introducing a parallel accumulator would mean
   every elapsed-time reader needs to learn about it. Instead: pausing sets
   `status = 'paused'`, `paused_at = now()`; resuming computes
   `pauseDurationMs = now() - paused_at`, sets
   `started_at = started_at + pauseDurationMs`, `status = 'active'`,
   `paused_at = null`. `useElapsedSeconds` and every other `startedAt`
   consumer need zero changes — time spent paused simply never happened as
   far as `started_at` is concerned. Same trick applies to the rest timer,
   which is already ephemeral client state (`restDurationSeconds` in
   `activeSessionStore`) that gets re-armed from
   `currentExercise.targetRestSeconds` on remount (`session.tsx:173-177`),
   so it self-corrects with no extra work.
2. **Pause is detected via the navigation `beforeRemove` event, not
   `BackHandler`.** React Navigation (which expo-router ~6 sits on) fires
   `beforeRemove` for header back, Android hardware back, and swipe-back
   gesture uniformly — one `navigation.addListener('beforeRemove', ...)` in
   `session.tsx` covers all three without separate `BackHandler` code. The
   handler fires `sessionService.pauseActiveSession(sessionId)` without
   calling `event.preventDefault()` — native-stack (used by expo-router ~6)
   does not support blocking removal and re-dispatching the action later;
   doing so desyncs native and JS navigation state ("screen was removed
   natively but didn't get removed from JS state"). The pause write is
   fire-and-forget: navigation proceeds immediately, matching the same
   "can't reach the server" edge case already covered in spec.md (the write
   may not land if the app is killed before it completes). It does not fire
   for `finishSession`/`discardSession`'s own `router.replace("/")` calls in
   the normal case, but as a safety net those handlers also explicitly set
   `isIntentionalLeaveRef` before navigating so an in-flight finish/discard
   is never misclassified as an accidental leave (FR-001 edge case).
3. **`getActiveSession` and `discardSession` must recognize `paused`, not
   just `active`.** Today `sessionRepository.getActiveSession` filters
   `.eq("status", "active")` (`sessionRepository.ts:112`) and
   `sessionService.discardSession` returns a no-op unless
   `session.status !== "active"` (`sessionService.ts:156`). If these stay
   `active`-only, a paused session becomes invisible to the dashboard's
   "Workout in progress" card and undiscardable — silently breaking Resume/
   Discard. Both are changed to match `status in ('active', 'paused')`.
   `startWorkoutSession`'s existing-session guard
   (`sessionService.ts:105-109`) inherits this automatically since it reuses
   `getActiveSession`, so a paused session still correctly blocks starting a
   second workout.
4. **Resume happens automatically on navigating into the session screen,
   not via a separate button.** The dashboard's existing "Resume workout"
   button already does `router.push(`/workouts/${workout.id}/session`)`
   (`app/index.tsx:230`) — unchanged. `session.tsx`'s session-loading effect
   calls a new `sessionService.resumeActiveSession()` (extending the
   existing stub at `sessionService.ts:99-101`, which today just re-fetches)
   so that if the loaded session's status is `paused`, it performs the
   `started_at`-shift transition back to `active` as part of that same load,
   before rendering. This satisfies FR-002 with no new UI element — spec
   Assumption "no new pause/resume button beyond the existing Resume entry
   point" holds.
5. **Discard confirmation reuses `Alert.alert`, matching the spec-007
   precedent for the "End workout early" confirm step.** All three discard
   entry points (`session.tsx:377` mid-session, `session.tsx:418`
   `FinishDiscardActions`, `app/index.tsx:233`
   dashboard) wrap their existing `onPress` handler in a native
   `Alert.alert("Discard session?", "...", [Cancel, {text: "Discard",
   style: "destructive", onPress: <existing handler>}])` call. No new
   component — three call sites, same pattern, no shared abstraction
   introduced for three uses (constitution Principle IV).
6. **Safe area: one `SafeAreaProvider` at the root, `SafeAreaView` (or
   `useSafeAreaInsets` + padding) per screen.** `app/_layout.tsx` gains a
   `SafeAreaProvider` wrapping the existing `GestureHandlerRootView` (or vice
   versa — order doesn't matter for these two providers). Each of the ~10
   screen root containers (`app/(auth)/*.tsx`, `app/index.tsx`,
   `app/workouts/new.tsx`, `app/workouts/[workoutId]/session.tsx`,
   `app/history/index.tsx`, `app/challenges/index.tsx`,
   `ProfileForm.tsx`) swaps its outermost `View`/`ScrollView` for
   `SafeAreaView` from `react-native-safe-area-context` (not the deprecated
   RN-core one), `edges={["top", "bottom"]}`. Screens already inside a
   `Stack` header keep `edges={["bottom"]}` only, since the header already
   handles the top inset — avoids the "double top padding" failure mode
   called out in spec.md's FR-007/US4 edge case.
7. **Keyboard avoidance: one `KeyboardAvoidingView` per form screen,
   `behavior="padding"` on iOS / `"height"` on Android.** Wraps the existing
   `ScrollView`/`View` in each of the six screens named in FR-005
   (`sign-in.tsx`, `sign-up.tsx`, `forgot-password.tsx`, `workouts/new.tsx`,
   `ProfileForm.tsx`, and `session.tsx` around `SetLogEditor`), following the
   standard Expo/RN idiom
   (`<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" :
   "height"} style={{flex: 1}}><ScrollView>...</ScrollView></
   KeyboardAvoidingView>`). No new dependency — `KeyboardAvoidingView` is
   core React Native.
8. **Button reorder is a pure JSX move.** `app/workouts/new.tsx` currently
   renders "Save/Update workout" (lines 292-303) before "+ Add exercise"
   (lines 305-314) inside the same `ScrollView`. Swap the two blocks' order
   in the JSX; no style or handler changes.

## Complexity Tracking

*No constitution violations — table intentionally omitted.*
