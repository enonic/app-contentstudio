import {defineConfig} from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    reporters: ['minimal'],
    onConsoleLog: () => false,
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/build/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
      ],
    },
    server: {
      deps: {
        // Inline @enonic/ui and react-resizable-panels to avoid ESM/CJS interop issues with preact aliasing
        inline: ['@enonic/ui', /react-resizable-panels/],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/main/resources/assets/js'),
      // Force the ESM build so the react import below gets aliased (the CJS build would require() real react)
      'react-resizable-panels': 'react-resizable-panels/dist/react-resizable-panels.js',
      // Preact compat aliases for @testing-library/react
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
});
