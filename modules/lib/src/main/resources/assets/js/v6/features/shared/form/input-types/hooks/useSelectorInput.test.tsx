import { renderHook } from '@testing-library/preact';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SITE_PATH } from '../../../../../shared/lib/form/form';
import { type ContentSummary } from '../../../../../../app/content/ContentSummary';

vi.mock('../../../../../entities/content', async () => {
    const { atom } = await import('nanostores');
    return { $contextContent: atom<unknown>(null) };
});
vi.mock('../../../../../entities/project', async () => {
    const { atom } = await import('nanostores');
    return { $activeProject: atom(undefined) };
});

vi.mock('../../../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string): string => key,
}));

vi.mock('./useSelectorInputHasError', () => ({
    useSelectorInputHasError: () => false,
}));

import { $contextContent } from '../../../../../entities/content';
import { FormScopeProvider } from '../../FormScopeContext';
import { useSelectorInput } from './useSelectorInput';

const content = { getId: () => 'content-1' } as unknown as ContentSummary;
const storeContent = { getId: () => 'store-content' } as unknown as ContentSummary;

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

const scoped =
    (scopeContent: ContentSummary | null) =>
    ({ children }: { children: ReactNode }) => <FormScopeProvider content={scopeContent}>{children}</FormScopeProvider>;

describe('useSelectorInput', () => {
    afterEach(() => {
        ($contextContent as unknown as { set: (value: unknown) => void }).set(null);
        vi.restoreAllMocks();
    });

    it('always passes the scoped content, even when allowPath is only the site wildcard', () => {
        const { result } = renderHook(() => useSelectorInput(makeProps([SITE_PATH])), { wrapper: scoped(content) });

        expect(result.current.contextContent).toBe(content);
    });

    it('passes the scoped content for absolute allowPath as well', () => {
        const { result } = renderHook(() => useSelectorInput(makeProps(['/some/path'])), {
            wrapper: scoped(content),
        });

        expect(result.current.contextContent).toBe(content);
    });

    it('returns undefined context content when the scope has none, even with a context content in the store', () => {
        ($contextContent as unknown as { set: (value: unknown) => void }).set(storeContent);

        const { result } = renderHook(() => useSelectorInput(makeProps([SITE_PATH])), { wrapper: scoped(null) });

        expect(result.current.contextContent).toBeUndefined();
    });

    it('falls back to the context content in the store without a provider', () => {
        ($contextContent as unknown as { set: (value: unknown) => void }).set(storeContent);

        const { result } = renderHook(() => useSelectorInput(makeProps([SITE_PATH])));

        expect(result.current.contextContent).toBe(storeContent);
    });
});
