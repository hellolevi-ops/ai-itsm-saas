import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

let workerStartPromise: Promise<void> | null = null;

export async function enableMocking() {
  if (typeof window === 'undefined') {
    return;
  }

  if (process.env.NEXT_PUBLIC_ENABLE_MOCK !== 'true') {
    return;
  }

  if (!workerStartPromise) {
    workerStartPromise = worker
      .start({
        onUnhandledRequest: 'bypass',
      })
      .then(() => undefined)
      .catch((error) => {
        if (String(error).includes('already enabled')) {
          return;
        }

        workerStartPromise = null;
        throw error;
      });
  }

  await workerStartPromise;
}
