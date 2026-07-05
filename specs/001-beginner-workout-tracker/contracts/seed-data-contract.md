# Contract: Seed Exercise Data

## Purpose

Define how starter exercise data is sourced from wger and transformed into
bundled TrainingBuddy seed data. This is a development/build-time contract, not
a runtime dependency for core app use.

## External Source

Base URL: `https://wger.de/api/v2/`

Relevant endpoints:
- `GET /api/v2/exerciseinfo/`
- `GET /api/v2/exerciseimage/`
- `GET /api/v2/exercisecategory/`
- `GET /api/v2/muscle/`
- `GET /api/v2/equipment/`
- `GET /api/v2/video/`

Official behavior to respect:
- JSON is returned by default.
- List endpoints are paginated and include `count`, `next`, `previous`, and
  `results`.
- Public exercise endpoints can be read without user authentication.
- Query filtering, ordering, `limit`, and `offset` are supported.

Sources:
- https://wger.readthedocs.io/en/latest/api/api.html
- https://wger.de/api/v2/
- https://wger.de/api/v2/schema

## Selected Source Fields

### Exercise info

Required source fields when available:
- `id`
- `uuid`
- `category.name`
- `muscles[].name_en`
- `equipment[].name`
- `images[]`
- `translations[]`
- `videos[]`
- `license_author`

### Exercise image

Required source fields when available:
- `id`
- `exercise`
- `exercise_uuid`
- `image`
- `is_main`
- `license_author`
- `license_object_url`
- `license_author_url`
- `license_derivative_source_url`

## Transformation Rules

- Select only exercises needed by Full Body A/B/C sample workouts.
- Map wger categories and muscles into one app MuscleGroup:
  `chest`, `back`, `legs`, `shoulders`, `arms`, or `core`.
- Prefer English exercise names and concise English instructions.
- Choose one main image per exercise; if no acceptable image exists, assign a
  bundled placeholder.
- Download selected images into `assets/seed-exercises/` during seed
  preparation.
- Store the bundled local asset path/key as the primary app image value.
- Preserve source id/UUID and attribution fields in seed metadata.
- Mark `is_warmup` manually during seed curation; do not infer it blindly from
  wger.

## Output Seed Shape

```json
{
  "muscleGroups": [
    { "id": "legs", "name": "legs" }
  ],
  "exercises": [
    {
      "id": "bodyweight-squat",
      "name": "Bodyweight Squat",
      "muscle_group_id": "legs",
      "equipment": "bodyweight",
      "image_url": "assets/seed-exercises/bodyweight-squat.webp",
      "instructions": "Stand tall, bend your knees, and sit your hips back. Stand up with control.",
      "is_warmup": true,
      "video_url": null,
      "source": "wger",
      "source_id": "wger-id-or-uuid",
      "license_author": "source author",
      "license_url": "source URL"
    }
  ],
  "workouts": [
    {
      "id": "full-body-a",
      "name": "Full Body A",
      "user_id": null,
      "is_template": true,
      "exercises": [
        {
          "exercise_id": "bodyweight-squat",
          "order_index": 1,
          "target_sets": 2,
          "target_rep_range_low": 8,
          "target_rep_range_high": 12,
          "target_rest_seconds": 60,
          "superset_group_id": null
        }
      ]
    }
  ]
}
```

## Acceptance Checks

- App can install fresh in airplane mode and show all seed exercises/images.
- Seed import is idempotent and does not overwrite user-created workouts.
- Every seeded exercise has a visual asset or placeholder.
- Every non-placeholder wger image has retained attribution metadata.
