import { defineConfig } from 'vitest/config';
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
            exclude: ['src/**/*.d.ts', 'src/**/*.spec.ts', 'src/**/*.test.ts'],
        },
        server: {
            deps: {
                // Inline UI dependencies so their React imports also follow the Preact aliases.
                inline: [
                    '@enonic/ui',
                    '@enonic/input-types',
                    '@enonic/ui-utils',
                    '@radix-ui/react-slot',
                    '@radix-ui/react-compose-refs',
                    'lucide-react',
                    /react-resizable-panels/,
                ],
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src/main/resources/assets/js'),
            // Force the ESM build so the react import below gets aliased (the CJS build would require() real react)
            'react-resizable-panels': 'react-resizable-panels/dist/react-resizable-panels.js',
            // Preact compat aliases for @testing-library/react
            react: 'preact/compat',
            'react-dom': 'preact/compat',
            'react-dom/test-utils': 'preact/test-utils',
            'react/jsx-runtime': 'preact/jsx-runtime',
        },
    },
});
