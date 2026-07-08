import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { SetLogEditor } from "@/features/sessions/SetLogEditor";

describe("SetLogEditor", () => {
  it("pre-fills reps and weight from defaults and logs a set with a single tap", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const view = await render(<SetLogEditor defaultReps={10} defaultWeight={42.5} onSubmit={onSubmit} />);

    expect(view.getByLabelText("Reps").props.value).toBe("10");
    expect(view.getByLabelText("Weight").props.value).toBe("42.5");

    await fireEvent.press(view.getByLabelText("Submit set log"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({ reps: "10", weight: "42.5" });
  });

  it("re-applies the default reps after logging so the next set is also one-tap", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const view = await render(<SetLogEditor defaultReps={8} defaultWeight={20} onSubmit={onSubmit} />);

    await fireEvent.changeText(view.getByLabelText("Reps"), "6");
    await fireEvent.press(view.getByLabelText("Submit set log"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({ reps: "6", weight: "20" });
    expect(view.getByLabelText("Reps").props.value).toBe("8");
  });

  it("carries forward a manually-typed weight between sets when there is no configured default", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const view = await render(<SetLogEditor onSubmit={onSubmit} />);

    await fireEvent.changeText(view.getByLabelText("Reps"), "10");
    await fireEvent.changeText(view.getByLabelText("Weight"), "30");
    await fireEvent.press(view.getByLabelText("Submit set log"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(view.getByLabelText("Reps").props.value).toBe("");
    expect(view.getByLabelText("Weight").props.value).toBe("30");
  });

  it("hides the weight field for bodyweight exercises even when a default weight is passed", async () => {
    const view = await render(<SetLogEditor isBodyweight defaultWeight={20} onSubmit={jest.fn()} />);

    expect(view.queryByLabelText("Weight")).toBeNull();
  });

  it("blocks logging while resting and shows the remaining time", async () => {
    const view = await render(
      <SetLogEditor isResting restRemainingSeconds={65} onSkipRest={jest.fn()} onSubmit={jest.fn()} />
    );

    expect(view.getByText("Rest 01:05")).toBeOnTheScreen();
    expect(view.getByText("Resting…")).toBeOnTheScreen();
    expect(view.getByLabelText("Submit set log").props.accessibilityState?.disabled).toBe(true);
    expect(view.getByLabelText("Skip rest").props.accessibilityState?.disabled).toBe(false);
  });

  it("grays out skip rest when not resting", async () => {
    const view = await render(<SetLogEditor restRemainingSeconds={90} onSkipRest={jest.fn()} onSubmit={jest.fn()} />);

    expect(view.getByLabelText("Skip rest").props.accessibilityState?.disabled).toBe(true);
  });
});
