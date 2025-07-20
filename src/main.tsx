import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./global.css";
import App from "./app";

async function enableMocking() {
  // Enable mocking in development and production (GitHub Pages)
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
