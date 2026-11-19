import type { PropertySet } from '@enonic/lib-admin-ui/data/PropertySet';
import { PropertyTree } from '@enonic/lib-admin-ui/data/PropertyTree';
import type { FormOptionSet } from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import { ServerErrorsProvider } from '@enonic/lib-admin-ui/form2';
import { act, renderHook } from '@testing-library/preact';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@enonic/lib-admin-ui/notify/MessageBus', () => ({ showWarning: vi.fn() }));
vi.mock('@enonic/lib-admin-ui/util/Messages', () => ({ i18n: (key: string) => key }));

import { useOptionSetSelection } from './useOptionSetSelection';

const createOptionSet = (isRadio: boolean): FormOptionSet =>
    ({
        isRadioSelection: () => isRadio,
        getOptions: () => ['a', 'b'].map((name) => ({ getName: () => name })),
    }) as unknown as FormOptionSet;

// The second occurrence, so that the cleared path carries an index.
function createOccurrence(): PropertySet {
    const root = new PropertyTree().getRoot();
    root.addPropertySet('opts');
    const occurrence = root.addPropertySet('opts');
    occurrence.addString('_selected', 'a');
    occurrence.addPropertySet('a').addString('text', 'rejected');
    return occurrence;
}

function renderSelection(isRadio: boolean) {
    const optionSet = createOptionSet(isRadio);
    const occurrence = createOccurrence();
    const clearField = vi.fn();
    const { result } = renderHook(() => useOptionSetSelection(optionSet, occurrence), {
        wrapper: ({ children }: { children?: ReactNode }) =>
            createElement(ServerErrorsProvider, { entries: [], clear: () => undefined, clearField }, children),
    });
    return { result, clearField };
}

describe('useOptionSetSelection', () => {
    it('drops the server errors under an option that is unticked', async () => {
        const { result, clearField } = renderSelection(false);

        await act(() => result.current.toggle('b'));
        expect(clearField).not.toHaveBeenCalled();

        await act(() => result.current.toggle('a'));
        expect(clearField).toHaveBeenCalledExactlyOnceWith('opts[1].a');
    });

    it('drops the server errors under the option a radio choice replaces', async () => {
        const { result, clearField } = renderSelection(true);

        await act(() => result.current.select('a'));
        expect(clearField).not.toHaveBeenCalled();

        await act(() => result.current.select('b'));
        expect(clearField).toHaveBeenCalledExactlyOnceWith('opts[1].a');
    });
});
