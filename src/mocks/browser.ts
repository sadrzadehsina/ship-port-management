import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

const getServiceWorkerUrl = () => {
  if (import.meta.env.PROD && window.location.pathname.startsWith('/ship-port-management/')) {
    return '/ship-port-management/mockServiceWorker.js';
  }
  return '/mockServiceWorker.js';
};

export const worker = setupWorker(...handlers);

export const startWorker = () => {
  return worker.start({
    serviceWorker: {
      url: getServiceWorkerUrl()
    }
  });
};