import { renderHook } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SITE_PATH } from '../../../../../shared/lib/form/form';
import { type ContentSummary } from '../../../../../../app/content/ContentSummary';

const { mockFormScope } = vi.hoisted(() => ({
    mockFormScope: vi.fn<() => { project: unknown; content: unknown }>(),
}));

vi.mock('../../FormScopeContext', () => ({
    useFormScope: () => mockFormScope(),
}));

vi.mock('../../../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string): string => key,
}));

vi.mock('./useSelectorInputHasError', () => ({
    useSelectorInputHasError: () => false,
}));

import { useSelectorInput } from './useSelectorInput';

const content = { getId: () => 'content-1' } as unknown as ContentSummary;

function makeProps(allowPath: string[]): Parameters<typeof useSelectorInput>[0] {
    const props = {
        values: [],
        onChange: vi.fn(),
        onAdd: vi.fn(),
        onRemove: vi.fn(),
        onMove: vi.fn(),
        occurrences: { getMaximum: () => 1 },
        config: { allowPath, treeMode: false, hideToggleIcon: false },
        input: undefined,
        enabled: true,
        errors: [],
    };

    return props as unknown as Parameters<typeof useSelectorInput>[0];
}

describe('useSelectorInput', () => {
    afterEach(() => {
        mockFormScope.mockReset();
        vi.restoreAllMocks();
    });

    it('always passes the scoped content, even when allowPath is only the site wildcard', () => {
        mockFormScope.mockReturnValue({ project: undefined, content });

        const { result } = renderHook(() => useSelectorInput(makeProps([SITE_PATH])));

        expect(result.current.contextContent).toBe(content);
    });

    it('passes the scoped content for absolute allowPath as well', () => {
        mockFormScope.mockReturnValue({ project: undefined, content });

        const { result } = renderHook(() => useSelectorInput(makeProps(['/some/path'])));

        expect(result.current.contextContent).toBe(content);
    });

    it('returns undefined context content when there is no content in scope', () => {
        mockFormScope.mockReturnValue({ project: undefined, content: undefined });

        const { result } = renderHook(() => useSelectorInput(makeProps([SITE_PATH])));

        expect(result.current.contextContent).toBeUndefined();
    });
});
