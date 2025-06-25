import {atom, computed} from 'nanostores';
import {$mergedFlatNodes, $flatNodes} from './tree-list.store';
import {$filterMergedFlatNodes, $filterFlatNodes, resetFilterTree} from './filter-tree.store';

//
// * Filter Mode State
//

/** Whether filter mode is active */
export const $isFilterActive = atom<boolean>(false);

//
// * Actions
//

/**
 * Activates or deactivates filter mode.
 * Note: $selectAllMode is disabled via subscription in contentTreeSelection.store.ts
 * to avoid circular dependency.
 */
export function setFilterActive(active: boolean): void {
    const wasActive = $isFilterActive.get();
    $isFilterActive.set(active);

    if (!active && wasActive) {
        // Leaving filter mode - clear filter tree
        resetFilterTree();
    }
}

export function deactivateFilter(): void {
    setFilterActive(false);
}

//
// * Computed Stores
//

/**
 * Active flat nodes for rendering (main or filter depending on mode).
 * This is what ContentTreeList should consume for rendering.
 */
export const $activeFlatNodes = computed(
    [$isFilterActive, $mergedFlatNodes, $filterMergedFlatNodes],
    (isFilterActive, mainNodes, filterNodes) => {
        return isFilterActive ? filterNodes : mainNodes;
    }
);

/**
 * Active flat nodes without uploads (for selection logic).
 * Used by selection store to determine which nodes are visible.
 */
export const $activeRawFlatNodes = computed(
    [$isFilterActive, $flatNodes, $filterFlatNodes],
    (isFilterActive, mainNodes, filterNodes) => {
        return isFilterActive ? filterNodes : mainNodes;
    }
);
