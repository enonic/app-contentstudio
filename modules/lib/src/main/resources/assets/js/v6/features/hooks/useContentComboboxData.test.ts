/**
 * Tests for useContentComboboxData hook.
 *
 * Note: This hook has complex async dependencies that make direct unit testing
 * challenging. These tests focus on the core functionality that can be tested
 * without full async mocking.
 *
 * Integration tests with the actual API would provide more comprehensive coverage.
 */
import {describe, expect, it, vi} from 'vitest';

// Mock all external dependencies before importing the hook
vi.mock('../../../app/resource/ContentTreeSelectorQueryRequest', () => ({
    ContentTreeSelectorQueryRequest: vi.fn(() => ({
        setFrom: vi.fn().mockReturnThis(),
        setSize: vi.fn().mockReturnThis(),
        setExpand: vi.fn().mockReturnThis(),
        setParentPath: vi.fn().mockReturnThis(),
        setChildOrder: vi.fn().mockReturnThis(),
        sendAndParse: vi.fn().mockResolvedValue([]),
        getMetadata: vi.fn().mockReturnValue({getTotalHits: () => 0}),
    })),
}));

vi.mock('../../../app/resource/ContentSelectorQueryRequest', () => ({
    ContentSelectorQueryRequest: vi.fn(() => ({
        setFrom: vi.fn().mockReturnThis(),
        setSize: vi.fn().mockReturnThis(),
        setExpand: vi.fn().mockReturnThis(),
        setSearchString: vi.fn().mockReturnThis(),
        setAppendLoadResults: vi.fn().mockReturnThis(),
        sendAndParse: vi.fn().mockResolvedValue([]),
        getMetadata: vi.fn().mockReturnValue({getTotalHits: () => 0, getHits: () => 0}),
    })),
}));

vi.mock('../../../app/resource/ContentSummaryAndCompareStatusFetcher', () => ({
    ContentSummaryAndCompareStatusFetcher: class {
        createRootChildOrder = vi.fn(() => ({}));
        updateReadonlyAndCompareStatus = vi.fn((items) => Promise.resolve(items));
    },
}));

vi.mock('../store/content.store', () => ({
    setContents: vi.fn(),
}));

vi.mock('../utils/cms/content/applyContentFilters', () => ({
    applyContentFilters: vi.fn(),
}));

vi.mock('../utils/cms/content/workflow', () => ({
    calcWorkflowStateStatus: vi.fn(() => null),
}));

vi.mock('../utils/cms/content/prettify', () => ({
    resolveDisplayName: vi.fn((c) => c?.getDisplayName?.() ?? 'Display Name'),
    resolveSubName: vi.fn((c) => c?.getName?.() ?? 'sub-name'),
}));

vi.mock('@enonic/lib-admin-ui/rest/Expand', () => ({
    Expand: {SUMMARY: 'summary'},
}));

vi.mock('../../../app/resource/order/ChildOrder', () => ({
    ChildOrder: vi.fn(),
}));

// Import types for testing
import {getLoadingNodeParentId} from './useContentComboboxData';

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
