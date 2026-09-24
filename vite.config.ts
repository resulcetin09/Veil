import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [react(), wasm()],
  build: { target: 'es2022' },
  optimizeDeps: { exclude: ['@midnight-ntwrk/ledger-v8', '@midnight-ntwrk/onchain-runtime-v3'] },
  test: { include: ['tests/**/*.test.ts'], testTimeout: 20000 },
});
