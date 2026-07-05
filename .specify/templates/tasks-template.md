---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include tests when the feature touches workout logic, SQLite
persistence, migrations, or reusable TypeScript functions. UI-only changes may
use manual Expo validation when automated coverage would not add meaningful
confidence.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Expo mobile app**: `app/`, `src/`, `tests/` at repository root
- **App routes/screens**: `app/`
- **Reusable UI and feature code**: `src/components/`, `src/features/`
- **SQLite schema, migrations, data access**: `src/db/`
- **Domain models and services**: `src/models/`, `src/services/`

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit-tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Contracts or screen/state expectations from design artifacts

  Tasks MUST be organized by user story so each story can be implemented,
  tested, and validated independently.

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create Expo app structure per implementation plan
- [ ] T002 Initialize TypeScript dependencies for Expo, React Native, and SQLite
- [ ] T003 [P] Configure linting, formatting, and test tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Setup SQLite schema and migration framework in src/db/
- [ ] T005 [P] Define TypeScript domain models shared by stories in src/models/
- [ ] T006 [P] Create offline-safe data access helpers in src/db/
- [ ] T007 Create base workout/session entities that all stories depend on
- [ ] T008 Configure user-facing error handling for invalid or missing local data
- [ ] T009 Setup Expo environment configuration

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) MVP

**Goal**: [Brief description of the beginner-visible outcome]

**Independent Test**: [How to verify this story works on its own in Expo]

### Tests for User Story 1

> **NOTE: Write these tests FIRST when the story includes logic, SQLite, or migrations. Ensure they FAIL before implementation.**

- [ ] T010 [P] [US1] Unit test for [TypeScript logic] in tests/unit/[name].test.ts
- [ ] T011 [P] [US1] SQLite integration test for [persistence behavior] in tests/integration/[name].test.ts

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create [Entity1] model in src/models/[entity1].ts
- [ ] T013 [P] [US1] Create [Entity2] model in src/models/[entity2].ts
- [ ] T014 [US1] Implement [Service] in src/services/[service].ts (depends on T012, T013)
- [ ] T015 [US1] Implement [screen/feature] in app/[location]/[file].tsx
- [ ] T016 [US1] Add beginner-friendly validation and error handling
- [ ] T017 [US1] Validate story manually in Expo with network disabled

**Checkpoint**: User Story 1 is fully functional, persisted locally, and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2

- [ ] T018 [P] [US2] Unit test for [TypeScript logic] in tests/unit/[name].test.ts
- [ ] T019 [P] [US2] SQLite or React Native integration test for [user journey] in tests/integration/[name].test.ts

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create [Entity] model in src/models/[entity].ts
- [ ] T021 [US2] Implement [Service] in src/services/[service].ts
- [ ] T022 [US2] Implement [screen/feature] in app/[location]/[file].tsx
- [ ] T023 [US2] Integrate with User Story 1 components only if needed
- [ ] T024 [US2] Validate story manually in Expo with existing local data

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3

- [ ] T025 [P] [US3] Unit test for [TypeScript logic] in tests/unit/[name].test.ts
- [ ] T026 [P] [US3] SQLite or React Native integration test for [user journey] in tests/integration/[name].test.ts

### Implementation for User Story 3

- [ ] T027 [P] [US3] Create [Entity] model in src/models/[entity].ts
- [ ] T028 [US3] Implement [Service] in src/services/[service].ts
- [ ] T029 [US3] Implement [screen/feature] in app/[location]/[file].tsx
- [ ] T030 [US3] Validate story manually in Expo with network disabled

**Checkpoint**: All selected user stories are independently functional

---

[Add more user story phases only when each adds a distinct beginner-visible outcome]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional unit tests for workout logic or migrations in tests/unit/
- [ ] TXXX Run quickstart.md validation in Expo
- [ ] TXXX Validate offline behavior and local data persistence after app restart

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel if capacity allows
  - Or sequentially in priority order (P1 -> P2 -> P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - no dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - may integrate with US1 but must remain independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - may integrate with US1/US2 but must remain independently testable

### Within Each User Story

- Tests for logic, persistence, or migrations MUST be written and fail before implementation
- Models before services
- SQLite schema or migration before persistence-dependent UI
- Services before screens
- Core implementation before integration
- Manual Expo validation before story checkpoint

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel within Phase 2
- Once Foundational phase completes, all independent user stories can start in parallel
- Unit tests and model tasks marked [P] can run in parallel
- Different user stories can be worked on in parallel by different contributors

---

## Parallel Example: User Story 1

```bash
# Launch tests for User Story 1 together:
Task: "Unit test for [TypeScript logic] in tests/unit/[name].test.ts"
Task: "SQLite integration test for [persistence behavior] in tests/integration/[name].test.ts"

# Launch model work for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].ts"
Task: "Create [Entity2] model in src/models/[entity2].ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. STOP and VALIDATE: Test User Story 1 independently in Expo, offline if relevant
5. Demo if ready

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Test independently -> Demo
3. Add User Story 2 -> Test independently -> Demo
4. Add User Story 3 -> Test independently -> Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple contributors:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to a specific user story for traceability
- Each user story must be independently completable and testable
- Verify relevant tests fail before implementing
- Validate offline behavior when persistence or workout logging is touched
- Avoid vague tasks, same-file conflicts, and cross-story dependencies that break independence
