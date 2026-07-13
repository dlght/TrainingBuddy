# Feature Specification: Mobile UX Polish (Safe Areas, Keyboard, Session Safety)

**Feature Branch**: `009-mobile-ux-polish`

**Created**: 2026-07-13

**Status**: Delivered

**Delivered scope**: All five user stories shipped in full — session pause
on accidental back-navigation (US1), discard confirmation from all three
entry points (US2), keyboard-avoiding views on all six input screens (US3),
safe-area handling across the app (US4), and the workout builder's
Save/Add-exercise reorder (US5). Manually validated end-to-end in Expo per
the task list's checkpoints; `tsc`, `eslint`, and the full `jest` suite are
green.

**Input**: User description: "1) save area view - add this to my app 2)
keyboard avoiding view 3) on back workout remains in progress -> alert or
pause workout on back 4) on discard session add confirmation 5) when
creating a workout - save workout -> should be at the bottom. and add
workout should be above it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Leaving an active session pauses it (Priority: P1)

A user is mid-workout and taps the header back button, swipes back, or
presses the Android hardware back button instead of using "End workout" or
"Discard session." Today the session screen has no guard at all: the app
just navigates away and the session keeps counting elapsed/rest time
unattended in the background. Instead, leaving the screen while a session is
active should automatically pause it — the elapsed and rest timers stop —
so time spent away from the app is never silently counted as workout time.

**Why this priority**: This is a correctness bug, not a polish item: today
every accidental back-navigation corrupts the session's elapsed time and
directly undermines history, streak, and dashboard accuracy — the same class
of problem spec 007 fixed for early-ending. It's the most impactful fix in
this batch.

**Independent Test**: Start a session, log one set, then use the header back
button (not "End workout"/"Discard session") to leave the screen. Wait 30
seconds, then resume the session from the dashboard. The elapsed/rest time
shown reflects time up to when the user left, not the 30 seconds spent away.

**Acceptance Scenarios**:

1. **Given** an active session, **When** the user leaves the session screen
   via the header back button, Android hardware back, or a swipe-back
   gesture, **Then** the session transitions to paused and its elapsed/rest
   timers stop advancing.
2. **Given** a paused session, **When** the user reopens it from the
   dashboard's "Resume" action, **Then** the session resumes as active and
   timers continue from where they were paused, not from where they would
   have been had time kept advancing while away.
3. **Given** an active session, **When** the user leaves via "End workout" or
   "Discard session," **Then** those existing flows are unaffected — pausing
   only applies to leaving the screen without going through an explicit
   end/discard action.
4. **Given** the app is killed or crashes while a session is active (not a
   graceful back-navigation), **Then** the session is still recoverable in
   whatever state existing behavior already provides — this story does not
   need to solve process-kill detection, only in-app navigation-away.

---

### User Story 2 - Confirm before discarding a session (Priority: P1)

A user taps "Discard session" — available both mid-session next to "End
workout early" and on the post-completion screen next to "Finish workout,"
as well as from the dashboard's "already active session" prompt — and today
it discards immediately with no confirmation, permanently losing every set
logged so far. A confirmation step should stand between the tap and the
actual discard.

**Why this priority**: Irreversible data loss on a single mis-tap, with no
undo. Cheap to fix, high cost when missing — pairs naturally with User
Story 1 as the other session-safety fix in this batch.

**Independent Test**: Start a session, log two sets, tap "Discard session"
from any of its three entry points (mid-session, post-completion screen,
dashboard prompt) → a confirmation prompt appears before anything is
deleted → cancel it → the session and its logged sets still exist.

**Acceptance Scenarios**:

1. **Given** any "Discard session" entry point (mid-session button,
   post-completion `FinishDiscardActions`, dashboard active-session prompt),
   **When** the user taps it, **Then** a confirmation prompt appears before
   the session is discarded.
2. **Given** the confirmation prompt, **When** the user confirms, **Then**
   the session is discarded exactly as it is today (same end state, just
   gated behind confirmation).
3. **Given** the confirmation prompt, **When** the user cancels or dismisses
   it, **Then** the session and its logged sets are unchanged and the user
   remains where they were.

---

### User Story 3 - Keyboard never covers the field or button being used (Priority: P2)

A user typing into a text field — signing in, signing up, resetting a
password, naming a workout, editing their profile, or logging a set's reps
and weight — can currently have the on-screen keyboard cover the field
itself or the primary action button below it (e.g. "Log set," "Sign in,"
"Save workout"), forcing them to dismiss the keyboard blind or scroll
awkwardly to find the button they need.

**Why this priority**: A real usability blocker on small devices for some of
the highest-frequency interactions in the app (logging a set, signing in),
but not a correctness/data-loss issue like Stories 1-2.

**Independent Test**: On a device/simulator with a small screen, open each
of: sign-in, sign-up, forgot-password, workout builder (name field), profile
edit, and the active session's set-log editor. Focus the last text field on
screen and confirm the field and the primary action button below it remain
visible (or scrollable into view) above the keyboard rather than hidden
behind it.

**Acceptance Scenarios**:

1. **Given** any screen with a text input (sign-in, sign-up, forgot
   password, workout builder name field, profile form, session set-log
   editor), **When** the on-screen keyboard opens, **Then** the focused
   input and the nearest primary action button remain visible or reachable
   by scroll, not permanently hidden behind the keyboard.
2. **Given** the keyboard is open and covering part of the screen, **When**
   the user dismisses it (submits, taps away, or taps back), **Then** the
   layout returns to its normal, non-shifted state.

---

### User Story 4 - Screen content respects device safe areas (Priority: P2)

A user on a device with a notch, punch-hole camera, or home-indicator gesture
bar currently has every screen's content laid out as a plain full-bleed view
with no awareness of these system insets, since the app relies only on the
navigation header for top spacing and nothing for the bottom. Content near
the top or bottom edge (e.g. the last button on a scrollable form, or content
right under the status bar on screens without a header) should stay clear of
these system areas.

**Why this priority**: A real visual-polish gap that affects every screen on
notched/gesture-bar devices, but it's cosmetic — nothing is broken or lost,
unlike Stories 1-2, and it's less immediately blocking than Story 3's
keyboard overlap.

**Independent Test**: On a device/simulator with a notch and a
gesture-navigation home indicator, open the dashboard, a scrollable form
(workout builder), and the active session screen. Confirm no interactive
content (buttons, inputs) renders underneath the status bar/notch area or the
home-indicator area.

**Acceptance Scenarios**:

1. **Given** a device with a notch/punch-hole and a bottom home-indicator
   inset, **When** any app screen is displayed, **Then** interactive content
   does not render underneath those system areas.
2. **Given** a device with no notch and standard bottom navigation (no
   gesture bar), **When** any app screen is displayed, **Then** layout looks
   the same as before — this story must not introduce dead/blank padding on
   devices without special insets.

---

### User Story 5 - Workout builder: "Add exercise" above "Save workout" (Priority: P3)

While building or editing a workout, the "Save workout" (or "Update
workout") button and the "+ Add exercise" button are both full-width blocks
stacked at the bottom of the form. Today "Save workout" renders above "Add
exercise"; it should be the other way around, with "Save workout" as the
final, bottom-most action.

**Why this priority**: Small, self-contained visual reorder with no
behavior change — lowest risk, lowest impact item in this batch.

**Independent Test**: Open the workout builder (new or edit), scroll to the
bottom of the form → "+ Add exercise" appears above "Save workout" (or
"Update workout"), with "Save workout" as the last element on the screen.

**Acceptance Scenarios**:

1. **Given** the workout builder screen (create or edit), **Then** the "+
   Add exercise" button renders above the "Save workout"/"Update workout"
   button, with "Save workout" as the bottom-most element of the form.
2. **Given** the reordered layout, **When** the user taps either button,
   **Then** both behave exactly as they do today — this is a layout-only
   change.

---

### Edge Cases

- What happens if a user leaves an active session (triggering auto-pause,
  User Story 1) and then immediately also has "End workout" or "Discard
  session" in flight? The explicit end/discard action MUST take precedence —
  auto-pause only applies when the screen is left without going through
  either.
- What happens if a paused session (User Story 1) is left paused for a very
  long time (days) before being resumed? Resuming MUST still work; this spec
  does not require any auto-discard/expiry of long-paused sessions.
- What happens when a user cancels the discard confirmation (User Story 2)
  and then taps "Discard session" again right away? It MUST show the
  confirmation again every time — no "don't ask again" bypass in this phase.
- What happens on a device where the keyboard covers a field with no scroll
  container at all (e.g. a fixed-height row)? The affected screen MUST gain
  enough scroll/shift behavior for the field and its nearest button to
  become reachable (User Story 3).
- What happens on tablets/foldables with unusual safe-area insets? Layouts
  MUST use the platform-reported inset values rather than hardcoded pixel
  assumptions, so they adapt automatically (User Story 4).
- What happens when the device is offline while a pause transition (User
  Story 1) or a discard confirmation (User Story 2) is being saved? A clear
  "can't reach the server" state MUST appear, consistent with the rest of
  the app (constitution Principle II), and the local UI state MUST NOT claim
  success until the write is confirmed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The active session screen MUST detect when the user leaves it
  via header back, hardware back, or swipe-back gesture (as opposed to
  "End workout" or "Discard session") and transition the session from active
  to paused, stopping its elapsed and rest timers at the moment of leaving.
- **FR-002**: Resuming a paused session MUST transition it back to active and
  continue its elapsed/rest timers from their paused values — time spent
  away while paused MUST NOT be counted as workout or rest time.
- **FR-003**: Every "Discard session" entry point (mid-session button,
  post-completion `FinishDiscardActions`, and the dashboard's active-session
  prompt) MUST require an explicit confirmation step before the session and
  its logged sets are deleted.
- **FR-004**: Declining/canceling the discard confirmation MUST leave the
  session and its logged sets completely unchanged.
- **FR-005**: Screens containing a text input MUST keep the focused input and
  its nearest primary action button visible or reachable by scroll while the
  on-screen keyboard is open, covering at minimum: sign-in, sign-up,
  forgot-password, the workout builder's name field, the profile form, and
  the active session's set-log editor.
- **FR-006**: All app screens MUST lay out their content with awareness of
  device safe-area insets (notch/status bar at the top, home-indicator/
  gesture-bar at the bottom), so interactive content never renders
  underneath those system areas.
- **FR-007**: Safe-area handling MUST use platform-reported inset values
  (not hardcoded padding) and MUST NOT add visible extra padding on devices
  that report zero/standard insets.
- **FR-008**: The workout builder's "+ Add exercise" button MUST render
  above the "Save workout"/"Update workout" button, with "Save workout" as
  the bottom-most element of the form, with no change to either button's
  existing tap behavior.

### Key Entities

- **WorkoutSession.status**: Existing attribute (`active` | `completed` |
  `discarded`); extended with a new `paused` state reached only from
  `active` (via leaving the screen, FR-001) and reversible back to `active`
  (via resuming, FR-002). `completed` and `discarded` remain terminal,
  reachable from either `active` or `paused`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A session left via back-navigation (not an explicit end/
  discard action) shows the same elapsed time when resumed minutes later as
  it showed at the moment it was left — zero unattended time counted.
- **SC-002**: 100% of "Discard session" taps across all three entry points
  require a confirmation before any data is deleted; canceling never loses
  data.
- **SC-003**: On a small-screen device, the primary action button on every
  form screen listed in FR-005 remains visible or scrollable into view while
  the keyboard is open.
- **SC-004**: On a notched/gesture-bar device, no interactive control on any
  screen renders under the status bar, notch, or home-indicator area; on a
  standard device, layouts are visually unchanged from before this feature.
- **SC-005**: In the workout builder, "+ Add exercise" is visually above
  "Save workout" on 100% of create and edit sessions, with no behavior
  regression on either button.

## Assumptions

- TrainingBuddy targets beginners who need simple workout logging more than
  advanced training analytics.
- "Paused" is a new, minimal session state whose only purpose is to freeze
  elapsed/rest timers when a session is left without an explicit end/discard
  action; it introduces no new user-facing pause/resume *button* beyond the
  existing "Resume" entry point already on the dashboard for active
  sessions.
- Discard confirmation uses a native `Alert.alert`-style confirm (consistent
  with existing patterns like the "End workout early" confirm card from spec
  007) rather than a new custom modal component.
- Keyboard-avoidance and safe-area handling are applied via standard React
  Native/Expo primitives (`KeyboardAvoidingView`, `react-native-safe-area-
  context`, already an installed transitive dependency) rather than manual
  per-screen offset math.
- This phase is additive to specs 001-008 and does not amend the
  constitution.
