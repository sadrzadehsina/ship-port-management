import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./global.css";
import App from "./app";

async function enableMocking() {
  const { startWorker } = await import('./mocks/browser');
  
  return startWorker();
}enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
