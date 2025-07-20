import { setupWorker } from 'msw/browser'

import { handlers } from './handlers'

// Configure service worker path for GitHub Pages
const getServiceWorkerPath = () => {
  const isGitHubPages = window.location.hostname.includes("github.io");
  if (isGitHubPages) {
    // GitHub Pages serves from /ship-port-management/ subdirectory
    return '/ship-port-management/mockServiceWorker.js';
  }
  // Local development
  return '/mockServiceWorker.js';
};
 
export const worker = setupWorker(...handlers)

// Configure the worker with the correct service worker path
export const startWorker = () => {
  return worker.start({
    serviceWorker: {
      url: getServiceWorkerPath()
    }
  });
};