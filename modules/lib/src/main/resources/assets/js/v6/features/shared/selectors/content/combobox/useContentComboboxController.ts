import { type KeyboardEvent, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';
import {
    useContentComboboxData,
    type ContentFilterOptions,
    type ContentComboboxFlatNode,
} from '../../../hooks/useContentComboboxData';
import { useDebouncedValue } from '../../../../../shared/lib/hooks/useDebouncedValue';
import { isBlank } from '../../../../../shared/lib/format/isBlank';

//
// * Types
//

export type UseContentComboboxControllerOptions = {
    /** Filter options for content requests */
    filters: ContentFilterOptions;
    /** Debounce delay for search input in milliseconds */
    debounceDelay?: number;
    /** List mode */
    listMode?: 'tree' | 'flat';
    /** Dropdown options */
    dropdown?: {
        /** Height for each tree row in pixels */
        treeRowHeight?: number;
        /** Height for each flat row in pixels */
        flatRowHeight?: number;
        /** If set, the flat row height will be calculated as a percentage of the container's width */
        flatRowHeightRatio?: number;
        /** Maximum height for the dropdown in pixels */
        maxHeight?: number;
    };
};

export type UseContentComboboxControllerReturn = {
    // Refs
    virtuosoRef: RefObject<VirtuosoHandle>;
    inputRef: RefObject<HTMLInputElement | null>;

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
    handleKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
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

    // Error handling
    error: Error | null;
    retry: () => void;
};

//
// * Constants
//

const TREE_ROW_HEIGHT = 48;
const FLAT_ROW_HEIGHT = 48;
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
    const { filters, dropdown, debounceDelay = DEFAULT_DEBOUNCE_DELAY, listMode: externalListMode = 'tree' } = options;

    // Dropdown options
    const treeRowHeight = dropdown?.treeRowHeight ?? TREE_ROW_HEIGHT;
    const flatRowHeight = dropdown?.flatRowHeight ?? FLAT_ROW_HEIGHT;
    const flatRowHeightRatio = dropdown?.flatRowHeightRatio;
    const maxHeight = dropdown?.maxHeight ?? MAX_HEIGHT;

    // Refs
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Configured default view, restored when the search value is cleared.
    const defaultIsTree = externalListMode === 'tree';

    // View state
    const [open, setOpen] = useState(false);
    const [isTreeView, setIsTreeView] = useState(defaultIsTree);
    const [inputValue, setInputValue] = useState('');
    const [activeId, setActiveId] = useState<string | null>(null);

    // Debounced search query - only updates after user stops typing
    const debouncedQuery = useDebouncedValue(inputValue, debounceDelay);

    // Tree view filters the tree itself; flat view drives the flat search instead.
    const treeQuery = isTreeView && !isBlank(debouncedQuery) ? debouncedQuery : '';

    // Memoize filter options to avoid recreating on every render
    const filterOptions: ContentFilterOptions = useMemo(
        () => ({
            contextContent: filters.contextContent,
            contentTypeNames: filters.contentTypeNames ? [...filters.contentTypeNames].sort() : undefined,
            allowedContentPaths: filters.allowedContentPaths ? [...filters.allowedContentPaths].sort() : undefined,
            applicationKey: filters.applicationKey,
        }),
        [filters.contextContent, filters.contentTypeNames, filters.allowedContentPaths, filters.applicationKey],
    );

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
        treeQuery,
    });

    // Legacy behavior: a non-blank search value forces flat mode,
    // while clearing it restores the configured default.
    useEffect(() => {
        setIsTreeView(isBlank(debouncedQuery) ? defaultIsTree : false);
    }, [debouncedQuery, defaultIsTree]);

    // Track if we need to trigger a search
    const lastSearchedQueryRef = useRef<string | null>(null);

    // Load flat data when in flat view. Tree-view filtering is handled by the
    // data hook via treeQuery, so flat search runs only when the tree is hidden.
    useEffect(() => {
        if (!open || isTreeView) {
            lastSearchedQueryRef.current = null;
            return;
        }

        // Only search if the debounced query has changed
        if (lastSearchedQueryRef.current !== debouncedQuery) {
            lastSearchedQueryRef.current = debouncedQuery;
            void search(debouncedQuery);
        }
    }, [open, isTreeView, debouncedQuery, search]);

    // Reset search tracking when closed (preserves input value for UX)
    useEffect(() => {
        if (!open) {
            lastSearchedQueryRef.current = null;
        }
    }, [open]);

    // Reset active item when list changes
    useEffect(() => {
        if (!open) return;

        const items = isTreeView ? treeItems : flatItems;
        const firstItem = items[0];

        if (firstItem) {
            const activeInList = activeId && items.some((item) => item.id === activeId);
            if (!activeInList) {
                setActiveId(firstItem.id);
            }
        } else {
            setActiveId(null);
        }
    }, [open, isTreeView, treeItems, flatItems, activeId]);

    const displayItems = useMemo(() => {
        return isTreeView ? treeItems : flatItems;
    }, [isTreeView, treeItems, flatItems]);

    // Calculate dropdown height based on display items
    const dropdownHeight = useMemo(() => {
        const mode = isTreeView ? 'tree' : 'flat';
        const baseHeight = mode === 'tree' ? treeRowHeight : flatRowHeight;
        const count = displayItems.length;

        if (count === 0) return baseHeight + PADDING;

        let contentHeight: number = 0;

        // If flatRowHeightRatio was provided, use it to calculate the row height
        if (mode === 'flat' && flatRowHeightRatio) {
            const rowHeight = Math.min(flatRowHeightRatio * Number(inputRef.current?.clientWidth), baseHeight);
            contentHeight = count * rowHeight + Math.max(count - 1, 0) * GAP + PADDING;
        } else {
            contentHeight = count * baseHeight + Math.max(count - 1, 0) * GAP + PADDING;
        }

        return Math.min(contentHeight, maxHeight);
    }, [displayItems.length, isTreeView, treeRowHeight, flatRowHeight, flatRowHeightRatio, maxHeight]);

    // Handlers
    const handleOpenChange = useCallback((next: boolean): void => {
        setOpen(next);
    }, []);

    const handleToggleView = useCallback((pressed: boolean): void => {
        setIsTreeView(pressed);
        setActiveId(null);
        setOpen(true);
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLElement>): void => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
            e.preventDefault();
            setIsTreeView((prev) => !prev);
        }
    }, []);

    const handleExpand = useCallback(
        (id: string): void => {
            tree.expand(id);
            if (tree.needsChildrenLoad(id)) {
                void loadChildren(id);
            }
        },
        [tree, loadChildren],
    );

    const handleCollapse = useCallback(
        (id: string): void => {
            tree.collapse(id);
        },
        [tree],
    );

    const handleLoadMore = useCallback(
        (parentId: string | null): void => {
            if (parentId === null) {
                void loadMoreRoot();
                return;
            }

            if (tree.hasMoreChildren(parentId) && !tree.isLoading(parentId)) {
                void loadMoreChildren(parentId);
            }
        },
        [tree, loadMoreChildren, loadMoreRoot],
    );

    const handleFlatListEndReached = useCallback(() => {
        if (!flatHasMore || isFlatLoading) return;
        void loadMoreFlat();
    }, [flatHasMore, isFlatLoading, loadMoreFlat]);

    // Derived values
    const isLoading = isTreeView ? isTreeLoading : isFlatLoading;
    const hasMore = isTreeView ? treeHasMore : flatHasMore;
    const listMode = isTreeView ? 'tree' : 'flat';

    return {
        // Refs
        virtuosoRef,
        inputRef,

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

        // Error handling
        error,
        retry,
    };
}
