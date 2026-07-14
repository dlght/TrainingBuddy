import { fireEvent, render } from "@testing-library/react-native";

import { TappableExerciseImage } from "@/features/exercises/TappableExerciseImage";

describe("TappableExerciseImage", () => {
  it("shows the placeholder fallback with no tap target when there is no photo", async () => {
    const view = await render(
      <TappableExerciseImage
        image={{ kind: "placeholder", label: "Exercise image placeholder", path: "" }}
        label="Barbell Squat"
        thumbnailStyle={{}}
      />
    );

    expect(view.getByText("Exercise image placeholder")).toBeOnTheScreen();
    expect(view.queryByLabelText("View larger photo of Barbell Squat")).toBeNull();
  });

  it("opens a larger view on tap and closes it again on tapping the backdrop", async () => {
    const view = await render(
      <TappableExerciseImage
        image={{ kind: "remote", uri: "https://example.test/squat.jpg" }}
        label="Barbell Squat"
        thumbnailStyle={{}}
      />
    );

    expect(view.queryByLabelText("Close photo")).toBeNull();

    await fireEvent.press(view.getByLabelText("View larger photo of Barbell Squat"));
    expect(view.getByLabelText("Close photo")).toBeOnTheScreen();

    await fireEvent.press(view.getByLabelText("Close photo"));
    expect(view.queryByLabelText("Close photo")).toBeNull();
  });
});
