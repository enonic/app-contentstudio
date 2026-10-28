/**
 * Tests for useContentComboboxData hook.
 *
 * Note: This hook has complex async dependencies that make direct unit testing
 * challenging. These tests focus on the core functionality that can be tested
 * without full async mocking.
 *
 * Integration tests with the actual API would provide more comprehensive coverage.
 */
import { act, renderHook } from '@testing-library/preact';
import { okAsync } from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { ContentId } from '../../../../app/content/ContentId';
import { ContentName } from '../../../../app/content/ContentName';
import { ContentPath } from '../../../../app/content/ContentPath';
import { ContentSummaryBuilder, type ContentSummary } from '../../../../app/content/ContentSummary';
import { ContentSummaryAndCompareStatus } from '../../../../app/content/ContentSummaryAndCompareStatus';
import { ContentTreeSelectorItem } from '../../../../app/item/ContentTreeSelectorItem';
import { contentSelectorQuery, contentTreeSelectorQuery } from '../../../entities/content/api/selectorQuery.api';
import { setContents } from '../../../entities/content/model/content.commands';
import { getContent } from '../../../entities/content/model/content.store';

// Mock the selector-query api the hook drives, so importing the hook stays cheap.
vi.mock('../../../entities/content/api/selectorQuery.api', async () => {
    const { okAsync } = await import('neverthrow');
    return {
        contentSelectorQuery: vi.fn(() => okAsync({ contents: [], hits: 0, totalHits: 0 })),
        contentTreeSelectorQuery: vi.fn(() => okAsync({ items: [], totalHits: 0 })),
    };
});

vi.mock('../../../entities/content/api/contentQuery.api', async () => {
    const { okAsync } = await import('neverthrow');
    return {
        fetchReadOnlyContentIds: vi.fn(() => okAsync([])),
        listContentByParent: vi.fn(() => okAsync({ contents: [], totalHits: 0 })),
        listContentIdsByParent: vi.fn(() => okAsync([])),
        queryContent: vi.fn(() => okAsync({ contents: [], totalHits: 0, aggregations: [] })),
    };
});

vi.mock('../../../entities/content/model/content.commands', () => ({
    setContent: vi.fn(),
    setContents: vi.fn(),
    removeContent: vi.fn(),
    clearProjectContentCache: vi.fn(),
    clearAllContentCaches: vi.fn(),
}));

vi.mock('../../../entities/content/model/content.store', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    getContent: vi.fn(() => undefined),
}));

vi.mock('../../../shared/lib/cms/content/workflow', () => ({
    calcContentState: vi.fn(() => null),
}));

vi.mock('../../../shared/lib/cms/content/prettify', () => ({
    resolveDisplayName: vi.fn((c) => c?.getDisplayName?.() ?? 'Display Name'),
    resolveSubName: vi.fn((c) => c?.getName?.() ?? 'sub-name'),
}));

// Import types for testing
import { getLoadingNodeParentId, useContentComboboxData } from './useContentComboboxData';

//
// * Fixtures
//

const createSummary = (id: string): ContentSummary =>
    new ContentSummaryBuilder()
        .setId(id)
        .setContentId(new ContentId(id))
        .setName(new ContentName(id))
        .setDisplayName(id)
        .setPath(ContentPath.create().fromString(`/${id}`).build())
        .setType(ContentTypeName.FOLDER)
        .build();

const createTreeItem = (summary: ContentSummary): ContentTreeSelectorItem =>
    ContentTreeSelectorItem.create().setContent(ContentSummaryAndCompareStatus.fromContentSummary(summary)).build();

describe('useContentComboboxData', () => {
    describe('getLoadingNodeParentId', () => {
        it('returns null for root loading node', () => {
            const result = getLoadingNodeParentId('__loading__root__5');
            expect(result).toBeNull();
        });

        it('returns parent ID for child loading node', () => {
            const result = getLoadingNodeParentId('__loading__parent123__5');
            expect(result).toBe('parent123');
        });

        it('handles various loading node ID formats', () => {
            expect(getLoadingNodeParentId('__loading__root__0')).toBeNull();
            expect(getLoadingNodeParentId('__loading__root__100')).toBeNull();
            expect(getLoadingNodeParentId('__loading__abc123__10')).toBe('abc123');
            expect(getLoadingNodeParentId('__loading__node-with-dashes__5')).toBe('node-with-dashes');
        });

        it('returns null for IDs without loading prefix', () => {
            // Non-loading node IDs return null
            const result = getLoadingNodeParentId('regular-node-id');
            expect(result).toBeNull();
        });
    });

    describe('helper functions', () => {
        it('re-exports getLoadingNodeParentId from tree-store', () => {
            // Verify the function is exported
            expect(typeof getLoadingNodeParentId).toBe('function');
        });
    });

    // A layer shares ids with its parent, so the cache must be keyed by the scoped project.
    describe('scoped project cache', () => {
        const folder = createSummary('folder');

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('caches a flat search under the scoped project', async () => {
            vi.mocked(contentSelectorQuery).mockReturnValue(okAsync({ contents: [folder], hits: 1, totalHits: 1 }));
            const { result } = renderHook(() =>
                useContentComboboxData({ filters: { projectName: 'layer-b' }, isOpen: false }),
            );

            await act(() => result.current.search('folder'));

            expect(setContents).toHaveBeenCalledWith([folder], 'layer-b');
        });

        it('caches and reads tree items under the scoped project', async () => {
            vi.mocked(contentTreeSelectorQuery).mockReturnValue(
                okAsync({ items: [createTreeItem(folder)], totalHits: 1 }),
            );
            const { result } = renderHook(() =>
                useContentComboboxData({ filters: { projectName: 'layer-b' }, isOpen: false }),
            );

            await act(() => result.current.loadTree());

            expect(setContents).toHaveBeenCalledWith([folder], 'layer-b');
            expect(getContent).toHaveBeenCalledWith('folder', 'layer-b');
        });
    });
});
