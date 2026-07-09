/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render, waitFor } from "@testing-library/react-native";

const mockPush = jest.fn();
const mockResetPasswordForEmail = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush })
}));

jest.mock("@/state/authStore", () => ({
  useAuthStore: (selector: (state: { resetPasswordForEmail: jest.Mock }) => unknown) =>
    selector({ resetPasswordForEmail: mockResetPasswordForEmail })
}));

const ForgotPasswordScreen = require("../../app/(auth)/forgot-password").default;

describe("ForgotPasswordScreen", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockResetPasswordForEmail.mockReset();
  });

  it("shows a confirmation state after a successful reset request", async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });
    const view = await render(<ForgotPasswordScreen />);

    await fireEvent.changeText(view.getByLabelText("Email"), "a@example.com");
    await fireEvent.press(view.getByLabelText("Send reset email"));

    await waitFor(() => expect(mockResetPasswordForEmail).toHaveBeenCalledWith("a@example.com"));
    expect(await view.findByText(/Check your email/)).toBeTruthy();
  });

  it("surfaces an inline error and does not show the confirmation state", async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: "Something went wrong" });
    const view = await render(<ForgotPasswordScreen />);

    await fireEvent.changeText(view.getByLabelText("Email"), "a@example.com");
    await fireEvent.press(view.getByLabelText("Send reset email"));

    expect(await view.findByText("Something went wrong")).toBeTruthy();
    expect(view.queryByText(/Check your email/)).toBeNull();
  });
});
