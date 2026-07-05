# Contract: User Flow and Screen Behavior

## Purpose

Define user-visible contracts for the mobile app flows. These are not API
endpoints; they are screen and interaction expectations for implementation and
testing.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Decide whether to show profile setup or main workout area |
| `/profile/setup` | Create/edit profile |
| `/exercises` | Browse library by muscle group |
| `/exercises/[exerciseId]` | Exercise details |
| `/workouts` | List sample and custom workouts |
| `/workouts/new` | Create custom workout |
| `/workouts/[workoutId]` | View workout details; copy sample before edit |
| `/workouts/[workoutId]/session` | Active workout logging |
| `/progress/[exerciseId]` | Exercise history and progress |

## Profile Setup

Required fields:
- Name
- Bodyweight
- Weight unit (`kg` or `lb`)
- Experience level
- Goal

Acceptance:
- User can complete setup in under 3 minutes.
- Abandoned setup can be resumed where practical.
- Invalid numeric values are explained in plain language.

## Exercise Library

Behavior:
- Group exercises by `chest`, `back`, `legs`, `shoulders`, `arms`, and `core`.
- Show image/placeholder, exercise name, equipment, and warmup status in list or
  detail as appropriate.
- Detail screen shows short instructions and optional video link if present.

Acceptance:
- User can identify image, muscle group, instructions, and warmup status within
  10 seconds of opening details.

## Workout Builder

Behavior:
- User picks from seeded exercises only in v1.
- User sets target sets, rep range low/high, and rest seconds.
- User can reorder exercises.
- User can mark two or more workout exercises as a simple superset group.
- Empty workouts cannot be started.

Sample template behavior:
- Start directly from a sample workout.
- Editing a sample creates an editable copy and leaves the original unchanged.

## Active Session

Behavior:
- Show workout name, current exercise, target sets/reps/rest, and logged sets.
- Each set requires reps, weight, and RPE 1-10.
- Rest timer can start after a set and remains understandable after background
  and resume.
- User can finish, resume later, or discard an active session.

Acceptance:
- User can log a 3-exercise workout without leaving the session flow.

## Exercise Progress

Behavior:
- Show full completed-session history for the selected exercise.
- Show set rows with date, reps, weight, and effort.
- Show volume summary and simple weight-over-time chart.
- Do not show highest weight, one-rep max, leaderboards, badges, or advanced PR
  panels in v1.

## Empty and Error States

- No profile: route to setup.
- No custom workouts: show sample workouts and create action.
- Exercise image missing: show placeholder and retain text content.
- Invalid workout values: show inline beginner-friendly message.
- Active session found on restart: show resume/discard choice.
- Network unavailable: no blocking error for core flows.
