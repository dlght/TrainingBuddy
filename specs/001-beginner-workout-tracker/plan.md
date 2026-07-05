# Implementation Plan: Beginner Workout Tracker

**Branch**: `not-created-by-plan` | **Date**: 2026-07-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-beginner-workout-tracker/spec.md`

## Summary

Build a beginner-friendly Expo React Native workout tracker with local-first
profile setup, a compact pre-seeded exercise library, three protected starter
workout templates, custom workout creation, workout session logging with RPE
and rest timer, and exercise history/progress views. Use SQLite through
expo-sqlite and Drizzle ORM for durable single-device storage. Use wger's
public exercise API only as a seed-data source for exercise metadata and images;
selected starter assets are bundled locally so first launch works offline.

## Technical Context

**Language/Version**: TypeScript with current Expo-supported React Native runtime

**Primary Dependencies**: Expo, React Native, expo-router, expo-sqlite, Drizzle ORM, Zustand, expo-image, react-native-svg chart stack

**Storage**: Single-device SQLite database managed through Drizzle schema and migrations

**Testing**: Jest for domain/data logic, React Native Testing Library for screens/components, Drizzle/expo-sqlite integration tests where supported, manual Expo validation for device flows

**Target Platform**: Expo mobile app for iOS and Android

**Project Type**: mobile-app

**Performance Goals**: Profile setup and workout logging interactions respond within 1 second; exercise history/progress opens within 2 seconds for local v1 data volumes; rest timer remains accurate after background/resume

**Constraints**: Offline-capable core flows, local-first persistence, beginner-friendly UX, no accounts or cross-device sync in v1, bundled starter exercise images required for first launch

**Scale/Scope**: Single local user profile, 3 protected sample workouts, exercise library limited to sample-workout coverage, user-created workout/session history on one device

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Beginner-first: PASS. The MVP starts with profile setup, starter workouts,
  beginner exercise instructions, and direct logging; advanced analytics are
  excluded.
- Offline-first SQLite: PASS. SQLite is the source of truth; selected seed
  exercises/images are bundled so first launch and core flows work offline.
- Approved stack: PASS. Plan uses Expo, React Native, TypeScript, and SQLite.
  Drizzle ORM is a thin typed layer over SQLite and does not change the approved
  stack.
- Simplicity: PASS WITH NOTE. Superset grouping is included only as a lightweight
  workout-builder marker on workout exercises; no advanced superset analytics or
  specialized session mode is included in v1.
- Testable increment: PASS. User stories remain independently testable with
  local persistence tests and manual Expo offline validation.

## Project Structure

### Documentation (this feature)

```text
specs/001-beginner-workout-tracker/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- seed-data-contract.md
|   |-- storage-contract.md
|   `-- ui-flow-contract.md
`-- checklists/
    `-- requirements.md
```

### Source Code (repository root)

```text
app/
|-- _layout.tsx
|-- index.tsx
|-- profile/
|   `-- setup.tsx
|-- exercises/
|   |-- index.tsx
|   `-- [exerciseId].tsx
|-- workouts/
|   |-- index.tsx
|   |-- new.tsx
|   |-- [workoutId].tsx
|   `-- [workoutId]/
|       `-- session.tsx
`-- progress/
    `-- [exerciseId].tsx

assets/
`-- seed-exercises/

src/
|-- components/
|-- db/
|   |-- client.ts
|   |-- schema.ts
|   |-- migrations/
|   `-- seed/
|-- features/
|   |-- profile/
|   |-- exercises/
|   |-- workouts/
|   |-- sessions/
|   `-- progress/
|-- models/
|-- services/
|-- state/
`-- utils/

tests/
|-- integration/
`-- unit/
```

**Structure Decision**: Use Expo Router file-based routes under `app/`, shared
feature logic under `src/features/`, typed persistence under `src/db/`, and
bundled starter images under `assets/seed-exercises/`. Keep persistence and
domain logic out of route files so history, volume calculations, validation,
and seed loading can be tested without rendering whole screens.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Runtime wger image cache path | User requested wger image sourcing and cache after first load | Bundled-only images satisfy offline but do not support later seed refresh or missing image recovery |
| Lightweight superset marking | User requested marking supersets in the workout builder | Advanced superset programming is out of v1; a nullable group marker is enough for simple grouping |

## Post-Design Constitution Check

- Beginner-first: PASS. Design artifacts keep sample workouts, simple history,
  and beginner copy as first-class requirements.
- Offline-first SQLite: PASS. Data model and contracts require bundled seed
  assets, local image paths, and SQLite-backed flows for setup, browsing,
  workout creation, session logging, and history.
- Approved stack: PASS. No unapproved platform-specific modules are introduced.
- Simplicity: PASS. wger is constrained to seeding; social, accounts, nutrition,
  wearables, cross-device sync, PRs, and 1RM are excluded from v1.
- Testable increment: PASS. Quickstart and contracts define validation paths for
  each story, including offline and restart behavior.
