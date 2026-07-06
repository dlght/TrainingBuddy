export type SetLogFormValues = {
  setNumber?: string | number;
  reps: string | number;
  weight: string | number;
  effortRpe: string | number;
};

export type RestFormValue = string | number;

export type SetLogValidationErrors = Partial<
  Record<"setNumber" | "reps" | "weight" | "effortRpe", string>
>;

export type SetLogValidationResult = {
  isValid: boolean;
  errors: SetLogValidationErrors;
  value?: {
    setNumber?: number;
    reps: number;
    weight: number;
    effortRpe: number;
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

export function validateSetLogValues(values: SetLogFormValues): SetLogValidationResult {
  const errors: SetLogValidationErrors = {};
  const setNumber = values.setNumber === undefined ? undefined : integerFrom(values.setNumber);
  const reps = integerFrom(values.reps);
  const weight = numberFrom(values.weight);
  const effortRpe = integerFrom(values.effortRpe);

  if (values.setNumber !== undefined && (setNumber === undefined || setNumber === null || setNumber <= 0)) {
    errors.setNumber = "Set number must be a whole number above 0.";
  }

  if (reps === null || reps < 0) {
    errors.reps = "Reps must be a whole number at least 0.";
  }

  if (weight === null || weight < 0) {
    errors.weight = "Weight must be 0 or more.";
  }

  if (effortRpe === null || effortRpe < 1 || effortRpe > 10) {
    errors.effortRpe = "RPE must be a whole number from 1 to 10.";
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
      weight: weight as number,
      effortRpe: effortRpe as number
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
