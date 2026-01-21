import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {VirtuosoHandle} from 'react-virtuoso';
import {
    useContentComboboxData,
    type ContentFilterOptions,
    type ContentComboboxFlatNode,
} from '../../hooks/useContentComboboxData';
import {useDebouncedValue} from '../../utils/hooks/useDebouncedValue';

//
// * Types
//

export type UseContentComboboxControllerOptions = {
    /** Filter options for content requests */
    filters: ContentFilterOptions;
    /** Debounce delay for search input in milliseconds */
    debounceDelay?: number;
};

export type UseContentComboboxControllerReturn = {
    // Refs
    virtuosoRef: React.RefObject<VirtuosoHandle>;

    // View state
    open: boolean;
    isTreeView: boolean;
    inputValue: string;
    activeId: string | null;

    // State setters
    setOpen: (open: boolean) => void;
    setIsTreeView: (isTreeView: boolean) => void;
    setInputValue: (value: string) => void;
    setActiveId: (id: string | null) => void;

    // Handlers
    handleOpenChange: (next: boolean) => void;
    handleToggleView: (pressed: boolean) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
    handleExpand: (id: string) => void;
    handleCollapse: (id: string) => void;
    handleLoadMore: (parentId: string | null) => void;
    handleFlatListEndReached: () => void;

    // Derived values
    displayItems: ContentComboboxFlatNode[];
    listMode: 'tree' | 'flat';
    isLoading: boolean;
    hasMore: boolean;
    dropdownHeight: number;
    isFiltering: boolean;

    // Error handling
    error: Error | null;
    retry: () => void;
};

//
// * Constants
//

const ROW_HEIGHT = 48;
const MAX_HEIGHT = 300;
const GAP = 6;
const PADDING = 8;
const DEFAULT_DEBOUNCE_DELAY = 300;

//
// * Hook
//

/**
 * Controller hook for ContentCombobox that encapsulates all view state,
 * handlers, and derived values. This separates orchestration logic from
 * presentation, making the component more testable and maintainable.
 */
export function useContentComboboxController(
    options: UseContentComboboxControllerOptions,
): UseContentComboboxControllerReturn {
    const {filters, debounceDelay = DEFAULT_DEBOUNCE_DELAY} = options;

    // Refs
    const virtuosoRef = useRef<VirtuosoHandle>(null);

    // View state
    const [open, setOpen] = useState(false);
    const [isTreeView, setIsTreeView] = useState(true);
    const [inputValue, setInputValue] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);

    // Debounced search query - only updates after user stops typing
    const debouncedQuery = useDebouncedValue(inputValue, debounceDelay);

    // Memoize filter options to avoid recreating on every render
    const filterOptions: ContentFilterOptions = useMemo(() => ({
        contextContent: filters.contextContent,
        contentTypeNames: filters.contentTypeNames ? [...filters.contentTypeNames].sort() : undefined,
        allowedContentPaths: filters.allowedContentPaths ? [...filters.allowedContentPaths].sort() : undefined,
        applicationKey: filters.applicationKey,
    }), [filters.contextContent, filters.contentTypeNames, filters.allowedContentPaths, filters.applicationKey]);

    // Data hook
    const {
        tree,
        treeItems,
        isTreeLoading,
        treeHasMore,
        flatItems,
        isFlatLoading,
        flatHasMore,
        loadChildren,
        loadMoreChildren,
        loadMoreRoot,
        search,
        loadMoreFlat,
        error,
        retry,
    } = useContentComboboxData({
        filters: filterOptions,
        isOpen: open,
    });

    // Whether we're showing filtered (flat) results
    const isFiltering = inputValue.length > 0;

    // Track if we need to trigger a search
    const lastSearchedQueryRef = useRef<string | null>(null);

    // Load flat data when needed
    useEffect(() => {
        const needsFlatData = !isTreeView || isFiltering;

        if (!open || !needsFlatData) {
            lastSearchedQueryRef.current = null;
            return;
        }

        // Only search if the debounced query has changed
        if (lastSearchedQueryRef.current !== debouncedQuery) {
            lastSearchedQueryRef.current = debouncedQuery;
            void search(debouncedQuery);
        }
    }, [open, isTreeView, isFiltering, debouncedQuery, search]);

    // Reset search tracking when closed (preserves input value for UX)
    useEffect(() => {
        if (!open) {
            lastSearchedQueryRef.current = null;
        }
    }, [open]);

    // Reset active item when list changes
    useEffect(() => {
        if (!open) return;

        const items = isFiltering || !isTreeView ? flatItems : treeItems;
        const firstItem = items[0];

        if (firstItem) {
            const activeInList = activeId && items.some((item) => item.id === activeId);
            if (!activeInList) {
                setActiveId(firstItem.id);
            }
        } else {
            setActiveId(null);
        }
    }, [open, isFiltering, isTreeView, treeItems, flatItems, activeId]);

    // Choose items based on view mode and filter state
    const displayItems = useMemo(() => {
        // When filtering, both views use flat list results
        if (isFiltering) {
            return flatItems;
        }

        // No filter: tree view shows tree, flat view shows flat list
        if (isTreeView) {
            return treeItems;
        }

        // Flat view without filter
        return flatItems;
    }, [isTreeView, isFiltering, treeItems, flatItems]);

    // Calculate dropdown height based on display items
    const dropdownHeight = useMemo(() => {
        const count = displayItems.length;
        if (count === 0) return ROW_HEIGHT + PADDING;
        const contentHeight = count * ROW_HEIGHT + Math.max(count - 1, 0) * GAP + PADDING;
        return Math.min(contentHeight, MAX_HEIGHT);
    }, [displayItems.length]);

    // Handlers
    const handleOpenChange = useCallback((next: boolean): void => {
        setOpen(next);
    }, []);

    const handleToggleView = useCallback((pressed: boolean): void => {
        setIsTreeView(pressed);
        setActiveId(null);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>): void => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
            e.preventDefault();
            setIsTreeView((prev) => !prev);
        }
    }, []);

    const handleExpand = useCallback((id: string): void => {
        tree.expand(id);
        if (tree.needsChildrenLoad(id)) {
            void loadChildren(id);
        }
    }, [tree, loadChildren]);

    const handleCollapse = useCallback((id: string): void => {
        tree.collapse(id);
    }, [tree]);

    const handleLoadMore = useCallback((parentId: string | null): void => {
        if (parentId === null) {
            void loadMoreRoot();
            return;
        }

        if (tree.hasMoreChildren(parentId) && !tree.isLoading(parentId)) {
            void loadMoreChildren(parentId);
        }
    }, [tree, loadMoreChildren, loadMoreRoot]);

    const handleFlatListEndReached = useCallback(() => {
        if (!flatHasMore || isFlatLoading) return;
        void loadMoreFlat();
    }, [flatHasMore, isFlatLoading, loadMoreFlat]);

    // Derived values
    const isLoading = isFiltering ? isFlatLoading : (isTreeView ? isTreeLoading : isFlatLoading);
    const hasMore = isFiltering ? flatHasMore : (isTreeView ? treeHasMore : flatHasMore);
    const listMode = (isTreeView && !isFiltering) ? 'tree' : 'flat';

    return {
        // Refs
        virtuosoRef,

        // View state
        open,
        isTreeView,
        inputValue,
        activeId,

        // State setters
        setOpen,
        setIsTreeView,
        setInputValue,
        setActiveId,

        // Handlers
        handleOpenChange,
        handleToggleView,
        handleKeyDown,
        handleExpand,
        handleCollapse,
        handleLoadMore,
        handleFlatListEndReached,

        // Derived values
        displayItems,
        listMode,
        isLoading,
        hasMore,
        dropdownHeight,
        isFiltering,

        // Error handling
        error,
        retry,
    };
}
