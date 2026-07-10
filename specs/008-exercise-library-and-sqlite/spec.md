# Feature Specification: Bigger Exercise Library, Working Sample-Workout Photos, and SQLite Retirement

**Feature Branch**: `008-exercise-library-and-sqlite`

**Created**: 2026-07-10

**Status**: Delivered

**Input**: User description: "1) retire the legacy SQLite persistence layer
(deferred from spec 006 Phase 7). 2) expand the exercise bank with the top
200 exercises available online (via wger), seeded alongside the existing
library — without removing or altering the 22 exercises used by the 3 sample
workouts. 3) the custom photos uploaded for those 22 sample-workout exercises
aren't showing up anywhere in the app."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The sample workouts' exercise photos actually show up (Priority: P1)

A user opens a sample workout (or its exercise list) and sees the specific
photo captured for that exercise (e.g. the actual incline dumbbell press
setup), not a blank image or the generic placeholder.

**Why this priority**: These photos were already shot, cropped, and pointed
at from `exercises.image_url` in the last session's work — but the pipeline
was left half-finished (the images were cropped locally and never uploaded
anywhere reachable), so every one of the 22 sample-workout exercises is
currently showing a broken image. This is a regression sitting in already-
uncommitted work, not a net-new feature, so it's the smallest, most urgent
fix in this batch.

**Independent Test**: Open any of the 3 sample workouts, view an exercise
that has a captured photo (e.g. Barbell Squat) → the actual cropped photo
renders, both in the exercise card and the exercise detail view. Go fully
offline → the photo still renders (it does not depend on a live network
fetch).

**Acceptance Scenarios**:

1. **Given** any of the 22 sample-workout exercises with a captured photo,
   **When** it's shown in a workout's exercise list, its card, or its detail
   view, **Then** the actual captured/cropped photo renders — never a blank
   image, a broken-image icon, or the generic placeholder.
2. **Given** the one sample-workout exercise with no captured photo
   (`bodyweight-squat`, a warmup), **Then** it continues to show the existing
   placeholder, unchanged.
3. **Given** the device is offline, **When** a user views a sample-workout
   exercise with a captured photo, **Then** the photo still renders (it ships
   with the app rather than depending on a live remote fetch).

---

### User Story 2 - Pick from a much bigger exercise library when building a workout (Priority: P2)

While building or editing a workout, a user searching the exercise picker
finds far more exercises than the current 23 — roughly 200, pulled from
wger's public exercise database — each with the muscle group, equipment, and
image wger already provides.

**Why this priority**: More exercise variety is real ongoing value for
workout building, but it's additive and doesn't block or fix anything that's
currently broken — it lands after the P1 photo fix.

**Independent Test**: Open the exercise picker, search or filter by a muscle
group not well represented today (e.g. calves, forearms) → find multiple new
wger-sourced exercises with working images. Confirm the 3 existing sample
workouts and their 22 curated exercises are byte-for-byte unchanged.

**Acceptance Scenarios**:

1. **Given** the exercise library, **When** a user browses or searches it,
   **Then** roughly 200 exercises are available (existing 22 curated
   exercises + `bodyweight-squat` + newly seeded wger exercises), each with a
   name, muscle group, equipment, and image.
2. **Given** the 22 curated sample-workout exercises and the 3 sample
   workouts that reference them, **When** the new wger exercises are seeded,
   **Then** none of the curated exercises' ids, fields, or workout references
   change.
3. **Given** a newly seeded wger exercise, **When** a user adds it to their
   own custom workout, **Then** it behaves identically to any existing
   exercise (loggable sets, appears in history, etc.) — no second-class
   exercise type.
4. **Given** a wger source exercise that's missing a usable name, muscle
   group mapping, or image, **Then** it is excluded from the seed rather than
   imported with blank/incorrect data.

---

### User Story 3 - The app no longer carries a dead local-database layer (Priority: P3)

No user-visible change — internally, the app has run entirely on Supabase
since spec 006 shipped. This story removes the now-unused SQLite/Drizzle
code, dependencies, and any lingering `LOCAL_USER_ID`-style references still
sitting in the codebase, per spec 006's originally-deferred Phase 7.

**Why this priority**: Pure cleanup/risk-reduction (dead code can bit-rot,
confuse future changes, and is a lingering dependency-security surface) with
zero end-user-visible benefit, so it's lowest priority — safe to land last or
independently at any point.

**Independent Test**: Grep the repo for `src/db/`, `expo-sqlite`,
`drizzle-orm`/`drizzle-kit`, and `LOCAL_USER_ID`/`"local-user"` → no
references remain outside of this feature's own history. Full regression
pass (`npm test`, `tsc`, `eslint`, a manual Expo pass through core flows)
shows no behavior change.

**Acceptance Scenarios**:

1. **Given** the codebase after this story, **When** searched for `src/db/`
   imports, `expo-sqlite`, `drizzle-orm`, `drizzle-kit`, or
   `LOCAL_USER_ID`/`"local-user"`, **Then** none remain.
2. **Given** `package.json`, **Then** `expo-sqlite`, `drizzle-orm`, and
   `drizzle-kit` are no longer listed as dependencies.
3. **Given** the full test suite and a manual Expo pass through sign-up,
   workout building, session logging, history, dashboard, and challenges,
   **Then** nothing regresses — this story is purely subtractive.

---

### Edge Cases

- What happens to a workout or session that references a curated exercise
  id while the new wger exercises are being seeded? Nothing — the seed is
  additive-only (`insert ... on conflict do nothing`), so existing ids/rows
  are never touched (User Story 2).
- What happens when two wger source exercises would map to the same
  generated id, or wger's data for one exercise changes between seed runs?
  The seed MUST be idempotent and MUST NOT overwrite an already-seeded row on
  re-run (matches the existing `on conflict do nothing` pattern already used
  for the 22 curated exercises).
- What happens when the device is offline and the user is browsing the
  larger (200-exercise) library? Exercises already loaded/cached render as
  today; wger-hosted images that haven't been fetched yet behave like any
  other remote image today (may not render until back online) — this is a
  pre-existing tradeoff of remote-hosted images, not a new regression, since
  it only applies to the net-new 200, not the 22 curated ones (User Story 1
  fixes that case specifically for the curated set).
- What happens to any code path still reading `src/db/` when it's deleted?
  None should exist by the time Phase (User Story 3) is implemented — the
  task explicitly greps for and removes remaining references first.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The 22 curated sample-workout exercises' captured photos MUST
  render correctly wherever that exercise's image is shown, without
  depending on a live network fetch (bundled with the app, not hosted
  remotely).
- **FR-002**: The one sample-workout exercise with no captured photo
  (`bodyweight-squat`) MUST continue to show the existing placeholder
  behavior, unchanged.
- **FR-003**: System MUST seed roughly 200 additional exercises sourced from
  wger's public exercise API, each with a name, mapped muscle group,
  equipment (when available), and image.
- **FR-004**: Seeding the additional wger exercises MUST NOT modify, remove,
  or reorder the 23 existing exercise rows (the 22 curated + `bodyweight-
  squat`) or the 3 existing sample workouts that reference them.
- **FR-005**: The exercise seed MUST be idempotent — re-running it MUST NOT
  duplicate or overwrite already-seeded rows (existing or newly added).
- **FR-006**: A wger source exercise MUST be excluded from the seed if it
  lacks a usable English name, a mappable muscle group, or an image.
- **FR-007**: Newly seeded wger exercises MUST behave identically to
  existing exercises in every part of the app (workout builder, session
  logging, history) — no separate code path or reduced feature set.
- **FR-008**: The codebase MUST NOT retain the legacy SQLite/Drizzle
  persistence layer (`src/db/` schema, migrations, repositories, client),
  the `expo-sqlite`/`drizzle-orm`/`drizzle-kit` dependencies, or
  `LOCAL_USER_ID`/`"local-user"` references, once this feature ships.
- **FR-009**: Removing the legacy SQLite layer MUST NOT change any existing
  user-visible behavior — verified by the full existing test suite plus a
  manual regression pass.

### Key Entities

- **Exercise**: Existing entity (`public.exercises`); this feature adds ~200
  new rows sourced from wger alongside the 23 that already exist, and fixes
  the `image_url` resolution path for the 22 curated ones so it no longer
  depends on an unpopulated remote storage bucket.
- **Exercise image**: For the 22 curated exercises, becomes a bundled app
  asset (already cropped, sitting in `assets/seed-exercises/processed/`)
  resolved locally rather than fetched from a URL. For newly seeded wger
  exercises, remains a remote URL (wger's own hosted image), same as the
  existing `resolveExerciseImage`'s `"remote"` case already handles.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 22 curated sample-workout exercises show their actual
  captured photo, including with the device offline.
- **SC-002**: The exercise library grows from 23 to roughly 223 exercises,
  searchable/filterable the same way as today.
- **SC-003**: The 3 existing sample workouts and their 22 referenced
  exercises are unchanged (same ids, same fields) after the new exercises are
  seeded.
- **SC-004**: Zero references to `src/db/`, `expo-sqlite`, `drizzle-orm`, or
  `drizzle-kit` remain in the codebase or `package.json`.
- **SC-005**: Full `tsc`/`eslint`/`jest` pass and a manual Expo regression
  pass show no behavior change from the SQLite removal.

## Assumptions

- TrainingBuddy targets beginners who need simple workout logging more than
  advanced training analytics.
- The 22 curated exercise photos are bundled directly into the app (static
  assets resolved via `require`) rather than uploaded to Supabase Storage —
  this avoids standing up and maintaining a storage bucket/CDN for a small,
  fixed set of images that already ship with the app today, and directly
  fixes the "never actually uploaded anywhere" root cause. The
  `resolveExerciseImage`/`ResolvedExerciseImage` "local" case already exists
  for this but isn't actually wired up to render an `Image` yet — this
  feature finishes that wiring rather than introducing a new pattern.
- The ~200 new exercises use wger's own hosted image URLs directly (the
  existing `"remote"` resolution path), not bundled — bundling ~200 images
  into the app binary is a meaningfully different size/maintenance tradeoff
  the user didn't ask for.
- "Top 200" means "up to ~200 usable wger exercises after filtering out
  entries with no English name, no mappable muscle group, or no image" —
  not a strict guarantee of exactly 200, since wger's data quality varies
  per entry.
- No production users currently have pre-cloud local SQLite data to migrate
  (the app has not shipped/been distributed with the old local-only
  persistence layer), so this feature does NOT build the local-data-import
  flow that was spec 006's Phase 5 — it only removes the now-dead code
  (spec 006's Phase 7). If that assumption is wrong, local data import
  should be its own follow-up spec rather than folded in here.
- This phase is additive to specs 001-007 and does not amend the
  constitution.
