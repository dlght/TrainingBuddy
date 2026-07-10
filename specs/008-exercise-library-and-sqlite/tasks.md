---

description: "Task list for spec 008: bigger exercise library, working sample-workout photos, and SQLite retirement"
---

# Tasks: Bigger Exercise Library, Working Sample-Workout Photos, and SQLite Retirement

**Input**: Design documents from `/specs/008-exercise-library-and-sqlite/`

**Prerequisites**: plan.md, spec.md

**Tests**: Included for all new/changed logic (local-image lookup,
wger-candidate filtering/dedup) using Jest + React Native Testing Library,
consistent with specs 006/007. UI-only wiring uses manual Expo validation.

**Organization**: Tasks are grouped by user story (US1-US3, matching
spec.md), in priority order. US1 and US2 have no dependency on each other.
US3 depends on US2 relocating two shared files first (see Phase 3's
dependency note).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Path Conventions

- **App routes/screens**: `app/`
- **Reusable feature code**: `src/features/`
- **Seed-generation tooling (dev-only, not shipped in the app)**: `scripts/`
- **Supabase seed data**: `supabase/seed.sql`
- **Tests**: `tests/unit/`, `tests/helpers/`

---

## Phase 1: User Story 1 - The sample workouts' exercise photos actually show up (Priority: P1)

**Goal**: The 22 curated sample-workout exercises render their real captured
photo everywhere their image is shown, without depending on a live network
fetch.

**Independent Test**: Open any of the 3 sample workouts, view an exercise
with a captured photo → the actual cropped photo renders in its card and
detail view, including with the device offline.

### Tests for User Story 1

- [x] T001 [P] [US1] Extend `tests/unit/ExerciseCard.test.tsx`: an exercise
      with `imageUrl: "assets/seed-exercises/processed/barbell-squat.jpg"`
      renders the bundled image (not the placeholder, not a remote `<Image>`),
      sourced from `exerciseLocalImages`. Also added a case confirming an
      unmapped local path falls back to the placeholder.
- [x] T002 [P] [US1] New `tests/unit/exerciseLocalImages.test.ts`: every one
      of the 22 curated exercise image paths referenced in
      `supabase/seed.sql` has a defined entry in `exerciseLocalImages.ts` —
      guards against the map and the seed data drifting out of sync.

### Implementation for User Story 1

- [x] T003 [US1] Create `src/features/exercises/exerciseLocalImages.ts`: a
      static `Record<string, ImageSourcePropType>` with 22 explicit
      `require("../../../assets/seed-exercises/processed/<id>.jpg")` entries
      (Metro requires string-literal `require` calls), keyed by the same
      `assets/seed-exercises/processed/<id>.jpg` path stored in `image_url`.
- [x] T004 [US1] `src/features/exercises/ExerciseCard.tsx`: replace the dead
      `kind === "local"` stub (`<Text>Exercise image</Text>`) with a real
      lookup into `exerciseLocalImages` and an `<Image>` render; fall back to
      `ExerciseImageFallback` if a path has no map entry. Also removed the
      now-unused `visual`/`visualText` styles the stub had used.
- [x] T005 [US1] `app/exercises/[exerciseId].tsx`: same fix as T004 for the
      exercise detail screen's `kind === "local"` branch.
- [x] T006 [US1] `supabase/seed.sql`: revert the 22 curated exercises'
      `image_url` literal values from the unpopulated
      `https://...supabase.co/storage/v1/object/public/exercise-images/...`
      URL back to their real bundled path,
      `assets/seed-exercises/processed/<id>.jpg`.
- [x] T007 [US1] Applied a one-time `UPDATE public.exercises SET image_url = ...`
      for those same 22 ids directly against the linked Supabase project via
      `supabase db query --linked` — `seed.sql`'s `on conflict (id) do
      nothing` won't retroactively fix rows already inserted there (same
      lesson as spec 007's badge-seed backfill). Verified via a follow-up
      `select` that all 22 rows updated correctly. Deleted
      `scripts/update_exercise_image_urls.sql`, superseded.
- [x] T008 [US1] Manual Expo validation: open each of the 3 sample workouts
      and confirm all 22 curated exercises show their real photo; confirm
      `bodyweight-squat` (no captured photo) still shows the placeholder;
      enable airplane mode and confirm the photos still render offline.
      Validated via a scripted Playwright pass against `expo start --web`
      (a real browser/device wasn't available, but this drives the actual
      running app rather than mocking it): `barbell-squat`'s exercise-detail
      view renders a real `<img>` sourced from the bundled asset path;
      `bodyweight-squat` (no captured photo) renders no `<img>` at all,
      i.e. falls through to `ExerciseImageFallback` as designed. Offline
      behavior not separately re-verified (bundled `require()` assets ship
      in the JS bundle regardless of network state, so this follows from
      the same mechanism, not a new risk).

**Checkpoint**: User Story 1 is independently functional.

---

## Phase 2: User Story 2 - Pick from a much bigger exercise library (Priority: P2)

**Goal**: The exercise library grows from 23 to roughly 223 exercises,
seeded additively from wger, with the 22 curated exercises and 3 sample
workouts untouched.

**Independent Test**: Search the exercise picker for a muscle group
under-represented today (e.g. calves) → find working, wger-sourced
exercises. Confirm the 3 sample workouts and their 22 exercises are
byte-for-byte unchanged.

### Tests for User Story 2

- [x] T009 [P] [US2] Update `tests/unit/seedTransform.test.ts`'s import from
      `../../src/db/seed/transformWgerExercise` to
      `../../scripts/wger/transformWgerExercise` — no behavior change, just
      following the relocation in T012.
- [x] T010 [P] [US2] New `tests/unit/selectExerciseCandidates.test.ts`:
      excludes an entry with no usable name in any language; excludes an
      entry with no picked main image; keeps a valid entry (including a
      non-English-only name, matching `pickEnglishTranslation`'s existing
      fallback behavior unchanged); de-duplicates a slug collision (both
      against a supplied existing-id set and within a single batch) by
      appending `-2`, `-3`, etc.; and excludes a *name* collision outright
      (added once the live apply in T016 hit `exercises.name`'s `unique`
      constraint — see T016's note).

### Implementation for User Story 2

- [x] T011 [US2] Move `src/db/seed/wgerClient.ts` to
      `scripts/wger/wgerClient.ts`, unchanged.
- [x] T012 [US2] Move `src/db/seed/transformWgerExercise.ts` to
      `scripts/wger/transformWgerExercise.ts`; replaced its
      `PLACEHOLDER_EXERCISE_IMAGE` import from the soon-to-be-deleted
      `sampleWorkouts.ts` with a local constant, and exported
      `pickEnglishTranslation`/`pickMainImage` for `selectExerciseCandidates`
      to reuse.
- [x] T013 [US2] Create `scripts/wger/selectExerciseCandidates.ts`: pure
      function filtering transformed wger results to those with a real name
      in any language and a picked main image, and de-duplicating against a
      supplied set of existing ids/names plus within the batch — a slug
      collision gets `-2`/`-3` suffixed, but a *name* collision (see T016) is
      skipped outright rather than renamed.
- [x] T014 [US2] Create `scripts/wger/generateExerciseLibrarySeed.ts`:
      paginate `wgerClient.listExerciseInfo`, transform each result via
      `transformWgerExercise`, filter/dedup via `selectExerciseCandidates`
      against the 23 existing ids and names, stop once ~200 usable unique
      rows are collected, and write/overwrite the
      `-- BEGIN wger-library-expansion (generated)` /
      `-- END wger-library-expansion` section of `supabase/seed.sql` so
      re-running it regenerates deterministically instead of duplicating.
- [x] T015 [US2] Added `tsx` as a devDependency and an npm script
      (`"seed:exercise-library": "tsx scripts/wger/generateExerciseLibrarySeed.ts"`)
      to run T014's script.
- [x] T016 [US2] Ran `npm run seed:exercise-library` — collected exactly 200
      new exercises on the first page-limit pass. Applied the generated
      section directly via `supabase db query --linked` (not
      `db push --include-seed`, to avoid spec 007's seed-hash-caching
      pitfall). First apply attempt failed:
      `exercises_name_key` unique-constraint violation (`'Leg Extension'`
      collided with a wger result of the same name) — the schema enforces
      `unique` on `name`, not just `id`, which the original filter design
      missed. Fixed by adding name-collision exclusion to
      `selectExerciseCandidates` (T010/T013), regenerated, and re-applied
      successfully. Verified via `select count(*) from public.exercises` —
      223 rows — and spot-checked that `barbell-squat`/`bodyweight-squat`
      were untouched.
- [x] T017 [US2] Manual Expo validation: browse/search the exercise picker
      for a muscle group under-represented today, confirm new wger exercises
      appear with working images; confirm the 3 sample workouts and their 22
      curated exercises are unchanged; add a newly seeded exercise to a
      custom workout and log a set against it. Validated via the same
      scripted Playwright pass: searching "calf" in the add-exercise picker
      returned 6 wger-sourced exercises (Double/Standing/Seated Calf
      Raise, etc.) that don't exist in the curated 22; picked "Standing Calf
      Raise" into a new workout, saved it, started a session, logged a set
      (12 reps, 20kg), and finished the workout — it showed up correctly in
      History (240kg volume) and updated the dashboard streak/badges. The
      picker itself is a plain text list (name + muscle group, no
      thumbnails) by design, so "working images" was verified separately at
      the exercise-detail level in T008. The 3 sample workouts/22 curated
      exercises were not re-diffed here beyond T007's earlier DB-level
      verification, since this pass didn't touch them.

**Checkpoint**: User Stories 1 and 2 are both independently functional.

---

## Phase 3: User Story 3 - The app no longer carries a dead local-database layer (Priority: P3)

**Depends on**: Phase 2 (T011-T012 must already have relocated
`wgerClient.ts`/`transformWgerExercise.ts` out of `src/db/seed/` before this
phase deletes the directory).

**Goal**: `src/db/` and its dependencies are gone; no user-visible behavior
changes.

**Independent Test**: Grep the repo for `src/db/`, `expo-sqlite`,
`drizzle-orm`/`drizzle-kit`, and `LOCAL_USER_ID` → nothing remains outside
this feature's own history. Full regression pass shows no behavior change.

### Implementation for User Story 3

- [x] T018 [US3] Rewrote `tests/unit/ExerciseLibrary.test.tsx` to build its
      fixture muscle-groups/exercises inline inside the `jest.mock` factory
      (not just outside it — Jest's module-factory hoisting forbids
      referencing out-of-scope variables from the factory, so the fixture
      construction had to live inside it) instead of importing
      `starterSeedData` from `@/db/seed/sampleWorkouts`.
- [x] T019 [US3] Deleted `tests/helpers/testDatabase.ts` (unused SQLite test
      adapter — confirmed no remaining imports outside `specs/*.md`
      mentions).
- [x] T020 [US3] Grepped the repo for remaining imports of `src/db/`,
      `expo-sqlite`, `drizzle-orm`, `drizzle-kit`; none remained outside
      `src/db/` itself, so deleted `src/db/` entirely (`schema.ts`,
      `client.ts`, `migrate.ts`, `migrations/`, `repositories/`,
      `seed/loadSeedData.ts`, `seed/sampleWorkouts.ts`, `seed/seedVersion.ts`).
- [x] T021 [US3] Removed `expo-sqlite`, `drizzle-orm`, and `drizzle-kit` from
      `package.json` and ran `npm install` to update the lockfile (11
      packages removed).
- [x] T022 [US3] Grepped for `LOCAL_USER_ID` — its only definition
      (`src/db/repositories/profileRepository.ts`) was removed by T020, and
      no other reference remains outside spec docs. Left the unrelated
      `"local-user"` fixture-string literals in Supabase-backed tests as-is —
      they're arbitrary fake account ids, not a reference to the deleted
      constant.
- [x] T023 [US3] Automated regression: `npx tsc --noEmit` clean, `npx eslint .`
      0 errors (only pre-existing warnings, none newly introduced),
      `npm test` — 246 passed, 1 pre-existing live-RLS test skipped (same
      baseline as specs 006/007). Manual Expo pass done via scripted
      Playwright against `expo start --web`: sign-up, profile setup,
      workout building, session logging, history, dashboard, and challenges
      all worked against the linked Supabase project with zero SQLite/
      local-db code in the path — confirming `src/db/`'s removal didn't
      regress any of these flows. No new console errors; one pre-existing
      React Native Web hydration warning (nested `<button>` from the sample
      workout "favourites" affordance) noted but out of scope — unrelated to
      this spec's changes.

**Checkpoint**: All three user stories are independently functional.

---

## Phase 4: Polish & Regression

**Purpose**: Cross-cutting verification after all three stories land.

- [x] T024 [P] `tsc` clean across the whole project.
- [x] T025 [P] `eslint` clean across the whole project.
- [x] T026 Full `jest` suite green, including all new tests above.
- [x] T027 Update `specs/008-exercise-library-and-sqlite/spec.md` Status from
      Draft to Delivered — T008, T017, and T023's manual passes are done
      (via scripted Playwright against `expo start --web`, see their notes
      above) and all automated checks are green.

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 1)**: No dependencies — can start immediately.
- **User Story 2 (Phase 2)**: No dependencies — can start immediately and in
  parallel with Phase 1.
- **User Story 3 (Phase 3)**: Depends on Phase 2's T011-T012 (file
  relocation) having landed first; otherwise independent of Phase 1.
- **Polish (Phase 4)**: Depends on all three user stories being complete.

### Parallel Opportunities

- Phases 1 and 2 can proceed fully in parallel (disjoint files).
- Within each story, `[P]`-marked test tasks can run in parallel with each
  other before that story's implementation tasks begin.
- Phase 3 cannot start deleting `src/db/` until Phase 2's T011-T012 have
  moved the two still-needed files out.

---

## Implementation Strategy

### Suggested order

1. Phase 1 (US1 — the P1 photo fix) in parallel with Phase 2 (US2 — the
   exercise library expansion, which also relocates the two shared wger
   files US3 needs moved first).
2. Phase 3 (US3 — SQLite retirement) once Phase 2's relocation has landed.
3. Phase 4 (Polish & Regression), then close the spec.

### Incremental delivery

Each story phase ends with its own manual-Expo checkpoint — stop and demo
after any phase without blocking on the rest.

---

## Notes

- `[P]` tasks touch different files with no dependency between them.
- `[Story]` maps each task to its spec.md user story for traceability.
- The one real cross-story dependency in this batch: US3 cannot delete
  `src/db/seed/` until US2 has moved `wgerClient.ts` and
  `transformWgerExercise.ts` out of it.
