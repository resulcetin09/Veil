import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), wasm()],
  base: process.env.VITE_BASE_PATH || "/",
  resolve: {
    alias: {
      assert: "assert/",
      "isomorphic-ws": fileURLToPath(
        new URL("./src/lib/browser-websocket.ts", import.meta.url),
      ),
    },
  },
  build: { target: "es2022" },
  optimizeDeps: {
    exclude: [
      "@midnight-ntwrk/ledger-v8",
      "@midnight-ntwrk/onchain-runtime-v3",
    ],
  },
  test: { include: ["tests/**/*.test.ts"], testTimeout: 20000 },
});
