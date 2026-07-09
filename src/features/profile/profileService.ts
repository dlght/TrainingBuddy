import type { SupabaseClient } from "@supabase/supabase-js";

import { requireUserId } from "@/lib/currentUser";
import { supabase } from "@/lib/supabase";
import type { SaveUserProfileInput, UserProfile } from "@/models/user";

import type { ProfileFormValues } from "./profileValidation";
import { validateProfile } from "./profileValidation";

export type ProfileService = {
  getProfile(): Promise<UserProfile | null>;
  hasProfile(): Promise<boolean>;
  saveProfile(values: ProfileFormValues): Promise<UserProfile>;
  saveProfileInput(input: SaveUserProfileInput): Promise<UserProfile>;
};

type ProfileRow = {
  id: string;
  name: string | null;
  bodyweight: number | null;
  height: number | null;
  weight_unit: string | null;
  experience_level: string | null;
  goal: string | null;
  created_at: string;
};

// A row always exists once a user signs up (created by the on-signup trigger),
// but its identity/preference fields start out null until the profile-setup
// screen fills them in — that "incomplete" state is treated as "no profile
// yet", matching the pre-Supabase semantics where the row itself didn't exist.
function toUserProfile(row: ProfileRow): UserProfile | null {
  if (
    !row.name ||
    row.bodyweight === null ||
    !row.weight_unit ||
    !row.experience_level ||
    !row.goal
  ) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    bodyweight: row.bodyweight,
    height: row.height,
    weightUnit: row.weight_unit as UserProfile["weightUnit"],
    experienceLevel: row.experience_level as UserProfile["experienceLevel"],
    goal: row.goal,
    createdAt: row.created_at
  };
}

export function createProfileService(client: SupabaseClient): ProfileService {
  return {
    async getProfile() {
      const userId = await requireUserId(client);
      const { data, error } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();

      if (error) {
        throw error;
      }

      return data ? toUserProfile(data as ProfileRow) : null;
    },

    async hasProfile() {
      return (await this.getProfile()) !== null;
    },

    async saveProfile(values) {
      const result = validateProfile(values);

      if (!result.isValid || !result.value) {
        throw new Error(Object.values(result.errors)[0] ?? "Profile details are not ready to save.");
      }

      return this.saveProfileInput(result.value);
    },

    async saveProfileInput(input) {
      const userId = await requireUserId(client);
      const { data, error } = await client
        .from("profiles")
        .update({
          name: input.name,
          bodyweight: input.bodyweight,
          height: input.height,
          weight_unit: input.weightUnit,
          experience_level: input.experienceLevel,
          goal: input.goal
        })
        .eq("id", userId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      const profile = toUserProfile(data as ProfileRow);

      if (!profile) {
        throw new Error("Profile save completed but the profile could not be read back.");
      }

      return profile;
    }
  };
}

export const profileService: ProfileService = createProfileService(supabase);
