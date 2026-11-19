import type { PropertySet } from '@enonic/lib-admin-ui/data/PropertySet';
import { PropertyTree } from '@enonic/lib-admin-ui/data/PropertyTree';
import { type ServerErrorEntry, ServerErrorsProvider } from '@enonic/lib-admin-ui/form2';
import { renderHook } from '@testing-library/preact';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useSetServerErrors } from './useSetChildErrors';

function createOccurrences(): PropertySet[] {
    const root = new PropertyTree().getRoot();
    root.addPropertySet('choice');
    root.addPropertySet('choice');
    return root
        .getPropertyArray('choice')
        .getProperties()
        .map((property) => property.getPropertySet());
}

function renderServerErrors(entries: ServerErrorEntry[] | undefined): Map<number, boolean> {
    const occurrences = createOccurrences();
    const { result } = renderHook(() => useSetServerErrors(occurrences), {
        wrapper: ({ children }: { children?: ReactNode }) =>
            entries === undefined
                ? createElement('div', null, children)
                : createElement(
                      ServerErrorsProvider,
                      { entries, clear: () => undefined, clearField: () => undefined },
                      children,
                  ),
    });
    return result.current;
}

describe('useSetServerErrors', () => {
    it('marks the first occurrence for an error on a field inside it', () => {
        const errors = renderServerErrors([{ path: 'choice.color.value', message: 'no' }]);

        expect(errors.get(0)).toBe(true);
        expect(errors.get(1)).toBe(false);
    });

    it('marks a later occurrence by its index', () => {
        const errors = renderServerErrors([{ path: 'choice[1].color.value', message: 'no' }]);

        expect(errors.get(0)).toBe(false);
        expect(errors.get(1)).toBe(true);
    });

    it('marks nothing for an error on another field with the same prefix', () => {
        const errors = renderServerErrors([{ path: 'choices.value', message: 'no' }]);

        expect(errors.get(0)).toBe(false);
        expect(errors.get(1)).toBe(false);
    });

    it('marks nothing without a provider', () => {
        expect(renderServerErrors(undefined).size).toBe(0);
    });
});
