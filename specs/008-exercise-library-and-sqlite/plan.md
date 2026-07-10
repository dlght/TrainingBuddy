# Implementation Plan: Bigger Exercise Library, Working Sample-Workout Photos, and SQLite Retirement

**Branch**: `008-exercise-library-and-sqlite` | **Date**: 2026-07-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-exercise-library-and-sqlite/spec.md`

## Summary

Three independent, additive changes: (1) fix the 22 curated sample-workout
exercise photos, which are currently broken because they were cropped
locally but never uploaded anywhere the app can reach — the fix is to bundle
them as static app assets instead of standing up cloud storage; (2) grow the
exercise library from 23 to roughly 223 exercises by finishing the
already-started wger-fetch pipeline from spec 001 (`wgerClient.ts` +
`transformWgerExercise.ts`), purely additive to `supabase/seed.sql`; (3)
delete the dead SQLite/Drizzle persistence layer (`src/db/`) that spec 006
replaced but never removed, per its originally-deferred Phase 7. No schema
change, no new Supabase table, no new app dependency.

## Technical Context

**Language/Version**: TypeScript (unchanged)

**Primary Dependencies**: Expo, React Native, `@supabase/supabase-js` —
unchanged. One new **dev-only** dependency, `tsx`, to run the one-off
wger-fetch script directly (`node` alone can't execute unmodified
TypeScript); it never ships in the app bundle.

**Storage**: Supabase Postgres — no schema change. `supabase/seed.sql` gains
~200 additional `exercises` rows (idempotent `on conflict do nothing`,
matching the existing pattern) and a one-time `UPDATE` corrects the 22
curated rows' `image_url` back to their bundled-asset path.

**Testing**: Jest unit tests for the new/changed pure logic (local-image
lookup, wger-candidate filtering/dedup); React Native Testing Library for
the `ExerciseCard`/exercise-detail rendering of bundled images; manual Expo
validation per story, consistent with specs 001-007.

**Target Platform**: Expo Go (iOS/Android/web), unmodified.

**Project Type**: mobile-app (unchanged)

**Performance Goals**: Unchanged. Growing the exercise table 10x doesn't
change any query shape — `exerciseLibraryService` already loads the full
table and groups client-side; ~223 rows is still trivial.

**Constraints**: No RLS change needed (`exercises` is already public-read,
no per-user scoping). Expo Go compatibility; no new native module; the new
`tsx`-run script is dev tooling, not app code.

**Scale/Scope**: Exercise reference data grows from 23 to ~223 rows; no
change to per-account data volume or shape.

## Constitution Check

*GATE: Must pass before task breakdown. Re-checked after design below.*
*Checked against constitution v2.0.0.*

- Beginner-first: Unaffected — no navigation or flow change; more exercises
  and working photos make the existing exercise picker more useful, not more
  complex.
- Cloud-backed, per-user data: Unaffected — `exercises` remains shared
  reference data (public-read, no client write policy), same as today; no
  new user-scoped table.
- Approved stack: Satisfied. The bundled-image fix uses only Expo/React
  Native's standard static-asset `require()` mechanism (no native module, no
  EAS dev client). The new `tsx` dependency is dev-only tooling to run a
  seed-generation script outside the app — it is not shipped in the Expo Go
  runtime, same category as the existing dev-only `drizzle-kit` it replaces.
- Simplicity: Satisfied — no new settings, no new screen, no new navigation.
  SQLite retirement is pure subtraction. The wger expansion reuses existing,
  already-tested transform logic rather than introducing a new ingestion
  concept.
- Testable increment: Each of the three user stories has its own Independent
  Test in spec.md; all three are independent of each other except for one
  ordering note (below) about where two shared files land.

## Project Structure

### Documentation (this feature)

```text
specs/008-exercise-library-and-sqlite/
|-- spec.md               # Feature spec
`-- plan.md                # This file
```

(No separate `research.md`/`data-model.md`/`contracts/` — same call as specs
006/007: nothing here is ambiguous enough to warrant a split.)

### Source Code (repository root)

```text
supabase/
`-- seed.sql                                    # gains ~200 exercise rows (marked section) + a
                                                 # one-time UPDATE fixing the 22 curated rows' image_url

scripts/
|-- crop_exercise_images.py                     # unchanged, already run
|-- update_exercise_image_urls.sql              # superseded by the local-path UPDATE below; removed
`-- wger/                                        # new home for the two files relocated out of src/db/seed/
    |-- wgerClient.ts                           # moved from src/db/seed/wgerClient.ts, unchanged
    |-- transformWgerExercise.ts                # moved from src/db/seed/transformWgerExercise.ts, unchanged
    |-- selectExerciseCandidates.ts             # new: filter (has English name + image) + dedup, pure/testable
    `-- generateExerciseLibrarySeed.ts          # new: paginate wger, transform, filter/dedup, write seed.sql section

src/
|-- features/exercises/
|   |-- exerciseLocalImages.ts                  # new: static require() map, the 22 curated ids -> bundled jpgs
|   |-- exerciseImageResolver.ts                 # unchanged (already has a "local" path-based kind)
|   |-- ExerciseCard.tsx                         # "local" branch now renders the real bundled Image
|   `-- ExerciseImageFallback.tsx                # unchanged
`-- db/                                          # deleted entirely (schema, client, migrate, repositories, seed/*)

app/
`-- exercises/[exerciseId].tsx                   # "local" branch now renders the real bundled Image

tests/
|-- unit/
|   |-- exerciseImageResolver.test.ts            # unchanged (existing cases already cover this design)
|   |-- ExerciseCard.test.tsx                     # + case: local path renders the bundled image
|   |-- exerciseLocalImages.test.ts               # new: every curated id resolves to a defined source
|   |-- seedTransform.test.ts                     # import path updated to scripts/wger/transformWgerExercise
|   |-- selectExerciseCandidates.test.ts          # new: filtering/dedup logic
|   `-- ExerciseLibrary.test.tsx                  # rewritten to use an inline fixture, not src/db/seed
`-- helpers/
    `-- testDatabase.ts                           # deleted (unused SQLite test adapter)

package.json                                      # removes expo-sqlite/drizzle-orm/drizzle-kit, adds tsx (dev)
```

**Structure Decision**: Keep the existing `features/exercises/*` seam;
`exerciseLocalImages.ts` slots in next to `exerciseImageResolver.ts` as a
small, self-contained lookup table, not a new abstraction layer.
`wgerClient.ts`/`transformWgerExercise.ts` move to `scripts/wger/` rather
than staying under `src/` because, post-SQLite-retirement, nothing at
runtime imports them — they are one-off seed-generation tooling, matching
where `crop_exercise_images.py` and `update_exercise_image_urls.sql` already
live.

## Design Decisions

1. **Bundled images use the resolver's existing `"local"` design as-is — no
   type change.** `exerciseImageResolver.ts` already distinguishes a
   bundled-asset path (`assets/seed-exercises/...`, no `http(s)://` prefix)
   from a remote URL, returning `{ kind: "local", path }`, and
   `exerciseImageResolver.test.ts` already asserts exactly this. The gap
   isn't the resolver — it's that (a) the 22 curated rows' `image_url` in
   `supabase/seed.sql` currently point at an `https://...supabase.co/storage/...`
   URL for a bucket that was never populated (root cause of the bug), and
   (b) `ExerciseCard.tsx`/`app/exercises/[exerciseId].tsx`'s `kind === "local"`
   branch is a dead stub (`<Text>Exercise image</Text>`) that never rendered
   an actual `Image`. Fix: revert those 22 rows' `image_url` to their real
   bundled path (`assets/seed-exercises/processed/<id>.jpg`, matching where
   `crop_exercise_images.py` already wrote them), add
   `exerciseLocalImages.ts` — a `Record<string, ImageSourcePropType>` with 22
   explicit `require(...)` calls (Metro requires string-literal `require`
   calls, so this can't be generated dynamically) keyed by that same path
   string — and make both consuming screens look up
   `exerciseLocalImages[image.path]` and render it, falling back to
   `ExerciseImageFallback` only if a path is somehow missing from the map (
   defensive, shouldn't happen once data and map agree).
2. **The 22 curated rows get a data fix, not a re-seed.** `seed.sql` inserts
   are `on conflict (id) do nothing`, so editing the literal `image_url`
   values in the insert statements only affects a fresh `supabase db reset`
   — it does **not** retroactively fix the already-inserted rows on the
   live linked project (same lesson spec 007 hit with the badge-seed
   backfill). This feature includes a one-time `UPDATE` (applied directly
   against the linked project, same mechanism as
   `scripts/update_exercise_image_urls.sql` did originally) that corrects
   `image_url` for exactly those 22 ids, after which
   `scripts/update_exercise_image_urls.sql` is deleted (superseded).
3. **The wger expansion reuses spec 001's proven transform, unchanged.**
   `transformWgerExercise.ts` (with its `mapMuscleGroup` heuristic) and
   `wgerClient.ts` already exist and are already unit-tested
   (`seedTransform.test.ts`) — they were built for exactly this. Rather than
   duplicate or rewrite them, this feature relocates both files verbatim
   from `src/db/seed/` (which is being deleted) to `scripts/wger/`, and
   updates the one test file that imports them. `mapMuscleGroup` always
   resolves to a muscle group (it defaults to `"legs"` when nothing
   matches) — spec.md's FR-006 "no mappable muscle group" case is therefore
   never actually hit by this heuristic; the filter that matters in
   practice are "no usable name in any language" (reusing
   `pickEnglishTranslation`'s existing preference-with-fallback behavior
   unchanged — a non-English name is kept when it's the only one available,
   same as today) and "no picked main image", both of which
   `selectExerciseCandidates.ts` checks explicitly and is unit-tested.
4. **Additive-only seeding via id dedup, not a new conflict strategy.**
   `generateExerciseLibrarySeed.ts` paginates `wgerClient.listExerciseInfo`
   (already defaults to `limit: 200`), runs each result through
   `transformWgerExercise` + `selectExerciseCandidates` (name/image filter,
   plus slug-collision dedup both against the 23 existing ids and within the
   newly fetched batch — appending `-2`, `-3`, ... on collision), stops once
   ~200 usable unique rows are collected, and writes/overwrites a clearly
   delimited section of `supabase/seed.sql` (between
   `-- BEGIN wger-library-expansion (generated)` /
   `-- END wger-library-expansion` markers) so re-running the script
   regenerates deterministically instead of ever appending duplicates. The
   existing `on conflict (id) do nothing` on the `exercises` insert already
   guarantees the 23 existing rows are never touched when this section is
   applied.
5. **SQLite retirement follows spec 006 Phase 7 almost verbatim.** Grep for
   `src/db/`, `expo-sqlite`, `drizzle-orm`, `drizzle-kit` first (after
   design decision 3 has already relocated the two still-needed files out
   of `src/db/seed/`), confirm the only remaining references are the three
   test files identified during planning
   (`tests/unit/ExerciseLibrary.test.tsx`, `tests/unit/seedTransform.test.ts`,
   `tests/helpers/testDatabase.ts`), fix or delete each, then delete
   `src/db/` wholesale and drop the three now-unused dependencies.
   `LOCAL_USER_ID`/`"local-user"` search: the real dead constant lives in
   `src/db/repositories/profileRepository.ts` and disappears with the
   directory; several Supabase-backed test fixtures also use the literal
   string `"local-user"` as an arbitrary fake account id — those are
   unrelated fixture data, not a reference to the deleted constant, and are
   left alone.

## Complexity Tracking

*No constitution violations to justify — no gamification, no new
dependency shipped in the app, no new native module, no schema/RLS change.*
