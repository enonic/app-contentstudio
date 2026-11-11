import { act, renderHook, waitFor } from '@testing-library/preact';
import { okAsync } from 'neverthrow';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../../entities/content', async () => {
    const { atom } = await import('nanostores');
    return { $contextContent: atom(null) };
});
vi.mock('../../../../../entities/project', async () => {
    const { atom } = await import('nanostores');
    return { $activeProject: atom(undefined) };
});
vi.mock('../../../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string): string => key,
}));
vi.mock('../../../../../entities/content/api/uploadMedia.api', () => ({
    uploadMediaFile: vi.fn(),
}));

import type { ContentSummary } from '../../../../../../app/content/ContentSummary';
import type { Project } from '../../../../../../app/settings/data/project/Project';
import { uploadMediaFile } from '../../../../../entities/content/api/uploadMedia.api';
import { FormScopeProvider, type FormScope } from '../../../form/FormScopeContext';
import { useSelectorUpload } from './useSelectorUpload';

const project = { getName: () => 'edited' } as unknown as Project;
const content = { getId: () => 'parent-1' } as unknown as ContentSummary;

const scoped =
    (scope: FormScope) =>
    ({ children }: { children: ReactNode }) => <FormScopeProvider {...scope}>{children}</FormScopeProvider>;

describe('useSelectorUpload', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('canUpload', () => {
        it('should be true with a content in scope', () => {
            const { result } = renderHook(() => useSelectorUpload({ selection: [], onSelectionChange: vi.fn() }), {
                wrapper: scoped({ project, content }),
            });

            expect(result.current.canUpload).toBe(true);
        });

        it('should be true with a project and no content in scope', () => {
            const { result } = renderHook(() => useSelectorUpload({ selection: [], onSelectionChange: vi.fn() }), {
                wrapper: scoped({ project, content: null }),
            });

            expect(result.current.canUpload).toBe(true);
        });

        it('should be false with neither a project nor a content in scope', () => {
            const { result } = renderHook(() => useSelectorUpload({ selection: [], onSelectionChange: vi.fn() }), {
                wrapper: scoped({ project: null, content: null }),
            });

            expect(result.current.canUpload).toBe(false);
        });
    });

    it('should upload to the root of the scoped project and select the result without a content', async () => {
        const created = { getId: () => 'new-1' };
        vi.mocked(uploadMediaFile).mockReturnValue(
            okAsync({ mediaIdentifier: 'a.png', content: created }) as ReturnType<typeof uploadMediaFile>,
        );
        const onSelectionChange = vi.fn();

        const { result } = renderHook(() => useSelectorUpload({ selection: ['old-1'], onSelectionChange }), {
            wrapper: scoped({ project, content: null }),
        });

        await act(async () => {
            result.current.handleFiles([new File(['x'], 'a.png', { type: 'image/png' })]);
        });

        expect(uploadMediaFile).toHaveBeenCalledWith(
            expect.objectContaining({ parentContent: undefined, projectName: 'edited' }),
        );
        await waitFor(() => expect(onSelectionChange).toHaveBeenCalledWith(['old-1', 'new-1']));
    });
});
