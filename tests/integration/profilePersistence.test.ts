import { createProfileService } from "@/features/profile/profileService";

import { createFakeSupabaseClient } from "../helpers/fakeSupabase";

describe("profile persistence", () => {
  it("returns null until the signup-created row is filled in, then persists and re-reads it", async () => {
    // Mirrors the real world: a profiles row always exists after signup
    // (created by the DB trigger), but starts out with null fields.
    const client = createFakeSupabaseClient(
      { profiles: [{ id: "u1", name: null, bodyweight: null, height: null, weight_unit: null, experience_level: null, goal: null, created_at: "2026-01-01T00:00:00.000Z" }] },
      "u1"
    );
    const service = createProfileService(client);

    expect(await service.getProfile()).toBeNull();
    expect(await service.hasProfile()).toBe(false);

    await service.saveProfile({
      name: "Dana",
      bodyweight: "155",
      height: "",
      weightUnit: "lb",
      experienceLevel: "some_experience",
      goal: "Get stronger"
    });

    const reloadedService = createProfileService(client);
    const profile = await reloadedService.getProfile();

    expect(profile).toMatchObject({
      id: "u1",
      name: "Dana",
      bodyweight: 155,
      height: null,
      weightUnit: "lb",
      experienceLevel: "some_experience",
      goal: "Get stronger"
    });
    expect(await reloadedService.hasProfile()).toBe(true);
  });
});
