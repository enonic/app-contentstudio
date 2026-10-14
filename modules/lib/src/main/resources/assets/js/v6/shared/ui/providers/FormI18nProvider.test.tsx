import type { Translate } from '@enonic/ui-utils';
import { cleanup, render } from '@testing-library/preact';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let translate: Translate | undefined;

vi.mock('@enonic/ui', () => ({
    I18nProvider: ({ translate: t, children }: { translate: Translate; children: ReactNode }) => {
        translate = t;
        return <>{children}</>;
    },
}));

import { setPhrases } from '../../i18n';
import { FormI18nProvider } from './FormI18nProvider';

describe('FormI18nProvider', () => {
    beforeEach(() => {
        translate = undefined;
        setPhrases({
            'enonic.inputTypes.set.add': 'Legg til',
            'enonic.inputTypes.occurrence.breaksMin': 'Minst {0} gyldige forekomster',
        });
        render(<FormI18nProvider>child</FormI18nProvider>);
    });

    afterEach(() => {
        cleanup();
        setPhrases({});
    });

    it('answers a toolkit key from the phrases, with its placeholders filled', () => {
        expect(translate?.('enonic.inputTypes.set.add', { defaultValue: 'Add', values: [] })).toBe('Legg til');
        expect(translate?.('enonic.inputTypes.occurrence.breaksMin', { defaultValue: 'Min {0}', values: [2] })).toBe(
            'Minst 2 gyldige forekomster',
        );
    });

    it("leaves a key the phrases lack to the toolkit's own English", () => {
        expect(translate?.('enonic.inputTypes.set.delete', { defaultValue: 'Delete', values: [] })).toBe('Delete');
    });
});
