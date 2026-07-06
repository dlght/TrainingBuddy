import { runMigrations } from "../../src/db/migrate";
import { TestDatabase } from "../helpers/testDatabase";

describe("database migrations", () => {
  it("applies the initial schema once and records it", async () => {
    const database = new TestDatabase();

    await runMigrations(database);

    expect(database.schemaMigrations.has("0001_initial")).toBe(true);
    expect(database.execStatements.join("\n")).toContain("CREATE TABLE IF NOT EXISTS users");
    expect(database.execStatements.join("\n")).toContain("CREATE TABLE IF NOT EXISTS workout_sessions");
    expect(database.execStatements.join("\n")).toContain("CREATE TABLE IF NOT EXISTS set_logs");

    const initialMigrationExecutions = database.execStatements.filter((statement) =>
      statement.includes("CREATE TABLE IF NOT EXISTS users")
    ).length;

    await runMigrations(database);

    expect(
      database.execStatements.filter((statement) =>
        statement.includes("CREATE TABLE IF NOT EXISTS users")
      ).length
    ).toBe(initialMigrationExecutions);
  });
});
