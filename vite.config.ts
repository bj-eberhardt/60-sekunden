import react from '@vitejs/plugin-react';
import packageJson from './package.json' with { type: 'json' };
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  test: {
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
  },
});
