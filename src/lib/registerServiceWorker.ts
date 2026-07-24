import { Platform } from "react-native";

export function registerServiceWorker() {
  if (Platform.OS !== "web") {
    return;
  }
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }
  navigator.serviceWorker.register("/service-worker.js").catch((error) => {
    console.warn("Service worker registration failed", error);
  });
}
