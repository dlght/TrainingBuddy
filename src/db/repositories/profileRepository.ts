import type { DatabaseAdapter } from "../client";
import type { SaveUserProfileInput, UserProfile, WeightUnit, ExperienceLevel } from "../../models/user";

const LOCAL_USER_ID = "local-user";

type UserProfileRow = {
  id: string;
  name: string;
  bodyweight: number;
  height: number | null;
  weightUnit: WeightUnit;
  experienceLevel: ExperienceLevel;
  goal: string;
  createdAt: string;
};

function toUserProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    bodyweight: row.bodyweight,
    height: row.height,
    weightUnit: row.weightUnit,
    experienceLevel: row.experienceLevel,
    goal: row.goal,
    createdAt: row.createdAt
  };
}

export function createProfileRepository(database: DatabaseAdapter) {
  return {
    async getProfile(): Promise<UserProfile | null> {
      const row = await database.getFirstAsync<UserProfileRow>(
        `SELECT id,
                name,
                bodyweight,
                height,
                weight_unit as weightUnit,
                experience_level as experienceLevel,
                goal,
                created_at as createdAt
           FROM users
          ORDER BY created_at ASC
          LIMIT 1`
      );

      return row ? toUserProfile(row) : null;
    },

    async getProfileById(id: string): Promise<UserProfile | null> {
      const row = await database.getFirstAsync<UserProfileRow>(
        `SELECT id,
                name,
                bodyweight,
                height,
                weight_unit as weightUnit,
                experience_level as experienceLevel,
                goal,
                created_at as createdAt
           FROM users
          WHERE id = ?
          LIMIT 1`,
        [id]
      );

      return row ? toUserProfile(row) : null;
    },

    async saveProfile(input: SaveUserProfileInput): Promise<UserProfile> {
      const id = input.id ?? LOCAL_USER_ID;
      const createdAt = input.createdAt ?? new Date().toISOString();

      await database.runAsync(
        `INSERT INTO users (
            id,
            name,
            bodyweight,
            height,
            weight_unit,
            experience_level,
            goal,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            bodyweight = excluded.bodyweight,
            height = excluded.height,
            weight_unit = excluded.weight_unit,
            experience_level = excluded.experience_level,
            goal = excluded.goal`,
        [
          id,
          input.name,
          input.bodyweight,
          input.height,
          input.weightUnit,
          input.experienceLevel,
          input.goal,
          createdAt
        ]
      );

      const saved = await this.getProfileById(id);

      if (!saved) {
        throw new Error("Profile save completed but the profile could not be read back.");
      }

      return saved;
    },

    async deleteProfile(id = LOCAL_USER_ID): Promise<void> {
      await database.runAsync("DELETE FROM users WHERE id = ?", [id]);
    }
  };
}
