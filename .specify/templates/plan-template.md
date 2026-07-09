# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript [version] or NEEDS CLARIFICATION

**Primary Dependencies**: Expo, React Native, SQLite [library] or NEEDS CLARIFICATION

**Storage**: Supabase (Postgres + Row Level Security) or NEEDS CLARIFICATION

**Testing**: [e.g., Jest, React Native Testing Library, Expo validation] or NEEDS CLARIFICATION

**Target Platform**: Expo mobile app for iOS and Android or NEEDS CLARIFICATION

**Project Type**: mobile-app

**Performance Goals**: Beginner logging flow remains responsive during a workout or NEEDS CLARIFICATION

**Constraints**: Per-user data isolation via RLS, standard Expo Go compatibility (no paid Apple account), simple beginner UX

**Scale/Scope**: [domain-specific, e.g., local single-user workout history] or NEEDS CLARIFICATION

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Beginner-first: Does the plan identify the shortest useful beginner workflow
  and avoid expert-only concepts unless explained in context?
- Cloud-backed, per-user data: Does the plan persist to Supabase with Row
  Level Security scoping every row to its owning account, and define
  signed-out, network-loss, and session-expiry behavior?
- Approved stack: Does the plan use Expo, React Native, TypeScript, and
  Supabase, and keep running unmodified inside standard Expo Go? Any other
  native module, custom backend server, or platform-specific code MUST be
  justified.
- Simplicity: Does the plan defer optional settings, analytics, social,
  gamification, generated plans, wearables, and other non-default scope unless
  explicitly justified?
- Testable increment: Is each user story independently testable, with manual
  Expo validation and targeted automated tests for persistence or logic where
  relevant?

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
|-- plan.md              # This file (/speckit-plan command output)
|-- research.md          # Phase 0 output (/speckit-plan command)
|-- data-model.md        # Phase 1 output (/speckit-plan command)
|-- quickstart.md        # Phase 1 output (/speckit-plan command)
|-- contracts/           # Phase 1 output (/speckit-plan command)
`-- tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused paths and expand the structure with real
  files. The default project shape is an Expo React Native mobile app.
-->

```text
app/
|-- (tabs)/
`-- _layout.tsx

src/
|-- components/
|-- features/
|-- db/
|-- models/
`-- services/

tests/
|-- integration/
`-- unit/
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., cloud sync] | [current need] | [why local-only is insufficient] |
| [e.g., native module] | [specific problem] | [why Expo-supported APIs are insufficient] |
