import "@testing-library/jest-native/extend-expect";

// `usePreventRemove` needs a real NavigationContainer/navigator tree (route
// key, navigation object) that unit tests rendering a single screen in
// isolation don't set up. Screens that use it don't test the confirm-leave
// flow at this level (that needs a real navigator), so a no-op is fine here.
jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");

  return {
    ...actual,
    usePreventRemove: jest.fn()
  };
});

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
  mergeItem: jest.fn(async () => undefined),
  clear: jest.fn(async () => undefined),
  getAllKeys: jest.fn(async () => []),
  multiGet: jest.fn(async () => []),
  multiSet: jest.fn(async () => undefined),
  multiRemove: jest.fn(async () => undefined),
  multiMerge: jest.fn(async () => undefined)
}));

if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
  process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
}
if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
}
