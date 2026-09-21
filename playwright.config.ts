import { defineConfig } from "@playwright/test";

export default defineConfig({
  webServer: {
    command: "pnpm exec vite dev --host 127.0.0.1 --port 5888",
    url: "http://127.0.0.1:5888",
    reuseExistingServer: true,
  },
  timeout: 10000,
  use: {
    baseURL: "http://127.0.0.1:5888",
  },
  projects: [
    {
      name: "chromium",
      testMatch: "**/*.e2e.{ts,js}",
      testIgnore: "**/*.no-js.e2e.{ts,js}",
    },
    {
      name: "chromium-no-js",
      testMatch: "**/*.no-js.e2e.{ts,js}",
      use: { javaScriptEnabled: false },
    },
  ],
});
