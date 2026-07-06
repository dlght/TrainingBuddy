import { create } from "zustand";

import type { UserProfile } from "@/models/user";
import type { ProfileFormValues } from "@/features/profile/profileValidation";
import { profileToFormValues } from "@/features/profile/profileValidation";

export const defaultProfileDraft: ProfileFormValues = {
  name: "",
  bodyweight: "",
  height: "",
  weightUnit: "kg",
  experienceLevel: "new",
  goal: "Build consistency"
};

type ProfileSetupStore = {
  draft: ProfileFormValues;
  updateDraft: (field: keyof ProfileFormValues, value: string) => void;
  hydrateFromProfile: (profile: UserProfile) => void;
  resetDraft: () => void;
};

export const useProfileSetupStore = create<ProfileSetupStore>((set) => ({
  draft: defaultProfileDraft,
  updateDraft: (field, value) =>
    set((state) => ({
      draft: {
        ...state.draft,
        [field]: value
      }
    })),
  hydrateFromProfile: (profile) => set({ draft: profileToFormValues(profile) }),
  resetDraft: () => set({ draft: defaultProfileDraft })
}));
