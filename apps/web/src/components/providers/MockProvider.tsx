'use client';

import { useEffect } from 'react';

export function MockProvider() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_MOCK !== 'true') {
      return;
    }

    const initMsw = async () => {
      if (typeof window === 'undefined') return;

      const { enableMocking } = await import('@/mocks/browser');
      await enableMocking();
    };

    initMsw();
  }, []);

  return null;
}
