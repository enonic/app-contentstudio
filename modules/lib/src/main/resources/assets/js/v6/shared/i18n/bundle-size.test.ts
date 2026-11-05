import { describe, expect, it } from 'vitest';

// Nashorn drops properties past this count when XP's getPhrases() turns a bundle into a script
// object, so the tool page silently loses the last keys of any bundle larger than this.
const MAX_BUNDLE_KEYS = 511;

const bundles = import.meta.glob('../../../../../i18n/*.properties', {
    query: '?raw',
    import: 'default',
    eager: true,
}) as Record<string, string>;

function countKeys(bundle: string): number {
    let count = 0;

    for (const line of bundle.split('\n')) {
        const separator = line.indexOf('=');
        if (line.startsWith('#') || separator === -1) continue;

        count++;
    }

    return count;
}

describe('i18n bundles against the Nashorn object limit', () => {
    it('should have bundles to check', () => {
        expect(Object.keys(bundles).length).toBeGreaterThan(0);
    });

    it.each(Object.entries(bundles).map(([path, bundle]) => [path.split('/').pop(), bundle]))(
        'should keep %s at or below 511 keys',
        (_name, bundle) => {
            expect(countKeys(bundle)).toBeLessThanOrEqual(MAX_BUNDLE_KEYS);
        },
    );
});
