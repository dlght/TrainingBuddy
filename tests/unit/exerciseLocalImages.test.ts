import fs from "node:fs";
import path from "node:path";

import { exerciseLocalImages } from "@/features/exercises/exerciseLocalImages";

describe("exerciseLocalImages", () => {
  it("has a bundled entry for every local exercise image path seeded in supabase/seed.sql", () => {
    const seedSql = fs.readFileSync(path.join(__dirname, "..", "..", "supabase", "seed.sql"), "utf8");
    const seededLocalPaths = [...seedSql.matchAll(/'(assets\/seed-exercises\/processed\/[a-z0-9-]+\.jpg)'/g)].map(
      (match) => match[1]
    );

    expect(seededLocalPaths.length).toBeGreaterThan(0);

    for (const seededPath of seededLocalPaths) {
      expect(exerciseLocalImages[seededPath]).toBeDefined();
    }
  });
});
