---
description: "Implementation tasks for Beginner Workout Tracker"
---

# Tasks: Beginner Workout Tracker

**Input**: Design documents from `/specs/001-beginner-workout-tracker/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Include focused tests for Drizzle/SQLite persistence, seed transforms,
domain validation, session logging, and progress calculations. Each phase has an
acceptance gate and must leave the app in a runnable state.

**Organization**: Tasks follow the requested phase order. Story labels map to
the spec user stories: US1 Profile/first launch, US2 Exercise library, US3
Workout builder, US4 Active session, US5 History/progress, US6 Sample workouts.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel when dependencies are complete
- **[Story]**: Used for user-story implementation tasks only
- Every task includes an exact file path

## Phase 1: Scaffold

**Goal**: Expo + TypeScript project boots with file-based routing, test tooling,
and empty app shell.

**Acceptance Criteria**: `npm run start`, `npm run lint`, and `npm test` run
successfully; `/`, `/profile/setup`, `/exercises`, `/workouts`, and `/progress`
routes render placeholder screens.

- [ ] T001 Initialize Expo TypeScript project configuration in package.json
- [ ] T002 Configure TypeScript compiler options in tsconfig.json
- [ ] T003 Configure Expo app metadata in app.json
- [ ] T004 Install runtime dependencies for expo-router, expo-sqlite, drizzle-orm, zustand, expo-image, react-native-svg in package.json
- [ ] T005 Install development dependencies for Jest, React Native Testing Library, ESLint, Prettier, Drizzle Kit in package.json
- [ ] T006 Create Expo Router root layout in app/_layout.tsx
- [ ] T007 Create route decision placeholder in app/index.tsx
- [ ] T008 [P] Create profile setup placeholder route in app/profile/setup.tsx
- [ ] T009 [P] Create exercise list placeholder route in app/exercises/index.tsx
- [ ] T010 [P] Create exercise detail placeholder route in app/exercises/[exerciseId].tsx
- [ ] T011 [P] Create workouts list placeholder route in app/workouts/index.tsx
- [ ] T012 [P] Create workout builder placeholder route in app/workouts/new.tsx
- [ ] T013 [P] Create workout detail placeholder route in app/workouts/[workoutId].tsx
- [ ] T014 [P] Create active session placeholder route in app/workouts/[workoutId]/session.tsx
- [ ] T015 [P] Create progress placeholder route in app/progress/[exerciseId].tsx
- [ ] T016 Configure Jest setup for React Native tests in jest.config.js
- [ ] T017 Configure ESLint and Prettier rules in eslint.config.js
- [ ] T018 Create shared app theme tokens in src/components/theme.ts
- [ ] T019 Create common screen container component in src/components/Screen.tsx
- [ ] T020 Add scaffold smoke test for route placeholders in tests/unit/scaffold.test.tsx

## Phase 2: Data Layer

**Goal**: SQLite + Drizzle schema, migrations, typed repositories, wger seed
pipeline, bundled starter images, and three protected sample workouts.

**Acceptance Criteria**: A fresh install applies migrations, seeds muscle
groups/exercises/sample workouts idempotently, stores local image paths, and can
read seeded data with network disabled after initial seed preparation.

- [X] T021 Create SQLite client wrapper in src/db/client.ts
- [X] T022 Create Drizzle schema for User, MuscleGroup, Exercise, Workout, WorkoutExercise, WorkoutSession, and SetLog in src/db/schema.ts
- [X] T023 Create initial Drizzle migration for all tables and indexes in src/db/migrations/0001_initial.sql
- [X] T024 Create migration runner in src/db/migrate.ts
- [X] T025 Create seed version tracking table and helpers in src/db/seed/seedVersion.ts
- [X] T026 [P] Create TypeScript model types for profile and weight units in src/models/user.ts
- [X] T027 [P] Create TypeScript model types for exercises and muscle groups in src/models/exercise.ts
- [X] T028 [P] Create TypeScript model types for workouts and workout exercises in src/models/workout.ts
- [X] T029 [P] Create TypeScript model types for sessions and set logs in src/models/session.ts
- [X] T030 Create profile repository in src/db/repositories/profileRepository.ts
- [X] T031 Create exercise repository in src/db/repositories/exerciseRepository.ts
- [X] T032 Create workout repository in src/db/repositories/workoutRepository.ts
- [X] T033 Create session repository in src/db/repositories/sessionRepository.ts
- [X] T034 Create progress query repository in src/db/repositories/progressRepository.ts
- [X] T035 Create wger API client for seed endpoints in src/db/seed/wgerClient.ts
- [X] T036 Create wger-to-app seed transformer in src/db/seed/transformWgerExercise.ts
- [X] T037 Create curated sample workout seed manifest in src/db/seed/sampleWorkouts.ts
- [X] T038 Create seed image download script in scripts/seed-wger-images.ts
- [X] T039 Create bundled seed data loader in src/db/seed/loadSeedData.ts
- [X] T040 Add placeholder image asset in assets/seed-exercises/placeholder.txt
- [X] T041 Add package script for seed image preparation in package.json
- [X] T042 Add integration test for migration runner in tests/integration/dbMigrations.test.ts
- [X] T043 Add unit test for wger seed transformation in tests/unit/seedTransform.test.ts
- [X] T044 Add integration test for idempotent seed loading in tests/integration/seedLoading.test.ts
- [X] T045 Add integration test ensuring sample workouts are protected templates in tests/integration/sampleWorkoutTemplates.test.ts

## Phase 3: Profile

**Goal**: User can create/edit a single profile with name, bodyweight, height,
weight unit, experience level, and goal; profile persists across restarts.

**Acceptance Criteria**: From fresh app state, user completes profile setup in
under 3 minutes, returns to main area, restarts the app, and sees saved profile
with the selected kg/lb unit.

- [X] T046 [US1] Implement profile validation helpers in src/features/profile/profileValidation.ts
- [X] T047 [US1] Add tests for profile validation in tests/unit/profileValidation.test.ts
- [X] T048 [US1] Implement profile service using profileRepository in src/features/profile/profileService.ts
- [X] T049 [US1] Add integration test for profile persistence across repository reload in tests/integration/profilePersistence.test.ts
- [X] T050 [US1] Implement profile setup/edit form in src/features/profile/ProfileForm.tsx
- [X] T051 [US1] Implement profile setup screen in app/profile/setup.tsx
- [X] T052 [US1] Update root route to send missing-profile users to setup in app/index.tsx
- [X] T053 [US1] Add Zustand profile setup draft store in src/state/profileSetupStore.ts
- [X] T054 [US1] Add React Native test for profile setup required fields and kg/lb selection in tests/unit/ProfileForm.test.tsx
- [X] T055 [US1] Add manual validation notes for profile phase in specs/001-beginner-workout-tracker/quickstart.md

## Phase 4: Exercise Library

**Goal**: User browses seeded exercises by muscle group and opens detail views
with image/placeholder, instructions, equipment, warmup status, and optional
video link.

**Acceptance Criteria**: With network disabled, user can browse each muscle
group, open seeded exercise details, identify warmup status within 10 seconds,
and see no broken image state.

- [X] T056 [P] [US2] Implement exercise grouping selectors in src/features/exercises/exerciseSelectors.ts
- [X] T057 [P] [US2] Add tests for exercise grouping selectors in tests/unit/exerciseSelectors.test.ts
- [X] T058 [US2] Implement exercise library service in src/features/exercises/exerciseLibraryService.ts
- [X] T059 [US2] Implement exercise image resolver for local seed assets and placeholders in src/features/exercises/exerciseImageResolver.ts
- [X] T060 [US2] Add tests for image resolver fallback behavior in tests/unit/exerciseImageResolver.test.ts
- [X] T061 [US2] Implement muscle group segmented control in src/features/exercises/MuscleGroupFilter.tsx
- [X] T062 [US2] Implement exercise card component with warmup indicator in src/features/exercises/ExerciseCard.tsx
- [X] T063 [US2] Implement exercise library route in app/exercises/index.tsx
- [X] T064 [US2] Implement exercise detail route in app/exercises/[exerciseId].tsx
- [X] T065 [US2] Add React Native test for browse-by-muscle-group flow in tests/unit/ExerciseLibrary.test.tsx
- [X] T066 [US2] Add integration test for offline seeded exercise read path in tests/integration/exerciseLibraryOffline.test.ts

## Phase 5: Workout Builder

**Goal**: User creates, edits, deletes, and copies workouts; adds seeded
exercises; sets target sets, rep range, rest; reorders exercises; marks
superset groups.

**Acceptance Criteria**: User can create a 3-exercise workout in under 5
minutes, copy a sample workout before editing, mark two exercises as a superset,
restart the app, and start the saved custom workout; empty workouts cannot
start.

- [X] T067 [US3] Implement workout target validation helpers in src/features/workouts/workoutValidation.ts
- [X] T068 [US3] Add tests for workout target and empty-workout validation in tests/unit/workoutValidation.test.ts
- [X] T069 [US3] Implement workout builder service for create/edit/delete/copy in src/features/workouts/workoutBuilderService.ts
- [X] T070 [US3] Add integration test for create/edit/delete custom workout persistence in tests/integration/workoutCrud.test.ts
- [X] T071 [US3] Add integration test for copying protected sample workout in tests/integration/copySampleWorkout.test.ts
- [X] T072 [US3] Implement workout list service for sample and custom workouts in src/features/workouts/workoutListService.ts
- [X] T073 [US3] Implement workout list route in app/workouts/index.tsx
- [X] T074 [US3] Implement workout detail route with copy-before-edit behavior in app/workouts/[workoutId].tsx
- [X] T075 [US3] Implement workout editor route in app/workouts/new.tsx
- [X] T076 [US3] Implement exercise picker component for workout builder in src/features/workouts/ExercisePicker.tsx
- [X] T077 [US3] Implement workout exercise target editor in src/features/workouts/WorkoutExerciseEditor.tsx
- [X] T078 [US3] Implement superset group marking control in src/features/workouts/SupersetGroupControl.tsx
- [X] T079 [US3] Add tests for superset group assignment in tests/unit/supersetGrouping.test.ts
- [X] T080 [US3] Add React Native test for workout creation flow in tests/unit/WorkoutBuilder.test.tsx

## Phase 6: Active Session

**Goal**: User starts a sample or custom workout, steps through exercises,
logs reps/weight/RPE per set, uses rest timer, resumes interrupted sessions,
and saves completed sessions with snapshots.

**Acceptance Criteria**: User can log a 3-exercise workout without leaving the
session flow; RPE outside 1-10 and negative values are rejected; app restart
during an active session offers resume/discard; completed history keeps original
performed details after later workout edits.

- [X] T081 [US4] Implement session validation helpers in src/features/sessions/sessionValidation.ts
- [X] T082 [US4] Add tests for reps, weight, RPE, and rest validation in tests/unit/sessionValidation.test.ts
- [X] T083 [US4] Implement active session service for start/resume/discard/complete in src/features/sessions/sessionService.ts
- [X] T084 [US4] Implement set logging service with completed-session snapshots in src/features/sessions/setLogService.ts
- [X] T085 [US4] Add integration test for start session from sample and custom workout in tests/integration/startWorkoutSession.test.ts
- [X] T086 [US4] Add integration test for set logging and session completion in tests/integration/logWorkoutSession.test.ts
- [X] T087 [US4] Add integration test for interrupted session resume/discard in tests/integration/resumeInterruptedSession.test.ts
- [X] T088 [US4] Add integration test for completed session snapshot after workout edit in tests/integration/sessionSnapshot.test.ts
- [X] T089 [US4] Implement Zustand active session store in src/state/activeSessionStore.ts
- [X] T090 [US4] Implement rest timer hook with background/resume handling in src/features/sessions/useRestTimer.ts
- [X] T091 [US4] Add tests for rest timer elapsed time behavior in tests/unit/useRestTimer.test.ts
- [X] T092 [US4] Implement active session route in app/workouts/[workoutId]/session.tsx
- [X] T093 [US4] Implement current exercise panel in src/features/sessions/CurrentExercisePanel.tsx
- [X] T094 [US4] Implement set log row/editor in src/features/sessions/SetLogEditor.tsx
- [X] T095 [US4] Implement rest timer display controls in src/features/sessions/RestTimerControls.tsx
- [X] T096 [US4] Add React Native test for active session logging flow in tests/unit/ActiveSession.test.tsx

## Phase 7: History & Progress

**Goal**: User views per-exercise session history, reps/weight/RPE set details,
volume summaries, and simple weight/volume-over-time charts without highest
weight or one-rep-max records.

**Acceptance Criteria**: After two completed sessions containing the same
exercise, user can open progress in no more than 3 navigation steps, see full
session history and volume/weight charts, and confirm no highest-weight or 1RM
card is shown.

- [X] T097 [US5] Implement progress calculation helpers in src/features/progress/progressCalculations.ts
- [X] T098 [US5] Add tests for volume and weight-over-time calculations in tests/unit/progressCalculations.test.ts
- [X] T099 [US5] Implement progress service using completed session snapshots in src/features/progress/progressService.ts
- [X] T100 [US5] Add integration test for per-exercise history query in tests/integration/exerciseHistory.test.ts
- [X] T101 [US5] Add integration test that progress excludes highest weight and one-rep max records in tests/integration/noPrMetrics.test.ts
- [X] T102 [US5] Implement session history list component in src/features/progress/SessionHistoryList.tsx
- [X] T103 [US5] Implement set history table component in src/features/progress/SetHistoryTable.tsx
- [X] T104 [US5] Implement lightweight weight-over-time chart component in src/features/progress/WeightTrendChart.tsx
- [X] T105 [US5] Implement volume-over-time chart component in src/features/progress/VolumeTrendChart.tsx
- [X] T106 [US5] Implement exercise progress route in app/progress/[exerciseId].tsx
- [X] T107 [US5] Add React Native test for exercise progress screen in tests/unit/ExerciseProgress.test.tsx

## Phase 8: Seed & Polish

**Goal**: First launch is polished and reliable: preloaded workouts are final,
core flows work offline, empty/error/loading states are clear, and quickstart
validation passes end to end.

**Acceptance Criteria**: Fresh install in airplane mode supports profile setup,
sample workout selection, exercise library browsing, custom workout creation,
session logging, restart persistence, and history review; loading/empty/error
states use beginner-friendly copy.

- [X] T108 [P] [US6] Finalize Full Body A seed workout in src/db/seed/sampleWorkouts.ts
- [X] T109 [P] [US6] Finalize Full Body B seed workout in src/db/seed/sampleWorkouts.ts
- [X] T110 [P] [US6] Finalize Full Body C seed workout in src/db/seed/sampleWorkouts.ts
- [X] T111 [US6] Verify every seeded exercise has local image asset mapping in src/db/seed/loadSeedData.ts
- [X] T112 [US6] Add test that fresh seed contains exactly three sample templates in tests/integration/finalSeedTemplates.test.ts
- [X] T113 Add reusable loading state component in src/components/LoadingState.tsx
- [X] T114 Add reusable empty state component in src/components/EmptyState.tsx
- [X] T115 Add reusable error state component in src/components/ErrorState.tsx
- [X] T116 Add profile missing and setup resume empty states in src/features/profile/ProfileForm.tsx
- [X] T117 Add no-custom-workouts empty state with sample workout guidance in src/features/workouts/WorkoutEmptyState.tsx
- [X] T118 Add exercise image missing fallback copy in src/features/exercises/ExerciseImageFallback.tsx
- [X] T119 Add active session resume/discard startup prompt in app/index.tsx
- [X] T120 Add offline quickstart end-to-end manual checklist in specs/001-beginner-workout-tracker/quickstart.md
- [X] T121 Run and fix lint issues across app/, src/, and tests/ via npm run lint
- [X] T122 Run and fix unit/integration tests across tests/ via npm test
- [ ] T123 Validate fresh install offline flow manually against specs/001-beginner-workout-tracker/quickstart.md
- [X] T124 Update implementation notes and known limitations in README.md

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Scaffold**: No dependencies.
- **Phase 2 Data Layer**: Depends on Phase 1.
- **Phase 3 Profile**: Depends on Phase 2.
- **Phase 4 Exercise Library**: Depends on Phase 2; can start after seeded exercise read path works.
- **Phase 5 Workout Builder**: Depends on Phase 3 and Phase 4.
- **Phase 6 Active Session**: Depends on Phase 5.
- **Phase 7 History & Progress**: Depends on Phase 6 completed-session data.
- **Phase 8 Seed & Polish**: Depends on all prior phases.

### Story Mapping

- **US1 Complete First-Launch Setup**: Phase 3 plus seed visibility from Phase 2.
- **US2 Browse Beginner Exercise Library**: Phase 4.
- **US3 Build a Custom Workout**: Phase 5.
- **US4 Log a Workout Session**: Phase 6.
- **US5 Review Exercise History**: Phase 7.
- **US6 Use Preloaded Sample Workouts**: Phase 2 and Phase 8.

### Parallel Opportunities

- Scaffold placeholder routes T008-T015 can run in parallel after T006.
- Data model type tasks T026-T029 can run in parallel after T022.
- Exercise selectors and tests T056-T057 can run alongside image resolver work T059-T060 after repositories exist.
- Sample workout finalization T108-T110 can run in parallel during Phase 8.

## Parallel Example: Phase 4 Exercise Library

```bash
Task: "T056 [P] [US2] Implement exercise grouping selectors in src/features/exercises/exerciseSelectors.ts"
Task: "T057 [P] [US2] Add tests for exercise grouping selectors in tests/unit/exerciseSelectors.test.ts"
Task: "T059 [US2] Implement exercise image resolver for local seed assets and placeholders in src/features/exercises/exerciseImageResolver.ts"
Task: "T060 [US2] Add tests for image resolver fallback behavior in tests/unit/exerciseImageResolver.test.ts"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 Scaffold.
2. Complete Phase 2 Data Layer through seeded sample workouts.
3. Complete Phase 3 Profile.
4. Validate first launch offline: profile setup, seeded workouts visible, app restart persistence.

### Incremental Delivery

1. Scaffold gives a runnable shell.
2. Data layer gives local persistence and seed content.
3. Profile makes the app personal and restart-safe.
4. Exercise library makes seed content browsable.
5. Workout builder enables user-owned routines.
6. Active session enables workout logging.
7. History/progress makes logged data useful.
8. Seed/polish hardens the full offline path.

## Notes

- Keep SQLite/Drizzle as the source of truth; Zustand stores only transient UI/session state.
- Do not add accounts, nutrition, wearables, social features, cross-device sync, highest-weight cards, or one-rep-max calculations in v1.
- Runtime wger calls must not be required for core app use after seed assets are bundled.
- Every phase must pass its acceptance criteria before moving to the next.
