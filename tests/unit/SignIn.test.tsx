/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render, waitFor } from "@testing-library/react-native";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSignInWithPassword = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush, replace: mockReplace })
}));

jest.mock("@/state/authStore", () => ({
  useAuthStore: (selector: (state: { signInWithPassword: jest.Mock }) => unknown) =>
    selector({ signInWithPassword: mockSignInWithPassword })
}));

const SignInScreen = require("../../app/(auth)/sign-in").default;

describe("SignInScreen", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockSignInWithPassword.mockReset();
  });

  it("signs in with the entered credentials and navigates to the dashboard", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null });
    const view = await render(<SignInScreen />);

    await fireEvent.changeText(view.getByLabelText("Email"), "a@example.com");
    await fireEvent.changeText(view.getByLabelText("Password"), "correct-password");
    await fireEvent.press(view.getByLabelText("Sign in"));

    await waitFor(() =>
      expect(mockSignInWithPassword).toHaveBeenCalledWith("a@example.com", "correct-password")
    );
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  it("surfaces an inline error on a wrong password", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: "Invalid login credentials" });
    const view = await render(<SignInScreen />);

    await fireEvent.changeText(view.getByLabelText("Email"), "a@example.com");
    await fireEvent.changeText(view.getByLabelText("Password"), "wrong-password");
    await fireEvent.press(view.getByLabelText("Sign in"));

    expect(await view.findByText("Invalid login credentials")).toBeTruthy();
  });

  it("navigates to sign-up and forgot-password", async () => {
    const view = await render(<SignInScreen />);

    await fireEvent.press(view.getByLabelText("New here? Create an account"));
    expect(mockPush).toHaveBeenCalledWith("/sign-up");

    await fireEvent.press(view.getByLabelText("Forgot password?"));
    expect(mockPush).toHaveBeenCalledWith("/forgot-password");
  });
});
