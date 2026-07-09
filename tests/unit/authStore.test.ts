import { act, renderHook, waitFor } from "@testing-library/react-native";

// All jest.fn()s are created inline inside the factory (no references to
// outer variables) since jest.mock() factories run during module import,
// before any of this file's own top-level `const`/`let` statements have
// necessarily executed — see supabase import below for how the test reaches
// these same mock instances afterward.
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn()
    }
  }
}));

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/state/authStore";

const mockOnAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;
const mockSignInWithPassword = supabase.auth.signInWithPassword as jest.Mock;
const mockSignUp = supabase.auth.signUp as jest.Mock;
const mockSignOut = supabase.auth.signOut as jest.Mock;
const mockResetPasswordForEmail = supabase.auth.resetPasswordForEmail as jest.Mock;

function fireAuthStateChange(event: string, session: unknown) {
  const [[callback]] = mockOnAuthStateChange.mock.calls;
  callback(event, session);
}

describe("useAuthStore", () => {
  beforeEach(() => {
    mockSignInWithPassword.mockReset();
    mockSignUp.mockReset();
    mockSignOut.mockReset();
    mockResetPasswordForEmail.mockReset();
    useAuthStore.setState({ session: null, user: null, isHydrating: true });
  });

  it("subscribes to onAuthStateChange exactly once at store creation", () => {
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it("starts hydrating and resolves to signed-out once the initial auth event fires with no session", async () => {
    const { result } = await renderHook(() => useAuthStore());

    expect(result.current.isHydrating).toBe(true);

    await act(async () => {
      fireAuthStateChange("INITIAL_SESSION", null);
    });

    await waitFor(() => expect(result.current.isHydrating).toBe(false));
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("updates to signed-in when onAuthStateChange fires a session", async () => {
    const { result } = await renderHook(() => useAuthStore());
    const fakeSession = { user: { id: "user-1", email: "a@example.com" } };

    await act(async () => {
      fireAuthStateChange("SIGNED_IN", fakeSession);
    });

    await waitFor(() => expect(result.current.isHydrating).toBe(false));
    expect(result.current.session).toEqual(fakeSession);
    expect(result.current.user).toEqual(fakeSession.user);
  });

  it("clears session and user when signed out", async () => {
    const { result } = await renderHook(() => useAuthStore());
    const fakeSession = { user: { id: "user-1", email: "a@example.com" } };

    await act(async () => {
      fireAuthStateChange("SIGNED_IN", fakeSession);
    });
    await waitFor(() => expect(result.current.session).not.toBeNull());

    await act(async () => {
      fireAuthStateChange("SIGNED_OUT", null);
    });

    await waitFor(() => expect(result.current.session).toBeNull());
    expect(result.current.user).toBeNull();
  });

  it("signInWithPassword returns no error on success and an error message on failure", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null });
    const { result } = await renderHook(() => useAuthStore());

    let outcome = await result.current.signInWithPassword("a@example.com", "correct-password");
    expect(outcome.error).toBeNull();
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "a@example.com",
      password: "correct-password"
    });

    mockSignInWithPassword.mockResolvedValueOnce({ error: { message: "Invalid login credentials" } });
    outcome = await result.current.signInWithPassword("a@example.com", "wrong-password");
    expect(outcome.error).toBe("Invalid login credentials");
  });

  it("signUp surfaces an already-registered error message", async () => {
    mockSignUp.mockResolvedValueOnce({ error: { message: "User already registered" } });
    const { result } = await renderHook(() => useAuthStore());

    const outcome = await result.current.signUp("a@example.com", "some-password");
    expect(outcome.error).toBe("User already registered");
  });

  it("resetPasswordForEmail delegates to Supabase and reports errors", async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });
    const { result } = await renderHook(() => useAuthStore());

    const outcome = await result.current.resetPasswordForEmail("a@example.com");
    expect(outcome.error).toBeNull();
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("a@example.com");
  });

  it("signOut delegates to Supabase", async () => {
    mockSignOut.mockResolvedValueOnce(undefined);
    const { result } = await renderHook(() => useAuthStore());

    await result.current.signOut();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
