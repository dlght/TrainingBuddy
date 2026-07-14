import { render } from "@testing-library/react-native";

import { SetProgressDots } from "@/features/sessions/SetProgressDots";

describe("SetProgressDots", () => {
  it("exposes the completed/total count for accessibility regardless of dot count", async () => {
    const threeSets = await render(<SetProgressDots completed={1} total={3} />);
    expect(threeSets.getByLabelText("1 of 3 sets logged")).toBeOnTheScreen();

    const sevenSets = await render(<SetProgressDots completed={4} total={7} />);
    expect(sevenSets.getByLabelText("4 of 7 sets logged")).toBeOnTheScreen();
  });
});
