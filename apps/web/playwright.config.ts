import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

export default defineConfig({
  testDir: './e2e',
  timeout: 90000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_ENABLE_MOCK: 'true',
    },
  },
  projects: [
    {
      name: 'edge-desktop',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: existsSync(edgePath) ? { executablePath: edgePath } : undefined,
      },
    },
  ],
});
