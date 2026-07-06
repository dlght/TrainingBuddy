import { createProfileServiceForDatabase } from "@/features/profile/profileService";
import { TestDatabase } from "../helpers/testDatabase";

describe("profile persistence", () => {
  it("saves a profile and reads it through a re-created service", async () => {
    const database = new TestDatabase();
    const firstService = createProfileServiceForDatabase(database);

    await firstService.saveProfile({
      name: "Dana",
      bodyweight: "155",
      height: "",
      weightUnit: "lb",
      experienceLevel: "some_experience",
      goal: "Get stronger"
    });

    const reloadedService = createProfileServiceForDatabase(database);
    const profile = await reloadedService.getProfile();

    expect(profile).toMatchObject({
      id: "local-user",
      name: "Dana",
      bodyweight: 155,
      height: null,
      weightUnit: "lb",
      experienceLevel: "some_experience",
      goal: "Get stronger"
    });
  });
});
