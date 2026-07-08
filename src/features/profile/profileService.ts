import type { DatabaseAdapter } from "@/db/client";
import { createProfileRepository } from "@/db/repositories/profileRepository";
import type { SaveUserProfileInput, UserProfile } from "@/models/user";

import type { ProfileFormValues } from "./profileValidation";
import { validateProfile } from "./profileValidation";

export type ProfileRepository = ReturnType<typeof createProfileRepository>;

export type ProfileService = {
  getProfile(): Promise<UserProfile | null>;
  hasProfile(): Promise<boolean>;
  saveProfile(values: ProfileFormValues): Promise<UserProfile>;
  saveProfileInput(input: SaveUserProfileInput): Promise<UserProfile>;
};

export function createProfileService(repository: ProfileRepository): ProfileService {
  return {
    getProfile() {
      return repository.getProfile();
    },

    async hasProfile() {
      return (await repository.getProfile()) !== null;
    },

    async saveProfile(values) {
      const result = validateProfile(values);

      if (!result.isValid || !result.value) {
        throw new Error(Object.values(result.errors)[0] ?? "Profile details are not ready to save.");
      }

      return repository.saveProfile(result.value);
    },

    saveProfileInput(input) {
      return repository.saveProfile(input);
    }
  };
}

export function createProfileServiceForDatabase(database: DatabaseAdapter): ProfileService {
  return createProfileService(createProfileRepository(database));
}

async function createRuntimeProfileService(): Promise<ProfileService> {
  const { getReadyDatabaseClient } = await import("@/db/client");
  const { adapter } = await getReadyDatabaseClient();

  return createProfileServiceForDatabase(adapter);
}

export const profileService: ProfileService = {
  async getProfile() {
    return (await createRuntimeProfileService()).getProfile();
  },

  async hasProfile() {
    return (await createRuntimeProfileService()).hasProfile();
  },

  async saveProfile(values) {
    return (await createRuntimeProfileService()).saveProfile(values);
  },

  async saveProfileInput(input) {
    return (await createRuntimeProfileService()).saveProfileInput(input);
  }
};
