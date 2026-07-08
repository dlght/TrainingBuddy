import {
  validateRestSeconds,
  validateSetLogValues
} from "@/features/sessions/sessionValidation";

describe("session validation", () => {
  it("accepts completed set values and normalizes numbers", () => {
    const result = validateSetLogValues({
      setNumber: "2",
      reps: "10",
      weight: "35.5"
    });

    expect(result).toEqual({
      isValid: true,
      errors: {},
      value: {
        setNumber: 2,
        reps: 10,
        weight: 35.5
      }
    });
  });

  it("rejects negative reps, weight, invalid RPE, and invalid set number", () => {
    const result = validateSetLogValues({
      setNumber: "0",
      reps: "-1",
      weight: "-5"
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual({
      setNumber: "Set number must be a whole number above 0.",
      reps: "Reps must be a whole number at least 0.",
      weight: "Weight must be 0 or more."
    });
  });

  it("does not require weight for bodyweight exercises", () => {
    const result = validateSetLogValues({ setNumber: "1", reps: "12" }, true);

    expect(result).toEqual({
      isValid: true,
      errors: {},
      value: {
        setNumber: 1,
        reps: 12,
        weight: null
      }
    });
  });

  it("still validates a weight value if one is provided for a bodyweight exercise", () => {
    const result = validateSetLogValues({ setNumber: "1", reps: "12", weight: "-5" }, true);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual({ weight: "Weight must be 0 or more." });
  });

  it("still requires weight for non-bodyweight exercises", () => {
    const result = validateSetLogValues({ setNumber: "1", reps: "12" }, false);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual({ weight: "Weight is required for this exercise." });
  });

  it("validates adjustable rest duration", () => {
    expect(validateRestSeconds("90")).toEqual({ isValid: true, errors: {}, value: 90 });
    expect(validateRestSeconds("-1")).toEqual({
      isValid: false,
      errors: { restSeconds: "Rest must be 0 seconds or more." }
    });
  });
});
