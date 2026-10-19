import { themeSwitcherPhrases } from '@enonic/ui-kit';
import { comparePhrases, type Phrases } from '@enonic/ui-utils';
import { describe, expect, it, vi } from 'vitest';
import bundle from '../../../../../i18n/phrases.properties?raw';

// The kit's entry pulls in every component, and together they name more of @enonic/ui than the
// mock in vitest.setup.ts defines. Nothing renders here, so any name resolves to a stand-in.
vi.mock(
    '@enonic/ui',
    () => new Proxy({}, { has: () => true, get: (_, name) => (name === 'then' ? undefined : () => null) }),
);

function readBundle(): Phrases {
    const phrases: Record<string, string> = {};

    for (const line of bundle.split('\n')) {
        const separator = line.indexOf('=');
        if (line.startsWith('#') || separator === -1) continue;

        phrases[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }

    return phrases;
}

describe('phrases.properties against the kit', () => {
    it('should carry every label of the kit components in use, placeholders and all', () => {
        expect(comparePhrases(themeSwitcherPhrases, readBundle())).toEqual({
            missing: [],
            placeholderMismatch: [],
        });
    });
});
