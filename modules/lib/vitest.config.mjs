import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        clearMocks: false,
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
                    /@dnd-kit\//,
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
            // Force ESM builds so React imports follow the Preact aliases instead of requiring real React.
            '@dnd-kit/core': '@dnd-kit/core/dist/core.esm.js',
            '@dnd-kit/sortable': '@dnd-kit/sortable/dist/sortable.esm.js',
            '@dnd-kit/utilities': '@dnd-kit/utilities/dist/utilities.esm.js',
            '@dnd-kit/accessibility': '@dnd-kit/accessibility/dist/accessibility.esm.js',
            'react-resizable-panels': 'react-resizable-panels/dist/react-resizable-panels.js',
            'lucide-react': path.resolve(__dirname, './node_modules/lucide-react/dist/esm/lucide-react.mjs'),
            // Preact compat aliases for @testing-library/react
            react: 'preact/compat',
            'react-dom': 'preact/compat',
            'react-dom/test-utils': 'preact/test-utils',
            'react/jsx-runtime': 'preact/jsx-runtime',
        },
    },
});
