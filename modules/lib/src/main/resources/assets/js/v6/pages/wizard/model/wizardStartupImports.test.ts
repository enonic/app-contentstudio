import { describe, expect, it } from 'vitest';

// The wizard shell is part of the application bundle, so everything it imports is
// evaluated at start-up, before the application is configured. The preview widgets
// store fetches its data on import and never retries; loading it that early leaves
// the preview without widgets, in the browse panel too.

const HERE = 'v6/pages/wizard/model/wizardStartupImports.test.ts';
const ENTRY = 'v6/pages/wizard/ui/layout/WizardAppShell.tsx';
const FORBIDDEN = 'v6/widgets/inspectors/model/liveViewWidgets.store.ts';
const IMPORT = /(?:import|export)\s[^'"]*?from\s+['"](\.[^'"]+)['"]|import\(\s*['"](\.[^'"]+)['"]\s*\)/g;

/** Resolves a relative specifier against the file that contains it, as a path from the sources root. */
function join(from: string, specifier: string): string {
    const parts = from.split('/').slice(0, -1);

    for (const part of specifier.split('/')) {
        if (part === '..') parts.pop();
        else if (part !== '.') parts.push(part);
    }

    return parts.join('/');
}

// Vite keys the modules by their path relative to this file.
const sources = new Map(
    Object.entries(
        import.meta.glob('../../../../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<
            string,
            string
        >,
    ).map(([key, source]) => [join(HERE, key), source]),
);

const has = (file: string): boolean => sources.has(file);

function resolveModule(from: string, specifier: string): string | undefined {
    const base = join(from, specifier);

    return [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].find(has);
}

function staticImports(file: string): string[] {
    const source = sources.get(file) ?? '';
    const result: string[] = [];

    for (const match of source.matchAll(IMPORT)) {
        // a dynamic import is a separate chunk, and a type import is erased
        if (match[2] != null || /^import\s+type\s/.test(match[0])) continue;

        const resolved = resolveModule(file, match[1]);
        if (resolved) result.push(resolved);
    }

    return result;
}

function findPath(entry: string, target: string): string[] | undefined {
    const queue: string[][] = [[entry]];
    const seen = new Set([entry]);

    while (queue.length > 0) {
        const path = queue.shift() as string[];
        const file = path[path.length - 1];

        if (file === target) return path;

        for (const next of staticImports(file)) {
            if (seen.has(next)) continue;
            seen.add(next);
            queue.push([...path, next]);
        }
    }

    return undefined;
}

describe('wizard start-up imports', () => {
    it('should know the files it checks', () => {
        expect(has(ENTRY)).toBe(true);
        expect(has(FORBIDDEN)).toBe(true);
    });

    it('should not load the preview widgets store with the application', () => {
        expect(findPath(ENTRY, FORBIDDEN)).toBeUndefined();
    });
});
