import {renderHook} from '@testing-library/preact';
import {atom} from 'nanostores';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {SITE_PATH} from '../../../../utils/form/form';
import {type ContentSummary} from '../../../../../../app/content/ContentSummary';

vi.mock('../../../../store/context/contextContent.store', () => ({
    $contextContent: atom<unknown>(null),
}));

vi.mock('../../../../hooks/useI18n', () => ({
    useI18n: (key: string): string => key,
}));

vi.mock('./useSelectorInputHasError', () => ({
    useSelectorInputHasError: () => false,
}));

import {useSelectorInput} from './useSelectorInput';
import * as contextContentStore from '../../../../store/context/contextContent.store';

const $contextContent = contextContentStore.$contextContent;

const content = {getId: () => 'content-1'} as unknown as ContentSummary;

function makeProps(allowPath: string[]): Parameters<typeof useSelectorInput>[0] {
    const props = {
        values: [],
        onChange: vi.fn(),
        onAdd: vi.fn(),
        onRemove: vi.fn(),
        onMove: vi.fn(),
        occurrences: {getMaximum: () => 1},
        config: {allowPath, treeMode: false, hideToggleIcon: false},
        input: undefined,
        enabled: true,
        errors: [],
    };

    return props as unknown as Parameters<typeof useSelectorInput>[0];
}

describe('useSelectorInput', () => {
    afterEach(() => {
        $contextContent.set(null);
        vi.restoreAllMocks();
    });

    it('always passes the context content, even when allowPath is only the site wildcard', () => {
        $contextContent.set(content);

        const {result} = renderHook(() => useSelectorInput(makeProps([SITE_PATH])));

        expect(result.current.contextContent).toBe(content);
    });

    it('passes the context content for absolute allowPath as well', () => {
        $contextContent.set(content);

        const {result} = renderHook(() => useSelectorInput(makeProps(['/some/path'])));

        expect(result.current.contextContent).toBe(content);
    });

    it('returns undefined context content when there is no content in scope', () => {
        $contextContent.set(null);

        const {result} = renderHook(() => useSelectorInput(makeProps([SITE_PATH])));

        expect(result.current.contextContent).toBeUndefined();
    });
});
