/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render } from "@testing-library/react-native";

const mockPush = jest.fn();
const mockSignOut = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush })
}));

jest.mock("@/state/authStore", () => ({
  useAuthStore: (
    selector: (state: { user: { email: string } | null; signOut: jest.Mock }) => unknown
  ) => selector({ user: { email: "athlete@example.com" }, signOut: mockSignOut })
}));

const { AccountMenu } = require("../../src/features/account/AccountMenu");

describe("AccountMenu", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSignOut.mockReset();
  });

  it("shows the signed-in email only once opened", async () => {
    const view = await render(<AccountMenu />);

    expect(view.queryByText("athlete@example.com")).toBeNull();

    await fireEvent.press(view.getByLabelText("Account menu"));

    expect(view.getByText("athlete@example.com")).toBeOnTheScreen();
  });

  it("navigates to the profile screen", async () => {
    const view = await render(<AccountMenu />);

    await fireEvent.press(view.getByLabelText("Account menu"));
    await fireEvent.press(view.getByLabelText("Profile"));

    expect(mockPush).toHaveBeenCalledWith("/profile/setup");
  });

  it("signs out", async () => {
    const view = await render(<AccountMenu />);

    await fireEvent.press(view.getByLabelText("Account menu"));
    await fireEvent.press(view.getByLabelText("Sign out"));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("closes without acting when the backdrop is tapped", async () => {
    const view = await render(<AccountMenu />);

    await fireEvent.press(view.getByLabelText("Account menu"));
    expect(view.getByText("athlete@example.com")).toBeOnTheScreen();

    await fireEvent.press(view.getByLabelText("Close account menu"));

    expect(view.queryByText("athlete@example.com")).toBeNull();
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
