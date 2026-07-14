'use client';

import { useEffect } from 'react';

export function MockProvider() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_MOCK !== 'true') {
      return;
    }

    const initMsw = async () => {
      if (typeof window === 'undefined') return;

      const { worker } = await import('@/mocks/browser');
      await worker.start({
        onUnhandledRequest: 'bypass',
      });
    };

    initMsw();
  }, []);

  return null;
}
