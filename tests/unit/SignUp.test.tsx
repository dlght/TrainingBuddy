/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render, waitFor } from "@testing-library/react-native";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSignUp = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush, replace: mockReplace })
}));

jest.mock("@/state/authStore", () => ({
  useAuthStore: (selector: (state: { signUp: jest.Mock }) => unknown) => selector({ signUp: mockSignUp })
}));

const SignUpScreen = require("../../app/(auth)/sign-up").default;

describe("SignUpScreen", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockSignUp.mockReset();
  });

  it("creates an account with matching passwords and navigates to the dashboard", async () => {
    mockSignUp.mockResolvedValueOnce({ error: null });
    const view = await render(<SignUpScreen />);

    await fireEvent.changeText(view.getByLabelText("Email"), "a@example.com");
    await fireEvent.changeText(view.getByLabelText("Password"), "some-password");
    await fireEvent.changeText(view.getByLabelText("Confirm password"), "some-password");
    await fireEvent.press(view.getByLabelText("Create account"));

    await waitFor(() => expect(mockSignUp).toHaveBeenCalledWith("a@example.com", "some-password"));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  it("rejects mismatched passwords without calling signUp", async () => {
    const view = await render(<SignUpScreen />);

    await fireEvent.changeText(view.getByLabelText("Email"), "a@example.com");
    await fireEvent.changeText(view.getByLabelText("Password"), "some-password");
    await fireEvent.changeText(view.getByLabelText("Confirm password"), "different-password");
    await fireEvent.press(view.getByLabelText("Create account"));

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("surfaces an already-registered error inline", async () => {
    mockSignUp.mockResolvedValueOnce({ error: "User already registered" });
    const view = await render(<SignUpScreen />);

    await fireEvent.changeText(view.getByLabelText("Email"), "a@example.com");
    await fireEvent.changeText(view.getByLabelText("Password"), "some-password");
    await fireEvent.changeText(view.getByLabelText("Confirm password"), "some-password");
    await fireEvent.press(view.getByLabelText("Create account"));

    expect(await view.findByText("User already registered")).toBeTruthy();
  });

  it("navigates back to sign-in", async () => {
    const view = await render(<SignUpScreen />);

    await fireEvent.press(view.getByLabelText("Already have an account? Sign in"));
    expect(mockPush).toHaveBeenCalledWith("/sign-in");
  });
});
