import {Button, cn, VirtualizedTreeList} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {AlertCircle, LoaderCircle} from 'lucide-react';
import type {HTMLAttributes} from 'react';
import {forwardRef, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {ListRange, VirtuosoHandle} from 'react-virtuoso';
import {Virtuoso} from 'react-virtuoso';
import {EditContentEvent} from '../../../../../app/event/EditContentEvent';
import {
    clearChildrenIdsRetryCooldown,
    clearFilterChildrenIdsRetryCooldown,
    fetchChildrenIdsOnly,
    clearVisibleContentDataRetryCooldown,
    clearVisibleFilterContentDataRetryCooldown,
    fetchFilterChildrenIdsOnly,
    fetchMoreFilteredResults,
    fetchRootChildrenIdsOnly,
    fetchVisibleContentData,
    fetchVisibleFilterContentData,
    isChildrenIdsLoadFailed,
    isFilterChildrenIdsLoadFailed,
    isVisibleContentDataLoadFailed,
    isVisibleFilterContentDataLoadFailed,
} from '../../../api/content-fetcher';
import {useI18n} from '../../../hooks/useI18n';
import type {FlatNode} from '../../../lib/tree-store';
import {ItemLabel} from '../../../shared/ItemLabel';
import {ProgressBar} from '../../../shared/primitives/ProgressBar';
import {$activeFlatNodes, $isFilterActive} from '../../../store/active-tree.store';
import {$activeProject} from '../../../store/projects.store';
import {$activeId, $selection, clearSelection, setActive, setSelection} from '../../../store/contentTreeSelection.store';
import {
    $filterLoadingState,
    collapseFilterNode,
    expandFilterNode,
    filterNodeNeedsChildrenLoad,
    filterRootHasMoreChildren,
} from '../../../store/filter-tree.store';
import {$treeState, collapseNode, expandNode, nodeNeedsChildrenLoad} from '../../../store/tree-list.store';
import {useDebouncedCallback} from '../../../utils/hooks/useDebouncedCallback';
import type {ContentData} from './ContentData';
import {ContentTreeContextMenu, type ContentTreeContextMenuProps} from './ContentTreeContextMenu';
import {ContentTreeListItem} from './ContentTreeListItem';
import {ContentTreeListSkeletonRow} from './ContentTreeListSkeletonRow';
import type {ContentUploadData} from './ContentUploadData';
import {
    buildVisibleTreeItems,
    type ContentFlatNode,
    type ErrorPlaceholderNode,
} from './content-tree-list-visible-items';

//
// * Types
//

//
// * Type checking helpers
//

function hasProgressData(data: unknown): data is ContentUploadData {
    return data !== null && typeof data === 'object' && 'progress' in data;
}

function hasDisplayNameData(data: unknown): data is ContentData {
    return data !== null && typeof data === 'object' && 'displayName' in data;
}

//
// * Virtuoso Custom Components
//

const virtuosoComponents = {
    Scroller: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({style, children, ...props}, ref) => (
        <div ref={ref} {...props} style={style} className="*:px-5 *:py-2.5">
            {children}
        </div>
    )),
    List: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({style, children, ...props}, ref) => (
        <div ref={ref} {...props} style={style} className="flex flex-col gap-y-1.5">
            {children}
        </div>
    )),
};

//
// * Upload Row
//

type ContentTreeListUploadRowProps = {
    item: FlatNode<ContentUploadData>;
};

const ContentTreeListUploadRow = ({item}: ContentTreeListUploadRowProps): React.ReactElement => {
    return (
        <VirtualizedTreeList.Row active={false} selected={false}>
            <VirtualizedTreeList.RowLeft>
                <span className="w-3.5" />
                <VirtualizedTreeList.RowLevelSpacer level={item.level} />
                <span className="size-5 shrink-0" />
            </VirtualizedTreeList.RowLeft>
            <VirtualizedTreeList.RowContent>
                <div className="flex items-center justify-between gap-2.5">
                    <ItemLabel
                        icon={<LoaderCircle size={24} className="animate-spin" />}
                        primary={item.data.name}
                        secondary={item.data.name}
                    />
                    <ProgressBar className="w-[134px] h-2.5" value={item.data.progress} />
                </div>
            </VirtualizedTreeList.RowContent>
        </VirtualizedTreeList.Row>
    );
};

ContentTreeListUploadRow.displayName = 'ContentTreeListUploadRow';

type ContentTreeListErrorRowProps = {
    level: number;
    label: string;
    retryLabel: string;
    loading: boolean;
    onRetry: () => void;
};

const ContentTreeListErrorRow = ({level, label, retryLabel, loading, onRetry}: ContentTreeListErrorRowProps): React.ReactElement => {
    return (
        <VirtualizedTreeList.Row active={false} selected={false}>
            <VirtualizedTreeList.RowLeft>
                <span className="w-3.5" />
                <VirtualizedTreeList.RowLevelSpacer level={level} />
                <AlertCircle size={20} className="shrink-0 text-danger" />
            </VirtualizedTreeList.RowLeft>
            <VirtualizedTreeList.RowContent>
                <div className="flex items-center justify-between gap-2.5">
                    <span className="text-sm text-danger truncate">{label}</span>
                    <Button size="sm" variant="outline" label={retryLabel} disabled={loading} onClick={onRetry} />
                </div>
            </VirtualizedTreeList.RowContent>
        </VirtualizedTreeList.Row>
    );
};

ContentTreeListErrorRow.displayName = 'ContentTreeListErrorRow';

//
// * Constants
//

/** Default buffer size above/below viewport to prefetch */
const DEFAULT_BUFFER = 5;

/** Larger buffer for fast scrolling */
const FAST_SCROLL_BUFFER = 10;

/** Scroll velocity threshold to switch to larger buffer (items per ms) */
const FAST_SCROLL_VELOCITY = 0.5;

/** Debounce delay for viewport data loading (ms) */
const VIEWPORT_LOAD_DEBOUNCE = 100;
const RETRY_BATCH_SIZE = 20;
const ERROR_ROW_PREFIX = '__error_batch__';

//
// * Main Component
//

export type ContentTreeListProps = {
    contextMenuActions?: ContentTreeContextMenuProps['actions'];
};

const CONTENT_TREE_LIST_NAME = 'ContentTreeList';

export const ContentTreeList = ({contextMenuActions = {}}: ContentTreeListProps): React.ReactElement => {
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const visibleDataLoadInFlightRef = useRef(false);
    const [isVisibleDataLoadInFlight, setIsVisibleDataLoadInFlight] = useState(false);
    const flatNodes = useStore($activeFlatNodes);
    const selection = useStore($selection);
    const activeId = useStore($activeId);
    const isFilterActive = useStore($isFilterActive);
    const activeProject = useStore($activeProject);
    const loadFailedLabel = useI18n('field.tree.loadFailed');
    const retryLabel = useI18n('action.retry');

    const failedNodeIds = useMemo(
        () =>
            flatNodes
                .filter((node) => {
                    if (node.nodeType !== 'node' || node.data !== null) return false;
                    return isFilterActive
                        ? isVisibleFilterContentDataLoadFailed(node.id)
                        : isVisibleContentDataLoadFailed(node.id);
                })
                .map((node) => node.id),
        [flatNodes, isFilterActive]
    );

    const failedNodeIdSet = useMemo(() => new Set(failedNodeIds), [failedNodeIds]);
    const hasPendingPlaceholders = useMemo(
        () => flatNodes.some((node) => node.nodeType === 'node' && node.data === null && !failedNodeIdSet.has(node.id)),
        [flatNodes, failedNodeIdSet]
    );
    const pendingChildLoadParentIds = useMemo(() => {
        const parentIds = new Set<string>();

        for (const node of flatNodes) {
            if (node.nodeType !== 'loading' || node.parentId === null) continue;
            if (isFilterActive) {
                if (isFilterChildrenIdsLoadFailed(node.parentId) || !filterNodeNeedsChildrenLoad(node.parentId)) continue;
            } else {
                if (isChildrenIdsLoadFailed(node.parentId) || !nodeNeedsChildrenLoad(node.parentId)) continue;
            }
            parentIds.add(node.parentId);
        }

        return [...parentIds];
    }, [flatNodes, isFilterActive]);

    const {visibleItems, rawIndexById} = useMemo(
        () =>
            buildVisibleTreeItems({
                rawItems: flatNodes,
                isFailedPlaceholder: (item) =>
                    item.nodeType === 'node' &&
                    item.data === null &&
                    (isFilterActive ? isVisibleFilterContentDataLoadFailed(item.id) : isVisibleContentDataLoadFailed(item.id)),
                errorRowPrefix: ERROR_ROW_PREFIX,
            }),
        [flatNodes, isFilterActive]
    );
    const visibleItemsRef = useRef<ContentFlatNode[]>(visibleItems);
    visibleItemsRef.current = visibleItems;

    const setVisibleDataLoadInFlight = useCallback((value: boolean) => {
        visibleDataLoadInFlightRef.current = value;
        setIsVisibleDataLoadInFlight((current) => (current === value ? current : value));
    }, []);

    const retryFailedNodes = useCallback((failedIds: string[]) => {
        if (failedIds.length === 0 || visibleDataLoadInFlightRef.current) return;
        const retryIds = failedIds.slice(0, RETRY_BATCH_SIZE);

        setVisibleDataLoadInFlight(true);

        const reloadPromise = isFilterActive
            ? (clearVisibleFilterContentDataRetryCooldown(retryIds), fetchVisibleFilterContentData(retryIds))
            : (clearVisibleContentDataRetryCooldown(retryIds), fetchVisibleContentData(retryIds));

        void reloadPromise.finally(() => {
            setVisibleDataLoadInFlight(false);
        });
    }, [isFilterActive, setVisibleDataLoadInFlight]);

    // Track visible range for viewport-based loading
    const visibleRangeRef = useRef<ListRange>({startIndex: 0, endIndex: 20});

    // Track scroll velocity for adaptive buffer
    const lastScrollTimeRef = useRef(Date.now());
    const lastScrollPosRef = useRef(0);
    const bufferSizeRef = useRef(DEFAULT_BUFFER);

    // Track previous visible selection for merge-based selection handling
    // This prevents VirtualizedTreeList from clearing selection when switching views
    const prevVisibleSelectionRef = useRef<ReadonlySet<string>>(new Set());

    // Load visible content data (debounced to avoid excessive API calls during scroll)
    // NOTE: Reads directly from stores to avoid stale closure values
    const loadVisibleContentData = useDebouncedCallback(() => {
        if (visibleDataLoadInFlightRef.current) return;

        const {startIndex, endIndex} = visibleRangeRef.current;
        const buffer = bufferSizeRef.current;

        // Read current state directly from stores/refs (avoids stale closure)
        const currentVisibleItems = visibleItemsRef.current;
        const currentIsFilterActive = $isFilterActive.get();
        // Add buffer zone around viewport
        const start = Math.max(0, startIndex - buffer);
        const end = Math.min(currentVisibleItems.length, endIndex + buffer);

        // Find nodes that need data (have ID but no content loaded)
        const idsNeedingData = currentVisibleItems
            .slice(start, end)
            .filter((node) => node.nodeType === 'node' && node.data === null)
            .map((node) => node.id);

        if (idsNeedingData.length > 0) {
            setVisibleDataLoadInFlight(true);

            // Use filter-specific fetch when in filter mode
            const loadPromise = currentIsFilterActive
                ? fetchVisibleFilterContentData(idsNeedingData)
                : fetchVisibleContentData(idsNeedingData);

            void loadPromise.finally(() => {
                setVisibleDataLoadInFlight(false);
            });
        }
    }, VIEWPORT_LOAD_DEBOUNCE);

    // Keep retry attempts progressing even without scroll events.
    useEffect(() => {
        if (!hasPendingPlaceholders) return;

        const retryTimer = setInterval(() => {
            loadVisibleContentData();
        }, 1000);

        return () => clearInterval(retryTimer);
    }, [hasPendingPlaceholders, loadVisibleContentData]);

    // Keep retry attempts progressing for loading non-root children IDs.
    useEffect(() => {
        if (pendingChildLoadParentIds.length === 0) return;

        const retryTimer = setInterval(() => {
            for (const parentId of pendingChildLoadParentIds) {
                if (isFilterActive) {
                    void fetchFilterChildrenIdsOnly(parentId).catch(() => undefined);
                } else {
                    void fetchChildrenIdsOnly(parentId).catch(() => undefined);
                }
            }
        }, 1000);

        return () => clearInterval(retryTimer);
    }, [pendingChildLoadParentIds, isFilterActive]);

    // Load root IDs on mount and when project changes (lazy loading: IDs first, data on demand)
    // Filter mode loads via activateFilter(), not here
    // Main tree uses caching - only load if empty
    useEffect(() => {
        if (!isFilterActive) {
            // Only load if main tree is empty (caching)
            const mainTreeState = $treeState.get();
            if (mainTreeState.rootIds.length === 0) {
                void fetchRootChildrenIdsOnly().catch(() => undefined);
            }
        }
    }, [isFilterActive, activeProject]);

    // Trigger data loading when flat nodes change (e.g., after expand)
    useEffect(() => {
        loadVisibleContentData();
    }, [flatNodes, loadVisibleContentData]);

    // Handle expand - load child IDs first, data will load via viewport
    // Works in both main and filter mode, using respective tree stores
    const handleExpand = useCallback(
        (id: string) => {
            if (isFilterActive) {
                // Expand in filter tree
                expandFilterNode(id);
                if (filterNodeNeedsChildrenLoad(id)) {
                    void fetchFilterChildrenIdsOnly(id).catch(() => undefined);
                }
            } else {
                // Expand in main tree
                expandNode(id);
                if (nodeNeedsChildrenLoad(id)) {
                    void fetchChildrenIdsOnly(id).catch(() => undefined);
                }
            }
        },
        [isFilterActive]
    );

    // Handle collapse - works in both main and filter mode
    const handleCollapse = useCallback(
        (id: string) => {
            if (isFilterActive) {
                collapseFilterNode(id);
            } else {
                collapseNode(id);
            }
        },
        [isFilterActive]
    );

    // Handle activation (Enter or double-click)
    const handleActivate = useCallback(
        (id: string) => {
            const node = flatNodes.find((n) => n.id === id);
            if (node && hasDisplayNameData(node.data) && node.data.item) {
                new EditContentEvent([node.data.item]).fire();
            }
        },
        [flatNodes]
    );

    // Handle selection change from VirtualizedTreeList (merge-based handling)
    // VirtualizedTreeList filters selection to only IDs in current items, which clears
    // selection from the other tree when switching views. We detect the diff and merge.
    const handleSelectionChange = useCallback((newVisibleSelection: ReadonlySet<string>) => {
        const prevVisibleSelection = prevVisibleSelectionRef.current;

        // Calculate what was added/removed in THIS view only
        const added = [...newVisibleSelection].filter((id) => !prevVisibleSelection.has(id));
        const removed = [...prevVisibleSelection].filter((id) => !newVisibleSelection.has(id));

        // Update ref for next comparison
        prevVisibleSelectionRef.current = newVisibleSelection;

        // Skip if nothing changed (e.g., VirtualizedTreeList just validated current items)
        if (added.length === 0 && removed.length === 0) return;

        // Merge changes with global selection
        const currentSelection = $selection.get();
        const newSelection = new Set(currentSelection);

        added.forEach((id) => newSelection.add(id));
        removed.forEach((id) => newSelection.delete(id));

        setSelection(newSelection);
    }, []);

    // Sync prevVisibleSelectionRef SYNCHRONOUSLY during render.
    // This MUST happen before VirtualizedTreeList renders and potentially calls onSelectionChange.
    // Using useEffect here causes a race condition: VirtualizedTreeList calls onSelectionChange
    // before our effect runs, causing the diff calculation to use stale prevVisibleSelectionRef
    // and incorrectly mark visible items as "removed".
    //
    // The ref tracks "what selection was visible in this tree view" for accurate diff calculation.
    const visibleIds = useMemo(
        () => new Set(flatNodes.filter((n) => n.nodeType === 'node').map((n) => n.id)),
        [flatNodes]
    );

    const visibleSelection = useMemo(
        () => new Set([...selection].filter((id) => visibleIds.has(id))),
        [selection, visibleIds]
    );

    // Update ref synchronously during render (before VirtualizedTreeList renders)
    // Only update if the visible selection actually changed to avoid unnecessary work
    const prevVisible = prevVisibleSelectionRef.current;
    const sameSize = visibleSelection.size === prevVisible.size;
    const sameContent = sameSize && [...visibleSelection].every((id) => prevVisible.has(id));

    if (!sameContent) {
        prevVisibleSelectionRef.current = visibleSelection;
    }

    // Handle viewport change - trigger data loading for newly visible items
    // Also trigger pagination if loading node is visible (handles no-scroll case)
    const handleRangeChange = useCallback(
        (range: ListRange) => {
            const now = Date.now();
            const timeDelta = now - lastScrollTimeRef.current;

            // Calculate scroll velocity (items per millisecond)
            const velocity = timeDelta > 0 ? Math.abs(range.startIndex - lastScrollPosRef.current) / timeDelta : 0;

            // Use larger buffer for fast scrolling
            bufferSizeRef.current = velocity > FAST_SCROLL_VELOCITY ? FAST_SCROLL_BUFFER : DEFAULT_BUFFER;

            // Update tracking refs
            visibleRangeRef.current = range;
            lastScrollTimeRef.current = now;
            lastScrollPosRef.current = range.startIndex;

            loadVisibleContentData();

            // Check for filter pagination: if loading node is visible and filter has more children
            // This handles the case where endReached doesn't fire because list fits on screen
            // Check loading state to prevent duplicate fetches
            const isFilterLoading = $filterLoadingState.get() === 'loading';
            if ($isFilterActive.get() && filterRootHasMoreChildren() && !isFilterLoading) {
                const currentVisibleItems = visibleItemsRef.current;
                const loadMoreIndex = currentVisibleItems.findIndex((n) => n.id === '__filter_load_more__');
                if (loadMoreIndex >= 0 && loadMoreIndex <= range.endIndex) {
                    const currentFlatNodes = $activeFlatNodes.get();
                    const currentCount = currentFlatNodes.filter((n) => n.nodeType === 'node').length;
                    fetchMoreFilteredResults(currentCount);
                }
            }
        },
        [loadVisibleContentData]
    );

    return (
        <VirtualizedTreeList
            data-component={CONTENT_TREE_LIST_NAME}
            items={flatNodes}
            selection={selection}
            onSelectionChange={handleSelectionChange}
            selectionMode="multiple"
            active={activeId}
            onActiveChange={setActive}
            onExpand={handleExpand}
            onCollapse={handleCollapse}
            onActivate={handleActivate}
            clearActiveOnReclick={true}
            virtuosoRef={virtuosoRef}
            aria-label='Content browser'
            className='w-full flex-1 min-h-0'
        >
            {({getItemProps, containerProps}) => {
                const {className: containerClassName, ...restContainerProps} = containerProps;
                return (
                    <ContentTreeContextMenu actions={contextMenuActions}>
                        <Virtuoso<ContentFlatNode>
                            ref={virtuosoRef}
                            data={visibleItems}
                            className={cn('h-full px-5 py-2.5 bg-surface-neutral', containerClassName)}
                            components={virtuosoComponents}
                            rangeChanged={handleRangeChange}
                            {...restContainerProps}
                            itemContent={(index, node) => {
                                const {id, level, isExpanded, hasChildren, nodeType, data} = node;

                                if (id.startsWith(ERROR_ROW_PREFIX)) {
                                    const failedIds = (node as ErrorPlaceholderNode).failedIds;
                                    const isRetrying = failedIds.some((failedId) =>
                                        flatNodes.some((n) => n.id === failedId && n.isLoadingData)
                                    );

                                    return (
                                        <ContentTreeListErrorRow
                                            level={level}
                                            label={loadFailedLabel}
                                            retryLabel={retryLabel}
                                            loading={isRetrying || isVisibleDataLoadInFlight}
                                            onRetry={() => retryFailedNodes(failedIds)}
                                        />
                                    );
                                }

                                if (hasProgressData(data)) {
                                    return <ContentTreeListUploadRow item={node as FlatNode<ContentUploadData>} />;
                                }

                                if (nodeType === 'loading') {
                                    const parentId = node.parentId;
                                    const isParentLoadFailed = parentId !== null &&
                                        (isFilterActive
                                            ? isFilterChildrenIdsLoadFailed(parentId)
                                            : isChildrenIdsLoadFailed(parentId));

                                    if (isParentLoadFailed && parentId !== null) {
                                        const isRetrying = flatNodes.some((n) => n.id === parentId && n.isLoading);
                                        return (
                                            <ContentTreeListErrorRow
                                                level={level}
                                                label={loadFailedLabel}
                                                retryLabel={retryLabel}
                                                loading={isRetrying}
                                                onRetry={() => {
                                                    if (isFilterActive) {
                                                        clearFilterChildrenIdsRetryCooldown(parentId);
                                                        void fetchFilterChildrenIdsOnly(parentId).catch(() => undefined);
                                                    } else {
                                                        clearChildrenIdsRetryCooldown(parentId);
                                                        void fetchChildrenIdsOnly(parentId).catch(() => undefined);
                                                    }
                                                }}
                                            />
                                        );
                                    }

                                    return <ContentTreeListSkeletonRow level={level} />;
                                }

                                if (nodeType === 'node' && data === null) {
                                    return <ContentTreeListSkeletonRow level={level} />;
                                }

                                if (hasDisplayNameData(data)) {
                                    const originalIndex = rawIndexById.get(id) ?? index;
                                    const itemProps = getItemProps(originalIndex, node);
                                    const isSelected = selection.has(id);
                                    const isActive = activeId === id;
                                    // Active item with no selection should look like selected
                                    const showAsSelected = isSelected || (isActive && selection.size === 0);

                                    // When active-as-selected, disable active to avoid compound variant hover bg
                                    const activeAsSelected = showAsSelected && !isSelected;

                                    return (
                                        <VirtualizedTreeList.Row
                                            {...itemProps}
                                            active={activeAsSelected ? false : itemProps.active}
                                            selected={showAsSelected}
                                            data-tone={showAsSelected ? 'inverse' : undefined}
                                            onClick={(e) => {
                                                // Focus tree container for keyboard navigation
                                                const tree = e.currentTarget.closest<HTMLElement>('[role="tree"]');
                                                tree?.focus();

                                                // Row click controls active only; selection is via checkbox
                                                if (selection.size > 0) {
                                                    // Clear selection and activate clicked item
                                                    clearSelection();
                                                    setActive(id);
                                                } else if (activeId === id) {
                                                    // Toggle off when clicking active item (no selection)
                                                    setActive(null);
                                                } else {
                                                    // Activate clicked item
                                                    setActive(id);
                                                }
                                            }}
                                            onContextMenu={() => {
                                                if (!isSelected && !isActive) {
                                                    // Clear selection and make right-clicked item active
                                                    if (selection.size > 0) {
                                                        clearSelection();
                                                    }
                                                    setActive(id);
                                                }
                                            }}
                                        >
                                            <VirtualizedTreeList.RowLeft>
                                                <VirtualizedTreeList.RowSelectionControl
                                                    rowId={id}
                                                    selected={itemProps.selected}
                                                />
                                                <VirtualizedTreeList.RowLevelSpacer level={level} />
                                                <VirtualizedTreeList.RowExpandControl
                                                    rowId={id}
                                                    expanded={isExpanded}
                                                    hasChildren={hasChildren}
                                                    onToggle={() =>
                                                        isExpanded ? handleCollapse(id) : handleExpand(id)
                                                    }
                                                    selected={showAsSelected}
                                                />
                                            </VirtualizedTreeList.RowLeft>
                                            <VirtualizedTreeList.RowContent>
                                                <ContentTreeListItem content={data} />
                                            </VirtualizedTreeList.RowContent>
                                        </VirtualizedTreeList.Row>
                                    );
                                }

                                return null;
                            }}
                        />
                    </ContentTreeContextMenu>
                );
            }}
        </VirtualizedTreeList>
    );
};

ContentTreeList.displayName = CONTENT_TREE_LIST_NAME;
