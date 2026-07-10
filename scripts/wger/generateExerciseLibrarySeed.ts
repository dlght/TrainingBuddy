import fs from "node:fs";
import path from "node:path";

import type { Exercise } from "../../src/models/exercise";
import { selectExerciseCandidates } from "./selectExerciseCandidates";
import { createWgerClient } from "./wgerClient";

const TARGET_NEW_EXERCISE_COUNT = 200;
const PAGE_SIZE = 100;
const SEED_FILE = path.join(__dirname, "..", "..", "supabase", "seed.sql");
const SECTION_START = "-- BEGIN wger-library-expansion (generated)";
const SECTION_END = "-- END wger-library-expansion";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findCuratedExercisesBlock(seedSql: string): string {
  const exercisesBlock = seedSql.match(/insert into public\.exercises[\s\S]*?on conflict \(id\) do nothing;/);

  if (!exercisesBlock) {
    throw new Error("Could not find the existing public.exercises insert block in supabase/seed.sql");
  }

  return exercisesBlock[0];
}

function readExistingExerciseIds(curatedBlock: string): Set<string> {
  const ids = [...curatedBlock.matchAll(/^\s*\(\s*'([a-z0-9-]+)'/gm)].map((match) => match[1]);

  return new Set(ids);
}

function readExistingExerciseNames(curatedBlock: string): Set<string> {
  const names = [...curatedBlock.matchAll(/^\s*\(\s*'[a-z0-9-]+'\s*,\s*'((?:[^']|'')*)'/gm)].map((match) =>
    match[1].replace(/''/g, "'")
  );

  return new Set(names);
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlNullableString(value: string | null): string {
  return value === null ? "null" : sqlString(value);
}

function toInsertRow(exercise: Exercise): string {
  return [
    "  (",
    sqlString(exercise.id),
    ", ",
    sqlString(exercise.name),
    ", ",
    sqlString(exercise.muscleGroupId),
    ", ",
    sqlNullableString(exercise.equipment),
    ", ",
    sqlString(exercise.imageUrl),
    ", ",
    sqlString(exercise.instructions),
    ", ",
    String(exercise.isWarmup),
    ", ",
    sqlNullableString(exercise.source),
    ", ",
    sqlNullableString(exercise.sourceId),
    ", ",
    sqlNullableString(exercise.licenseAuthor),
    ", ",
    sqlNullableString(exercise.licenseUrl),
    ")"
  ].join("");
}

async function fetchCandidates(existingIds: Set<string>, existingNames: Set<string>): Promise<Exercise[]> {
  const client = createWgerClient();
  const seenIds = new Set(existingIds);
  const seenNames = new Set(existingNames);
  const collected: Exercise[] = [];
  let offset = 0;

  while (collected.length < TARGET_NEW_EXERCISE_COUNT) {
    const page = await client.listExerciseInfo({ limit: PAGE_SIZE, offset });

    if (page.results.length === 0) {
      break;
    }

    for (const candidate of selectExerciseCandidates(page.results, seenIds, seenNames)) {
      seenIds.add(candidate.id);
      seenNames.add(candidate.name.trim().toLowerCase());
      collected.push(candidate);

      if (collected.length >= TARGET_NEW_EXERCISE_COUNT) {
        break;
      }
    }

    if (!page.next) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return collected;
}

function buildSeedSection(exercises: Exercise[]): string {
  const header = [
    SECTION_START,
    `-- ${exercises.length} additional exercises fetched from wger's public API`,
    "-- (scripts/wger/generateExerciseLibrarySeed.ts). Additive only: relies on",
    "-- `on conflict (id) do nothing` so the curated 23 rows above are never",
    "-- touched. Regenerate by re-running the script; this section is fully",
    "-- overwritten each time, never appended to.",
    "insert into public.exercises",
    "  (id, name, muscle_group_id, equipment, image_url, instructions, is_warmup, source, source_id, license_author, license_url)",
    "values"
  ].join("\n");

  const rows = exercises.map(toInsertRow).join(",\n");

  return `${header}\n${rows}\non conflict (id) do nothing;\n${SECTION_END}`;
}

function writeSeedSection(seedSql: string, section: string): string {
  const sectionPattern = new RegExp(`${escapeRegExp(SECTION_START)}[\\s\\S]*?${escapeRegExp(SECTION_END)}`, "m");

  if (sectionPattern.test(seedSql)) {
    return seedSql.replace(sectionPattern, section);
  }

  return `${seedSql.trimEnd()}\n\n${section}\n`;
}

async function main() {
  const seedSql = fs.readFileSync(SEED_FILE, "utf8");
  const curatedBlock = findCuratedExercisesBlock(seedSql);
  const existingIds = readExistingExerciseIds(curatedBlock);
  const existingNames = readExistingExerciseNames(curatedBlock);
  const candidates = await fetchCandidates(existingIds, existingNames);

  if (candidates.length === 0) {
    throw new Error("No wger exercise candidates were collected — nothing written.");
  }

  fs.writeFileSync(SEED_FILE, writeSeedSection(seedSql, buildSeedSection(candidates)));

  console.log(`Wrote ${candidates.length} new exercises to ${SEED_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
