import {atom, computed} from 'nanostores';
import type {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import {$activeRawFlatNodes, $isFilterActive} from './active-tree.store';
import {$contentCache} from './content.store';
import {$filterTreeState} from './filter-tree.store';
import {$treeState} from './tree-list.store';

//
// Core State
//

/** Set of selected content IDs */
export const $selection = atom<ReadonlySet<string>>(new Set());

/** Currently active (focused) content ID */
export const $activeId = atom<string | null>(null);

/** Whether "select all" mode is active (auto-selects new nodes) */
export const $selectAllMode = atom<boolean>(false);

//
// Computed State
//

/** Selected items as ContentSummaryAndCompareStatus objects */
export const $selectedItems = computed([$contentCache, $selection], (cache, selection) => {
    return Array.from(selection)
        .map((id) => cache[id])
        .filter((item): item is ContentSummaryAndCompareStatus => item !== undefined);
});

/** Number of selected items */
export const $selectionCount = computed($selection, (selection) => selection.size);

/** Whether all tree items are selected */
export const $isAllSelected = computed([$treeState, $selection], (treeState, selection) => {
    if (treeState.nodes.size === 0 || selection.size === 0) {
        return false;
    }
    return Array.from(treeState.nodes.keys()).every((id) => selection.has(id));
});

/** Whether no items are selected */
export const $isNoneSelected = computed($selection, (selection) => selection.size === 0);

/** Count of selected items that are VISIBLE & LOADED (for action availability) */
export const $loadedSelectionCount = computed([$activeRawFlatNodes, $selection], (flatNodes, selection) => {
    const visibleLoadedIds = new Set(
        flatNodes
            .filter((node) => node.nodeType === 'node' && node.data !== null)
            .map((node) => node.id)
    );
    return Array.from(selection).filter((id) => visibleLoadedIds.has(id)).length;
});

/** Whether all VISIBLE & LOADED items are selected */
export const $isAllLoadedSelected = computed([$activeRawFlatNodes, $selection], (flatNodes, selection) => {
    // Get visible nodes with loaded data
    const visibleLoadedIds = flatNodes
        .filter((node) => node.nodeType === 'node' && node.data !== null)
        .map((node) => node.id);

    if (visibleLoadedIds.length === 0) return false;
    return visibleLoadedIds.every((id) => selection.has(id));
});

export const $currentIds = computed([$selection, $activeId], (selection, activeId) => {
    if (selection.size > 0) {
        return [...selection];
    }
    return activeId ? [activeId] : [];
});

/** Current context items: selected items if any, otherwise active item */
export const $currentItems = computed(
    [$currentIds, $contentCache],
    (currentIds, cache) => {
        return currentIds.map((id) => cache[id]).filter((item): item is ContentSummaryAndCompareStatus => item !== undefined);
    }
);

/** Single current item for context panel (last selected or active) */
export const $currentItem = computed(
    [$selection, $activeId, $contentCache],
    (selection, activeId, cache) => {
        if (selection.size > 0) {
            const lastId = Array.from(selection).pop();
            return lastId ? cache[lastId] ?? null : null;
        }

        return activeId ? cache[activeId] ?? null : null;
    }
);

//
// Actions
//

/** Set the active item */
export function setActive(id: string | null): void {
    $activeId.set(id);
}

/** Toggle selection of an item */
export function toggleSelection(id: string): void {
    const current = $selection.get();
    const next = new Set(current);
    if (next.has(id)) {
        next.delete(id);
    } else {
        next.add(id);
    }
    $selection.set(next);
}

/** Set selection to specific IDs */
export function setSelection(ids: string[] | ReadonlySet<string>): void {
    const next = ids instanceof Set ? ids : new Set(ids);
    $selection.set(next);
}

/** Clear all selection */
export function clearSelection(): void {
    $selection.set(new Set());
    $selectAllMode.set(false);
}

/** Select all VISIBLE items that have data loaded (in current active tree - main or filter) */
export function selectAll(): void {
    const flatNodes = $activeRawFlatNodes.get();
    // Only select visible nodes with loaded data (not placeholders)
    const visibleLoadedIds = flatNodes
        .filter((node) => node.nodeType === 'node' && node.data !== null)
        .map((node) => node.id);
    $selection.set(new Set(visibleLoadedIds));
    $selectAllMode.set(true);
}

/** Check if item is selected */
export function isSelected(id: string): boolean {
    return $selection.get().has(id);
}

/** Get current items (selected OR active) as ContentSummaryAndCompareStatus objects */
export function getCurrentItems(): readonly ContentSummaryAndCompareStatus[] {
    return $currentItems.get();
}

/** @deprecated Use getCurrentItems() instead. Returns selected items only. */
export function getSelectedItems(): readonly ContentSummaryAndCompareStatus[] {
    // For backwards compatibility, return current items (selected OR active)
    return getCurrentItems();
}

/** Check if any items are selected */
export function hasSelectedItems(): boolean {
    return $selection.get().size > 0;
}

/** @deprecated Use clearSelection() instead */
export const resetSelection = clearSelection;

//
// * Select All Mode Dynamic Management
//

// Track previous selection to detect explicit removals vs collapse-based removals
let previousSelectionIds = new Set<string>();

// Dynamically manage $selectAllMode based on selection changes:
// - Enable when all loaded items become selected (by any means, including Cmd+A)
// - Disable when a visible item is explicitly removed from selection (user unchecked)
// - Keep enabled when items are removed due to collapse (items are no longer visible)
$selection.subscribe((selection) => {
    const currentFlatNodes = $activeRawFlatNodes.get();
    const visibleNodeIds = new Set(
        currentFlatNodes.filter((n) => n.nodeType === 'node').map((n) => n.id)
    );

    // Check if any VISIBLE item was removed from selection (user explicitly unchecked)
    // Items removed due to collapse are no longer visible, so they won't match
    const visibleItemWasRemoved = [...previousSelectionIds].some(
        (id) => !selection.has(id) && visibleNodeIds.has(id)
    );

    previousSelectionIds = new Set(selection);

    // If a visible item was removed, user explicitly deselected something
    if (visibleItemWasRemoved && $selectAllMode.get()) {
        $selectAllMode.set(false);
    }

    // If all loaded items are now selected, enable selectAllMode
    // This handles Cmd+A and manual selection of all items
    if (!visibleItemWasRemoved && $isAllLoadedSelected.get() && !$selectAllMode.get()) {
        $selectAllMode.set(true);
    }
});

//
// * Select All Mode Auto-Selection (self-initializing)
//

// When in select-all mode, keep selection in sync with visible nodes:
// - Add newly visible loaded nodes (on expand)
// - Remove nodes that are no longer visible (on collapse)
$activeRawFlatNodes.subscribe((flatNodes) => {
    if (!$selectAllMode.get()) return;

    const currentSelection = $selection.get();

    // Build set of visible node IDs (only actual nodes, not loading indicators)
    const visibleNodeIds = new Set(
        flatNodes.filter((node) => node.nodeType === 'node').map((node) => node.id)
    );

    // Build set of visible LOADED node IDs (for adding to selection)
    const visibleLoadedIds = new Set(
        flatNodes
            .filter((node) => node.nodeType === 'node' && node.data !== null)
            .map((node) => node.id)
    );

    let changed = false;
    const newSelection = new Set<string>();

    // Keep selected nodes that are still visible
    for (const id of currentSelection) {
        if (visibleNodeIds.has(id)) {
            newSelection.add(id);
        } else {
            changed = true; // Node was removed (collapsed)
        }
    }

    // Add newly visible loaded nodes
    for (const id of visibleLoadedIds) {
        if (!newSelection.has(id)) {
            newSelection.add(id);
            changed = true;
        }
    }

    if (changed) {
        $selection.set(newSelection);
    }
});

//
// * Filter Mode Transitions
//

// When switching between views (either direction), disable select-all mode
// Select-all is view-specific - enabling it in one view should not affect the other
// Selection IDs are preserved, but auto-selection behavior is disabled
$isFilterActive.subscribe(() => {
    if ($selectAllMode.get()) {
        $selectAllMode.set(false);
    }
});

//
// * Filter Tree Changes
//

// Track filter tree root changes to disable selectAllMode on new filter queries
// This prevents auto-selection of new filter results when changing filters
let prevFilterRootIds: readonly string[] = [];

$filterTreeState.subscribe((state) => {
    const currentRootIds = state.rootIds;

    // Check if root IDs changed (indicates a new filter query, not expand/collapse)
    const rootsChanged =
        currentRootIds.length !== prevFilterRootIds.length ||
        !currentRootIds.every((id, i) => id === prevFilterRootIds[i]);

    prevFilterRootIds = currentRootIds;

    // Disable selectAllMode when filter results change (only in filter mode)
    if (rootsChanged && $selectAllMode.get() && $isFilterActive.get()) {
        $selectAllMode.set(false);
    }
});
