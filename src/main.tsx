import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./global.css";
import App from "./app";

async function enableMocking() {
  // Enable mocking in development OR when no backend is available (like GitHub Pages)
  const isGitHubPages = window.location.hostname.includes("github.io");
  const isDevelopment = process.env.NODE_ENV === "development";
  
  if (!isDevelopment && !isGitHubPages) {
    return;
  }

  const { worker } = await import("./mocks/browser");

  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and ready to intercept requests.
  return worker.start();
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
