# Feature Specification: Accounts and Cloud Backend

**Feature Branch**: `006-accounts-and-cloud-backend`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "phase 6 would be - making the app more
productionalized -> move db to supabase, add backend to work for parallel
users, add accounts so users can actually log in to the application. i still
want to use expo go - dont want to pay apple 100$ a year to deploy my free
app."

Follow-up decisions (confirmed by user):
- Offline behavior: **online-only**. Local SQLite is retired; every read/write
  goes straight to Supabase. No offline queue, no background sync engine.
- Sign-in method: **email + password** only for this phase (no magic link, no
  OAuth).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create an account and sign in (Priority: P1)

A user opens the app, is asked to sign up or sign in with an email and
password, and — once authenticated — lands on their own dashboard. Their
session survives closing and reopening the app.

**Why this priority**: Nothing else in this phase works without an
authenticated identity. This is the foundational unlock for every other
story.

**Independent Test**: Fresh install → sign up with a new email/password →
land on an empty dashboard. Force-quit and reopen the app → still signed in,
no re-entry of credentials.

**Acceptance Scenarios**:

1. **Given** a new user on the sign-in screen, **When** they enter a valid
   email + password and choose "Create account", **Then** an account is
   created in Supabase Auth and they land on the app's dashboard, signed in.
2. **Given** an existing account, **When** they enter the correct
   credentials, **Then** they are signed in and routed to the dashboard.
3. **Given** an existing account, **When** they enter an incorrect password,
   **Then** a clear inline error appears and they remain on the sign-in
   screen.
4. **Given** a signed-in user, **When** they force-quit and reopen the app,
   **Then** they remain signed in without re-entering credentials.
5. **Given** a signed-in user, **When** they tap "Sign out", **Then** their
   session is cleared and they are returned to the sign-in screen.

---

### User Story 2 - My data lives in the cloud, and only I can see it (Priority: P1)

Every screen that today reads or writes local SQLite (workouts, sessions, set
logs, streaks, history, dashboard stats, profile) instead reads and writes
Supabase. One account can never see another account's data, even on the same
device.

**Why this priority**: This is the actual "backend for parallel users" ask —
without it, accounts are cosmetic decoration on top of a still-local app.

**Independent Test**: Sign in as user A, log a workout. Sign out, sign in as
user B on the same device. B's dashboard and history are empty; nothing of
A's is visible or reachable by B.

**Acceptance Scenarios**:

1. **Given** user A has logged a session, **When** user B signs in on the
   same device, **Then** B sees none of A's workouts, history, or streak.
2. **Given** a user has no network connection, **When** they try to load the
   dashboard or log a set, **Then** they see a clear "can't reach the
   server" state rather than a silent failure or stale data presented as
   current.
3. **Given** a user creates, edits, or deletes a workout, **When** they
   reload the app, **Then** the change is present — confirming the round
   trip actually went through Supabase and not local-only state.

---

### User Story 3 - Bring my existing local data with me (Priority: P2)

A user with pre-existing local-only data (created before this phase shipped)
can migrate it into their new cloud account instead of losing it on upgrade.

**Why this priority**: Without this, shipping this phase deletes whatever
history already exists on-device. It's P2, not P1, because it's a one-time
bridge rather than ongoing product value — new installs never see it.

**Independent Test**: Install the upgraded build on a device with existing
local SQLite data → sign up → get offered an import → local workouts,
sessions, and profile appear under the new account in Supabase.

**Acceptance Scenarios**:

1. **Given** local SQLite data exists on first launch of the upgraded app,
   **When** the user finishes sign-up, **Then** they are offered a one-time
   "Import your existing workouts" action.
2. **Given** the user accepts the import, **When** it runs, **Then** their
   local workouts, sessions, set logs, and profile are copied into Supabase
   under their new account id.
3. **Given** the user declines, or the device has no local data, **When**
   they proceed, **Then** they land on a normal empty state and are never
   shown the import prompt again.

---

### User Story 4 - Account basics (Priority: P3)

From a profile/settings screen, a signed-in user can see which email they're
signed in as, sign out, and reset a forgotten password.

**Why this priority**: Table-stakes account hygiene; doesn't block the core
logging value delivered by US1/US2.

**Independent Test**: From the profile screen, confirm the signed-in email is
visible, sign-out works, and "Forgot password" sends a reset email.

**Acceptance Scenarios**:

1. **Given** a signed-in user on the profile screen, **Then** their email is
   visible.
2. **Given** a user forgot their password, **When** they tap "Forgot
   password" on the sign-in screen and submit their email, **Then** Supabase
   sends a reset email and the user can set a new password and sign in with
   it.

---

### Edge Cases

- What happens when the network drops mid-write (e.g., mid set-log during a
  workout)? The set MUST NOT be silently discarded — the user MUST see an
  explicit failed/retry state and be able to retry without losing what they
  typed.
- What happens when a Supabase session token expires while the app is open?
  The user MUST be dropped back to sign-in with their in-progress screen
  state discarded gracefully (no crash), not stuck on a screen issuing
  silently-failing requests.
- What happens when sign-up is attempted with an email that's already
  registered? A clear inline error MUST be shown; no duplicate account is
  created.
- What happens when two devices are signed into the same account and both
  write around the same time? Last write wins at the database level — no
  client-side conflict resolution is required since there is no offline
  queue.
- What happens to a device's pre-upgrade local "local-user" profile if the
  person never signs up? It remains untouched on-device but is unreachable
  from the app until they sign in; it is only ever used as the source for the
  one-time import in User Story 3.
- What happens when a user tries to query or mutate a row that isn't theirs
  (e.g. a guessed/replayed id)? Row Level Security MUST reject it at the
  database level regardless of what the client sends.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST require an authenticated Supabase session before
  any workout, session, history, or dashboard screen is reachable;
  unauthenticated users MUST be routed to sign-in.
- **FR-002**: System MUST support account creation and sign-in via email +
  password using Supabase Auth.
- **FR-003**: System MUST persist the auth session across app restarts using
  Expo-Go-compatible storage, so users are not forced to re-authenticate
  every launch.
- **FR-004**: System MUST provide a sign-out action that clears the local
  session.
- **FR-005**: System MUST provide password-reset via email.
- **FR-006**: All workout, session, set-log, streak, and profile data MUST be
  persisted in Supabase Postgres rather than local SQLite.
- **FR-007**: Every user-scoped table MUST enforce Row Level Security so a
  user can only read or write their own rows (`auth.uid() = user_id`).
- **FR-008**: Global reference data (exercises, muscle groups) MUST remain
  readable by all authenticated users and MUST NOT be user-scoped.
- **FR-009**: System MUST surface a distinct "offline / can't reach server"
  state on any screen that fails to load or save due to connectivity,
  instead of failing silently or presenting stale data as current.
- **FR-010**: System MUST offer a one-time import of any pre-existing local
  SQLite data into the signed-in user's Supabase account on their first
  sign-up after this phase ships.
- **FR-011**: System MUST NOT require an Apple Developer Program account or
  an EAS custom dev client — the app MUST keep running unmodified inside
  standard Expo Go.
- **FR-012**: The existing exercise-library seed data MUST be migrated into
  Supabase once, so all accounts share the same reference exercise catalog.

### Key Entities

- **Account**: Supabase `auth.users` row plus a `public.profiles` row keyed
  by the same id (email, display name, bodyweight, weight unit, experience
  level, goal) — replaces today's single hardcoded local-user row.
- **Workout / WorkoutExercise / WorkoutExerciseSetPlan / WorkoutSession /
  SetLog**: same shapes as today's SQLite schema, ported to Postgres; each
  user-owned row scoped by `user_id = auth.uid()`.
- **Exercise / MuscleGroup**: global reference data, not user-scoped, shared
  read-only across all accounts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can sign up and reach an empty dashboard in under 60
  seconds.
- **SC-002**: Two different accounts on the same device never see each
  other's data — verified by an automated test that exercises RLS with two
  distinct auth contexts.
- **SC-003**: The app runs entirely inside standard Expo Go with zero custom
  native modules added.
- **SC-004**: Every existing manual QA flow (create workout, log a session,
  view history, dashboard streak) works end-to-end against Supabase instead
  of local SQLite.
- **SC-005**: A user with pre-upgrade local data does not lose it — it is
  importable into their new account via User Story 3.

## Assumptions

- Online-only for this phase: core flows require network access; offline
  behavior is limited to a clear "you're offline" error state (explicit user
  decision — see Input above).
- Email + password is the only auth method for this phase; social/OAuth
  sign-in is out of scope.
- A single Supabase project is sufficient for now; a separate staging
  environment is not required by this spec.
- No custom backend server beyond Supabase (Postgres + Auth + RLS +
  PostgREST) is required to satisfy "parallel users" at this app's scale.
- Exercise images remain bundled/local assets for now; moving them to
  Supabase Storage is out of scope unless requested separately.
- This phase amends constitution principles II and III (offline-first local
  ownership, SQLite-only stack) — see constitution v2.0.0.
