import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { ProfileForm } from "@/features/profile/ProfileForm";
import { defaultProfileDraft, useProfileSetupStore } from "@/state/profileSetupStore";

describe("ProfileForm", () => {
  beforeEach(() => {
    useProfileSetupStore.setState({ draft: defaultProfileDraft });
  });

  it("shows required-field errors before saving", async () => {
    const onSubmit = jest.fn();

    const view = await render(<ProfileForm onSubmit={onSubmit} />);

    await fireEvent.changeText(view.getByLabelText("Name"), "");
    await fireEvent.changeText(view.getByLabelText("Bodyweight"), "");
    await fireEvent.press(view.getByText("Save profile"));

    expect(await view.findByText("Add your name.")).toBeOnTheScreen();
    expect(view.getByText("Enter a bodyweight greater than 0.")).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits entered details with lb selected", async () => {
    const onSubmit = jest.fn();

    const view = await render(<ProfileForm onSubmit={onSubmit} />);

    await fireEvent.changeText(view.getByLabelText("Name"), "Mira");
    await fireEvent.changeText(view.getByLabelText("Bodyweight"), "140");
    await fireEvent.press(view.getByText("lb"));
    await fireEvent.press(view.getByText("Some experience"));
    await fireEvent.press(view.getByText("Get stronger"));
    await fireEvent.press(view.getByText("Save profile"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Mira",
      bodyweight: "140",
      height: "",
      weightUnit: "lb",
      experienceLevel: "some_experience",
      goal: "Get stronger"
    });
  });
});
