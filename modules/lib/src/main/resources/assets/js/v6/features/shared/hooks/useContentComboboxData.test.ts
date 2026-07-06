/**
 * Tests for useContentComboboxData hook.
 *
 * Note: This hook has complex async dependencies that make direct unit testing
 * challenging. These tests focus on the core functionality that can be tested
 * without full async mocking.
 *
 * Integration tests with the actual API would provide more comprehensive coverage.
 */
import { describe, expect, it, vi } from 'vitest';

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

vi.mock('../../../shared/lib/cms/content/workflow', () => ({
    calcContentState: vi.fn(() => null),
}));

vi.mock('../../../shared/lib/cms/content/prettify', () => ({
    resolveDisplayName: vi.fn((c) => c?.getDisplayName?.() ?? 'Display Name'),
    resolveSubName: vi.fn((c) => c?.getName?.() ?? 'sub-name'),
}));

// Import types for testing
import { getLoadingNodeParentId } from './useContentComboboxData';

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
});
