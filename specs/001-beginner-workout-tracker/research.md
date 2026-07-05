# Research: Beginner Workout Tracker

## Decision: Use Expo + TypeScript with expo-router

**Rationale**: Expo Router matches the requested stack and keeps navigation
simple through file-based routes. It fits the app's small set of screens:
profile setup, exercise library, workouts, session logging, and progress.

**Alternatives considered**:
- React Navigation manual navigator setup: more boilerplate for the same v1 flows.
- Bare React Native: unnecessary native project ownership for an offline local app.

## Decision: Use expo-sqlite with Drizzle ORM

**Rationale**: SQLite is required by the constitution and feature. Drizzle gives
typed schemas, explicit migrations, and query helpers without introducing a
remote backend or large repository abstraction. Keep data access functions
direct and feature-scoped.

**Alternatives considered**:
- Raw SQL only: simple, but weaker type safety and more migration drift risk.
- AsyncStorage: insufficient for relational workout/session history.
- Remote database: violates v1 local-only and offline-first scope.

## Decision: Use Zustand for lightweight session/profile state

**Rationale**: Zustand handles small cross-screen state like active session,
timer UI state, and profile setup draft without wrapping the app in many
providers. SQLite remains the durable source of truth; Zustand is only view
state and short-lived workflow state.

**Alternatives considered**:
- React Context only: acceptable, but can become noisy for active-session state
  and selectors across multiple screens.
- Larger state frameworks: unnecessary for v1.

## Decision: Use local bundled seed images, with expo-image for display/cache

**Rationale**: The spec requires useful first launch without network. Therefore
the selected wger exercise images for sample workouts must be fetched during
seed preparation and bundled under `assets/seed-exercises/`. `expo-image` can
display those local assets and cache remote fallback images if a later seed
refresh path is added.

**Alternatives considered**:
- Remote-only images: fails offline first launch.
- Arbitrary scraped images: licensing and reliability risk.
- No images: violates the exercise library requirement.

## Decision: Use wger public API as seed source only

**Rationale**: Official wger docs state the REST API is under `/api/v2/`, returns
JSON by default, supports filtering/ordering/pagination, and public endpoints
such as exercise lists can be accessed without authentication. The current API
index exposes `exerciseinfo`, `exerciseimage`, `exercisecategory`, `muscle`,
`equipment`, and `video`. The docs also identify the initial exercise data as
CC-BY-SA 3.0, so seed data must retain attribution/license metadata.

**Alternatives considered**:
- Use wger as a runtime dependency: unnecessary and weakens offline behavior.
- Manually authored exercise library: faster initially, but loses the requested
  open exercise source and attribution trail.
- Scrape web images: rejected for licensing and fragility.

**Sources**:
- wger API docs: https://wger.readthedocs.io/en/latest/api/api.html
- wger docs/license note: https://wger.readthedocs.io/en/latest/
- wger endpoint index: https://wger.de/api/v2/
- wger OpenAPI schema: https://wger.de/api/v2/schema

## Decision: Use react-native-svg chart stack, with Victory Native only if compatible

**Rationale**: The feature needs simple weight and volume trends, not advanced
analytics. A small react-native-svg based chart component is enough if it avoids
heavy dependencies and works in Expo. Victory Native is acceptable only if its
current Expo compatibility and bundle impact are verified during implementation.

**Alternatives considered**:
- Victory Native by default: faster charting, but may add more dependency
  surface than needed for simple v1 trends.
- No charts: would under-deliver the weight-over-time requirement.

## Decision: Completed sessions snapshot performed details

**Rationale**: Clarification requires history to keep original performed
details. Store snapshot fields on session/set rows so later exercise/workout
edits cannot rewrite past history.

**Alternatives considered**:
- Always join current exercise/workout names: simpler queries but inaccurate
  history after edits.
- Update only names while keeping set values: still creates mixed historical
  records.

## Decision: Keep sample workouts as protected templates

**Rationale**: Clarification requires users to copy sample workouts before
editing. Preloaded templates have `user_id = null` and are not directly
editable; copying creates a user-owned workout.

**Alternatives considered**:
- Directly edit samples: simpler UI but destroys starter defaults.
- Read-only samples only: too restrictive for beginner adaptation.
