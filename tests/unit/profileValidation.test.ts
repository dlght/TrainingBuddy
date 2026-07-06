import { validateProfile } from "@/features/profile/profileValidation";

describe("validateProfile", () => {
  it("accepts complete profile details and trims text", () => {
    const result = validateProfile({
      name: "  Alex  ",
      bodyweight: "82.5",
      height: "178",
      weightUnit: "kg",
      experienceLevel: "new",
      goal: "Build consistency"
    });

    expect(result).toEqual({
      isValid: true,
      errors: {},
      value: {
        name: "Alex",
        bodyweight: 82.5,
        height: 178,
        weightUnit: "kg",
        experienceLevel: "new",
        goal: "Build consistency"
      }
    });
  });

  it("requires name, positive bodyweight, valid height, and goal", () => {
    const result = validateProfile({
      name: " ",
      bodyweight: "0",
      height: "-1",
      weightUnit: "lb",
      experienceLevel: "returning",
      goal: ""
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toMatchObject({
      name: "Add your name.",
      bodyweight: "Enter a bodyweight greater than 0.",
      height: "Enter a height greater than 0, or leave it blank.",
      goal: "Choose a goal."
    });
  });
});
