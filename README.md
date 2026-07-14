# TrainingBuddy

TrainingBuddy is an offline-first beginner workout tracker built with Expo, TypeScript, SQLite, and local seed data.

## Current Implementation Notes

- Fresh installs seed six muscle groups, 24 beginner exercises, and exactly three protected sample workouts: Full Body A, Full Body B, and Full Body C.
- Seeded exercises use real photos hosted on wger.de, with a placeholder shown for any exercise missing one.
- Sample workouts are read-only templates. Copy a template or create a custom workout to edit targets and exercise order.
- The app supports profile setup, exercise library browsing, custom workout building, active session logging with rest timer controls, resume/discard for interrupted active sessions, and exercise history/progress views.
- Loading, empty, and error states are implemented with shared components in `src/components/`.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test -- --runInBand
```

Manual offline validation is tracked in `specs/001-beginner-workout-tracker/quickstart.md`.

## Known Limitations

- Exercise images are placeholders until curated local image assets are bundled.
- Data is local to the device; there are no accounts or cross-device sync.
- Runtime wger calls are not required for core app use after the bundled seed is present.
- Progress intentionally excludes highest-weight and one-rep-max cards for v1.
