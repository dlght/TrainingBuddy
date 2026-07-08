export type SetLogFormValues = {
  setNumber?: string | number;
  reps: string | number;
  weight?: string | number;
};

export type RestFormValue = string | number;

export type SetLogValidationErrors = Partial<
  Record<"setNumber" | "reps" | "weight", string>
>;

export type SetLogValidationResult = {
  isValid: boolean;
  errors: SetLogValidationErrors;
  value?: {
    setNumber?: number;
    reps: number;
    weight: number | null;
  };
};

export type RestValidationResult = {
  isValid: boolean;
  errors: {
    restSeconds?: string;
  };
  value?: number;
};

function numberFrom(value: string | number): number | null {
  const parsed = typeof value === "number" ? value : Number(value.trim());

  return Number.isFinite(parsed) ? parsed : null;
}

function integerFrom(value: string | number): number | null {
  const parsed = numberFrom(value);

  if (parsed === null || !Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

export function validateSetLogValues(
  values: SetLogFormValues,
  isBodyweight = false
): SetLogValidationResult {
  const errors: SetLogValidationErrors = {};
  const setNumber = values.setNumber === undefined ? undefined : integerFrom(values.setNumber);
  const reps = integerFrom(values.reps);
  const weightProvided = values.weight !== undefined && String(values.weight).trim() !== "";
  const weight = weightProvided ? numberFrom(values.weight as string | number) : null;

  if (values.setNumber !== undefined && (setNumber === undefined || setNumber === null || setNumber <= 0)) {
    errors.setNumber = "Set number must be a whole number above 0.";
  }

  if (reps === null || reps < 0) {
    errors.reps = "Reps must be a whole number at least 0.";
  }

  if (!isBodyweight && !weightProvided) {
    errors.weight = "Weight is required for this exercise.";
  } else if (weightProvided && (weight === null || weight < 0)) {
    errors.weight = "Weight must be 0 or more.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      isValid: false,
      errors
    };
  }

  return {
    isValid: true,
    errors,
    value: {
      setNumber: setNumber ?? undefined,
      reps: reps as number,
      weight
    }
  };
}

export function validateRestSeconds(value: RestFormValue): RestValidationResult {
  const restSeconds = integerFrom(value);

  if (restSeconds === null || restSeconds < 0) {
    return {
      isValid: false,
      errors: {
        restSeconds: "Rest must be 0 seconds or more."
      }
    };
  }

  return {
    isValid: true,
    errors: {},
    value: restSeconds
  };
}

export function formatSetLogValidationErrors(errors: SetLogValidationErrors): string {
  return Object.values(errors)[0] ?? "Set details are not ready to save.";
}
