import {
  validateRestSeconds,
  validateSetLogValues
} from "@/features/sessions/sessionValidation";

describe("session validation", () => {
  it("accepts completed set values and normalizes numbers", () => {
    const result = validateSetLogValues({
      setNumber: "2",
      reps: "10",
      weight: "35.5",
      effortRpe: "8"
    });

    expect(result).toEqual({
      isValid: true,
      errors: {},
      value: {
        setNumber: 2,
        reps: 10,
        weight: 35.5,
        effortRpe: 8
      }
    });
  });

  it("rejects negative reps, weight, invalid RPE, and invalid set number", () => {
    const result = validateSetLogValues({
      setNumber: "0",
      reps: "-1",
      weight: "-5",
      effortRpe: "11"
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual({
      setNumber: "Set number must be a whole number above 0.",
      reps: "Reps must be a whole number at least 0.",
      weight: "Weight must be 0 or more.",
      effortRpe: "RPE must be a whole number from 1 to 10."
    });
  });

  it("validates adjustable rest duration", () => {
    expect(validateRestSeconds("90")).toEqual({ isValid: true, errors: {}, value: 90 });
    expect(validateRestSeconds("-1")).toEqual({
      isValid: false,
      errors: { restSeconds: "Rest must be 0 seconds or more." }
    });
  });
});
