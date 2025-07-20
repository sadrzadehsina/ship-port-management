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

  const { startWorker } = await import("./mocks/browser");

  // Start the worker with the correct service worker path
  return startWorker();
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
