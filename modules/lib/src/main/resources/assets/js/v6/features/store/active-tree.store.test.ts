import {describe, it, expect, beforeEach, vi} from 'vitest';
import {
    $isFilterActive,
    $activeFlatNodes,
    $activeRawFlatNodes,
    setFilterActive,
    deactivateFilter,
} from './active-tree.store';
import {$mergedFlatNodes, $flatNodes, resetTree} from './tree-list.store';
import {$filterMergedFlatNodes, $filterFlatNodes, resetFilterTree} from './filter-tree.store';

// Mock the filter-tree store's resetFilterTree
vi.mock('./filter-tree.store', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./filter-tree.store')>();
    return {
        ...actual,
        resetFilterTree: vi.fn(actual.resetFilterTree),
    };
});

describe('active-tree.store', () => {
    beforeEach(() => {
        // Reset state before each test
        $isFilterActive.set(false);
        resetTree();
        vi.clearAllMocks();
    });

    describe('$isFilterActive', () => {
        it('defaults to false', () => {
            expect($isFilterActive.get()).toBe(false);
        });

        it('can be set to true', () => {
            setFilterActive(true);
            expect($isFilterActive.get()).toBe(true);
        });

        it('can be set to false', () => {
            setFilterActive(true);
            setFilterActive(false);
            expect($isFilterActive.get()).toBe(false);
        });
    });

    describe('setFilterActive', () => {
        it('sets filter active to true', () => {
            setFilterActive(true);
            expect($isFilterActive.get()).toBe(true);
        });

        it('sets filter active to false', () => {
            setFilterActive(true);
            setFilterActive(false);
            expect($isFilterActive.get()).toBe(false);
        });

        it('calls resetFilterTree when deactivating from active state', () => {
            setFilterActive(true);
            vi.clearAllMocks(); // Clear any calls from activation

            setFilterActive(false);

            expect(resetFilterTree).toHaveBeenCalledTimes(1);
        });

        it('does not call resetFilterTree when already inactive', () => {
            setFilterActive(false);

            expect(resetFilterTree).not.toHaveBeenCalled();
        });

        it('does not call resetFilterTree when activating', () => {
            setFilterActive(true);

            // Should not reset filter tree when activating (only when deactivating)
            // The mock is called 0 times for activation itself
            expect(resetFilterTree).not.toHaveBeenCalled();
        });
    });

    describe('deactivateFilter', () => {
        it('is an alias for setFilterActive(false)', () => {
            setFilterActive(true);
            vi.clearAllMocks();

            deactivateFilter();

            expect($isFilterActive.get()).toBe(false);
            expect(resetFilterTree).toHaveBeenCalledTimes(1);
        });

        it('does nothing when already inactive', () => {
            deactivateFilter();

            expect($isFilterActive.get()).toBe(false);
            expect(resetFilterTree).not.toHaveBeenCalled();
        });
    });

    describe('$activeFlatNodes', () => {
        it('returns main tree nodes when filter is inactive', () => {
            const mainNodes = $mergedFlatNodes.get();
            const activeNodes = $activeFlatNodes.get();

            expect(activeNodes).toBe(mainNodes);
        });

        it('returns filter tree nodes when filter is active', () => {
            setFilterActive(true);

            const filterNodes = $filterMergedFlatNodes.get();
            const activeNodes = $activeFlatNodes.get();

            expect(activeNodes).toBe(filterNodes);
        });

        it('switches source when filter state changes', () => {
            const mainNodes = $mergedFlatNodes.get();

            expect($activeFlatNodes.get()).toBe(mainNodes);

            setFilterActive(true);
            const filterNodes = $filterMergedFlatNodes.get();

            expect($activeFlatNodes.get()).toBe(filterNodes);

            setFilterActive(false);
            // After deactivation, should return main nodes again
            expect($activeFlatNodes.get()).toBe($mergedFlatNodes.get());
        });
    });

    describe('$activeRawFlatNodes', () => {
        it('returns main raw nodes when filter is inactive', () => {
            const mainNodes = $flatNodes.get();
            const activeNodes = $activeRawFlatNodes.get();

            expect(activeNodes).toBe(mainNodes);
        });

        it('returns filter raw nodes when filter is active', () => {
            setFilterActive(true);

            const filterNodes = $filterFlatNodes.get();
            const activeNodes = $activeRawFlatNodes.get();

            expect(activeNodes).toBe(filterNodes);
        });

        it('switches source when filter state changes', () => {
            const mainNodes = $flatNodes.get();

            expect($activeRawFlatNodes.get()).toBe(mainNodes);

            setFilterActive(true);
            const filterNodes = $filterFlatNodes.get();

            expect($activeRawFlatNodes.get()).toBe(filterNodes);

            setFilterActive(false);
            expect($activeRawFlatNodes.get()).toBe($flatNodes.get());
        });
    });

    describe('computed store reactivity', () => {
        it('$activeFlatNodes updates when $isFilterActive changes', () => {
            const listener = vi.fn();
            const unsubscribe = $activeFlatNodes.listen(listener);

            setFilterActive(true);

            expect(listener).toHaveBeenCalled();

            unsubscribe();
        });

        it('$activeRawFlatNodes updates when $isFilterActive changes', () => {
            const listener = vi.fn();
            const unsubscribe = $activeRawFlatNodes.listen(listener);

            setFilterActive(true);

            expect(listener).toHaveBeenCalled();

            unsubscribe();
        });
    });
});
