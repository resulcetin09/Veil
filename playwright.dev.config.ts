import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

// Production bundling and Vite's dependency optimizer resolve modules differently.
// Exercise the same lazy imports against a real development server as well.
export default defineConfig({
  ...config,
  grep: /compiled contract demo|real SDK|local demo cannot load|structured wallet network rejection|connects a Preview wallet/,
  workers: process.env.CI ? 2 : 1,
  outputDir: "test-results/dev",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report/dev" }],
  ],
  use: { ...config.use, baseURL: "http://127.0.0.1:5180" },
  webServer: {
    command: "npm run dev -- --port 5180 --strictPort",
    url: "http://127.0.0.1:5180",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
