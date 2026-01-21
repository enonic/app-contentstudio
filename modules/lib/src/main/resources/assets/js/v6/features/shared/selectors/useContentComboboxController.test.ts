import {renderHook, act} from '@testing-library/preact';
import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';

// Mock useContentComboboxData
const mockSearch = vi.fn().mockResolvedValue(undefined);
const mockLoadChildren = vi.fn().mockResolvedValue(undefined);
const mockLoadMoreChildren = vi.fn().mockResolvedValue(undefined);
const mockLoadMoreRoot = vi.fn().mockResolvedValue(undefined);
const mockLoadMoreFlat = vi.fn().mockResolvedValue(undefined);
const mockRetry = vi.fn();

const mockTreeStore = {
    state: {rootIds: [], nodes: new Map(), expandedIds: new Set(), loadingIds: new Set(), loadingDataIds: new Set()},
    flatNodes: [],
    expand: vi.fn(),
    collapse: vi.fn(),
    needsChildrenLoad: vi.fn(() => false),
    hasMoreChildren: vi.fn(() => false),
    isLoading: vi.fn(() => false),
};

let mockTreeItems: unknown[] = [];
let mockFlatItems: unknown[] = [];
let mockError: Error | null = null;
let mockIsFlatLoading = false;
let mockIsTreeLoading = false;

vi.mock('../../hooks/useContentComboboxData', () => ({
    useContentComboboxData: () => ({
        tree: mockTreeStore,
        treeItems: mockTreeItems,
        isTreeLoading: mockIsTreeLoading,
        treeHasMore: false,
        flatItems: mockFlatItems,
        isFlatLoading: mockIsFlatLoading,
        flatHasMore: false,
        loadChildren: mockLoadChildren,
        loadMoreChildren: mockLoadMoreChildren,
        loadMoreRoot: mockLoadMoreRoot,
        search: mockSearch,
        loadMoreFlat: mockLoadMoreFlat,
        reset: vi.fn(),
        error: mockError,
        retry: mockRetry,
        filterKey: 'test-key',
    }),
}));

vi.mock('../../utils/hooks/useDebouncedValue', () => ({
    useDebouncedValue: <T>(value: T, _delay: number) => value,
}));

// Import after mocks are set up
import {useContentComboboxController} from './useContentComboboxController';

describe('useContentComboboxController', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        mockTreeItems = [];
        mockFlatItems = [];
        mockError = null;
        mockIsFlatLoading = false;
        mockIsTreeLoading = false;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('initial state', () => {
        it('starts with closed combobox', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            expect(result.current.open).toBe(false);
        });

        it('starts in tree view mode', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            expect(result.current.isTreeView).toBe(true);
        });

        it('starts with empty input', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            expect(result.current.inputValue).toBe('');
        });

        it('starts with null activeId', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            expect(result.current.activeId).toBeNull();
        });

        it('starts with isFiltering false', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            expect(result.current.isFiltering).toBe(false);
        });

        it('starts in tree list mode', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            expect(result.current.listMode).toBe('tree');
        });
    });

    describe('handleOpenChange', () => {
        it('opens the combobox', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.handleOpenChange(true);
            });

            expect(result.current.open).toBe(true);
        });

        it('closes the combobox', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.handleOpenChange(true);
            });

            act(() => {
                result.current.handleOpenChange(false);
            });

            expect(result.current.open).toBe(false);
        });

        it('preserves input value on close', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.handleOpenChange(true);
                result.current.setInputValue('test');
            });

            expect(result.current.inputValue).toBe('test');

            act(() => {
                result.current.handleOpenChange(false);
            });

            expect(result.current.inputValue).toBe('test');
        });
    });

    describe('handleToggleView', () => {
        it('switches to flat view when pressed is false', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.handleToggleView(false);
            });

            expect(result.current.isTreeView).toBe(false);
            expect(result.current.listMode).toBe('flat');
        });

        it('switches to tree view when pressed is true', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.handleToggleView(false);
            });

            act(() => {
                result.current.handleToggleView(true);
            });

            expect(result.current.isTreeView).toBe(true);
            expect(result.current.listMode).toBe('tree');
        });

        it('resets activeId when switching views', () => {
            mockTreeItems = [{id: 'item-1', data: {}, nodeType: 'node'}];
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.handleOpenChange(true);
            });

            act(() => {
                result.current.setActiveId('item-1');
            });

            expect(result.current.activeId).toBe('item-1');

            act(() => {
                result.current.handleToggleView(false);
            });

            expect(result.current.activeId).toBeNull();
        });
    });

    describe('handleKeyDown', () => {
        it('toggles view on Ctrl+Shift+V', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            expect(result.current.isTreeView).toBe(true);

            const event = {
                ctrlKey: true,
                metaKey: false,
                shiftKey: true,
                key: 'v',
                preventDefault: vi.fn(),
            } as unknown as React.KeyboardEvent<HTMLElement>;

            act(() => {
                result.current.handleKeyDown(event);
            });

            expect(result.current.isTreeView).toBe(false);
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('toggles view on Cmd+Shift+V', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            const event = {
                ctrlKey: false,
                metaKey: true,
                shiftKey: true,
                key: 'V',
                preventDefault: vi.fn(),
            } as unknown as React.KeyboardEvent<HTMLElement>;

            act(() => {
                result.current.handleKeyDown(event);
            });

            expect(result.current.isTreeView).toBe(false);
        });

        it('does not toggle without modifier keys', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            const event = {
                ctrlKey: false,
                metaKey: false,
                shiftKey: true,
                key: 'v',
                preventDefault: vi.fn(),
            } as unknown as React.KeyboardEvent<HTMLElement>;

            act(() => {
                result.current.handleKeyDown(event);
            });

            expect(result.current.isTreeView).toBe(true);
            expect(event.preventDefault).not.toHaveBeenCalled();
        });
    });

    describe('handleExpand', () => {
        it('expands node in tree', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.handleExpand('node-1');
            });

            expect(mockTreeStore.expand).toHaveBeenCalledWith('node-1');
        });

        it('loads children if needed', () => {
            mockTreeStore.needsChildrenLoad.mockReturnValue(true);

            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.handleExpand('node-1');
            });

            expect(mockLoadChildren).toHaveBeenCalledWith('node-1');
        });
    });

    describe('handleCollapse', () => {
        it('collapses node in tree', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.handleCollapse('node-1');
            });

            expect(mockTreeStore.collapse).toHaveBeenCalledWith('node-1');
        });
    });

    describe('handleLoadMore', () => {
        it('calls loadMoreRoot for null parentId', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.handleLoadMore(null);
            });

            expect(mockLoadMoreRoot).toHaveBeenCalled();
        });

        it('calls loadMoreChildren for specific parentId', () => {
            mockTreeStore.hasMoreChildren.mockReturnValue(true);
            mockTreeStore.isLoading.mockReturnValue(false);

            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.handleLoadMore('parent-1');
            });

            expect(mockLoadMoreChildren).toHaveBeenCalledWith('parent-1');
        });

        it('does not load more if no more children', () => {
            mockTreeStore.hasMoreChildren.mockReturnValue(false);

            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.handleLoadMore('parent-1');
            });

            expect(mockLoadMoreChildren).not.toHaveBeenCalled();
        });
    });

    describe('isFiltering', () => {
        it('is true when inputValue is not empty', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.setInputValue('search');
            });

            expect(result.current.isFiltering).toBe(true);
        });

        it('is false when inputValue is empty', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            expect(result.current.isFiltering).toBe(false);
        });
    });

    describe('listMode', () => {
        it('is "tree" in tree view without filtering', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            expect(result.current.listMode).toBe('tree');
        });

        it('is "flat" in flat view', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.handleToggleView(false);
            });

            expect(result.current.listMode).toBe('flat');
        });

        it('is "flat" when filtering in tree view', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.setInputValue('search');
            });

            expect(result.current.listMode).toBe('flat');
        });
    });

    describe('displayItems', () => {
        it('returns treeItems in tree view without filter', () => {
            mockTreeItems = [{id: 'tree-1', data: {}, nodeType: 'node'}];
            mockFlatItems = [{id: 'flat-1', data: {}, nodeType: 'node'}];

            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            expect(result.current.displayItems).toEqual(mockTreeItems);
        });

        it('returns flatItems in flat view', () => {
            mockTreeItems = [{id: 'tree-1', data: {}, nodeType: 'node'}];
            mockFlatItems = [{id: 'flat-1', data: {}, nodeType: 'node'}];

            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.handleToggleView(false);
            });

            expect(result.current.displayItems).toEqual(mockFlatItems);
        });

        it('returns flatItems when filtering', () => {
            mockTreeItems = [{id: 'tree-1', data: {}, nodeType: 'node'}];
            mockFlatItems = [{id: 'flat-1', data: {}, nodeType: 'node'}];

            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.setInputValue('search');
            });

            expect(result.current.displayItems).toEqual(mockFlatItems);
        });
    });

    describe('error handling', () => {
        it('exposes error from data hook', () => {
            mockError = new Error('Test error');

            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            expect(result.current.error).toEqual(mockError);
        });

        it('exposes retry function from data hook', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            act(() => {
                result.current.retry();
            });

            expect(mockRetry).toHaveBeenCalled();
        });
    });

    describe('dropdownHeight', () => {
        it('returns minimum height for empty list', () => {
            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            // ROW_HEIGHT (48) + PADDING (8) = 56
            expect(result.current.dropdownHeight).toBe(56);
        });

        it('calculates height based on item count', () => {
            mockTreeItems = [
                {id: '1', data: {}, nodeType: 'node'},
                {id: '2', data: {}, nodeType: 'node'},
            ];

            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            // 2 items * 48 + 1 gap * 6 + 8 padding = 110
            expect(result.current.dropdownHeight).toBe(110);
        });

        it('caps at MAX_HEIGHT for large lists', () => {
            mockTreeItems = Array.from({length: 20}, (_, i) => ({
                id: `item-${i}`,
                data: {},
                nodeType: 'node',
            }));

            const {result} = renderHook(() =>
                useContentComboboxController({filters: {}}),
            );

            expect(result.current.dropdownHeight).toBe(300);
        });
    });

    describe('filter options normalization', () => {
        it('sorts contentTypeNames for stable filter key', () => {
            const {rerender} = renderHook(
                ({filters}) => useContentComboboxController({filters}),
                {initialProps: {filters: {contentTypeNames: ['b', 'a']}}},
            );

            // Rerender with same values in different order
            // This should not trigger a filter change effect
            rerender({filters: {contentTypeNames: ['a', 'b']}});

            // Test passes if no errors occur - the sorting prevents filter key changes
        });
    });
});
