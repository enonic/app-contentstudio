import { describe, expect, it, vi } from 'vitest';
import type { ContentQuery } from '../../content/ContentQuery';
import { Branch } from '../../versioning/Branch';
import {
    $isContentFilterDirty,
    getFilterValue,
    resetContentFilter,
    setContentFilterValue,
    setDependencySearchPending,
} from '../../../v6/features/search/model/contentFilter.store';
import { ContentBrowseFilterPanel } from './ContentBrowseFilterPanel';

vi.mock('../../../v6/shared/ui/dialogs/ConfirmationDialog', () => ({
    ConfirmationDialog: {},
    useConfirmationDialog: vi.fn(),
}));

describe('ContentBrowseFilterPanel dependency requests', () => {
    it('resets branch and filter when navigation cancels a pending dependency', () => {
        const setTargetBranch = vi.fn();
        const resetDesktop = vi.fn();
        const resetMobile = vi.fn();
        const panel = Object.create(ContentBrowseFilterPanel.prototype) as ContentBrowseFilterPanel;
        Object.assign(panel, {
            dependencyRequestId: 1,
            targetBranch: Branch.MASTER,
            aggregationsFetcher: { setTargetBranch },
            dependenciesSection: { reset: resetDesktop },
            mobileDependenciesSection: { reset: resetMobile },
        });
        setContentFilterValue('pending dependency');

        panel.cancelDependencyRequest();

        expect(panel.getDependencyRequestId()).toBe(2);
        expect(panel.getTargetBranch()).toBe(Branch.DRAFT);
        expect(setTargetBranch).toHaveBeenCalledWith(Branch.DRAFT);
        expect(getFilterValue()).toBe('');
        expect($isContentFilterDirty.get()).toBe(false);
        expect(resetDesktop).toHaveBeenCalledOnce();
        expect(resetMobile).toHaveBeenCalledOnce();
    });

    it('ignores aggregation responses from older requests', async () => {
        let resolveOld: (result: unknown) => void;
        let resolveNew: (result: unknown) => void;
        const oldResponse = new Promise((resolve) => (resolveOld = resolve));
        const newResponse = new Promise((resolve) => (resolveNew = resolve));
        const oldResult = {
            getMetadata: () => ({ getTotalHits: () => 2 }),
            getAggregations: () => ['old'],
        };
        const newResult = {
            getMetadata: () => ({ getTotalHits: () => 5 }),
            getAggregations: () => ['new'],
        };
        const updateHitsCounter = vi.fn();
        const updateAggregations = vi.fn();
        const updateExportState = vi.fn();
        const panel = Object.create(ContentBrowseFilterPanel.prototype) as ContentBrowseFilterPanel;
        Object.assign(panel, {
            dependencyRequestId: 1,
            aggregationsRequestId: 0,
            getAggregations: vi.fn().mockReturnValueOnce(oldResponse).mockReturnValueOnce(newResponse),
            updateHitsCounter,
            updateExportState,
            updateAggregations,
            sortAggregations: vi.fn(),
            displayNamesResolver: { updateAggregationsDisplayNames: () => Promise.resolve() },
        });

        const oldRequest = panel['getAndUpdateAggregations']();
        const newRequest = panel['getAndUpdateAggregations']();
        resolveNew(newResult);
        await newRequest;
        resolveOld(oldResult);
        await oldRequest;

        expect(updateHitsCounter).toHaveBeenCalledOnce();
        expect(updateHitsCounter).toHaveBeenCalledWith(5);
        expect(updateExportState).toHaveBeenCalledWith(newResult);
        expect(updateAggregations).toHaveBeenCalledOnce();
        expect(updateAggregations).toHaveBeenCalledWith(['new']);
    });

    it('does not apply aggregation results after cancellation without a replacement request', async () => {
        let resolveAggregations: (result: unknown) => void;
        const response = new Promise((resolve) => (resolveAggregations = resolve));
        const updateHitsCounter = vi.fn();
        const updateAggregations = vi.fn();
        const panel = Object.create(ContentBrowseFilterPanel.prototype) as ContentBrowseFilterPanel;
        Object.assign(panel, {
            dependencyRequestId: 1,
            aggregationsRequestId: 0,
            dependenciesSection: { reset: vi.fn() },
            mobileDependenciesSection: { reset: vi.fn() },
            getAggregations: () => response,
            updateHitsCounter,
            updateExportState: vi.fn(),
            updateAggregations,
        });

        const request = panel['getAndUpdateAggregations']();
        panel.clearDependencyRequest();
        resolveAggregations({ getMetadata: () => ({ getTotalHits: () => 2 }), getAggregations: () => [] });
        await request;

        expect(updateHitsCounter).not.toHaveBeenCalled();
        expect(updateAggregations).not.toHaveBeenCalled();
    });

    it('ignores older display-name resolution after a newer response', async () => {
        let resolveOldNames: () => void;
        const oldNames = new Promise<void>((resolve) => (resolveOldNames = resolve));
        const updateAggregations = vi.fn();
        const panel = Object.create(ContentBrowseFilterPanel.prototype) as ContentBrowseFilterPanel;
        Object.assign(panel, {
            dependencyRequestId: 1,
            aggregationsRequestId: 0,
            getAggregations: vi
                .fn()
                .mockResolvedValueOnce({
                    getMetadata: () => ({ getTotalHits: () => 2 }),
                    getAggregations: () => ['old'],
                })
                .mockResolvedValueOnce({
                    getMetadata: () => ({ getTotalHits: () => 5 }),
                    getAggregations: () => ['new'],
                }),
            updateHitsCounter: vi.fn(),
            updateExportState: vi.fn(),
            updateAggregations,
            sortAggregations: vi.fn(),
            displayNamesResolver: {
                updateAggregationsDisplayNames: vi.fn().mockReturnValueOnce(oldNames).mockResolvedValueOnce(undefined),
            },
        });

        const oldRequest = panel['getAndUpdateAggregations']();
        await Promise.resolve();
        const newRequest = panel['getAndUpdateAggregations']();
        await newRequest;
        resolveOldNames();
        await oldRequest;

        expect(updateAggregations).toHaveBeenCalledOnce();
        expect(updateAggregations).toHaveBeenCalledWith(['new']);
    });

    it('still publishes dependency query when a later facet refresh completes first', async () => {
        let resolveSearch: (result: unknown) => void;
        let resolveRefresh: (result: unknown) => void;
        const searchResponse = new Promise((resolve) => (resolveSearch = resolve));
        const refreshResponse = new Promise((resolve) => (resolveRefresh = resolve));
        const result = { getMetadata: () => ({ getTotalHits: () => 2 }), getAggregations: () => [] };
        const query = {} as ContentQuery;
        const listener = vi.fn();
        const panel = Object.create(ContentBrowseFilterPanel.prototype) as ContentBrowseFilterPanel;
        Object.assign(panel, {
            dependencyRequestId: 1,
            aggregationsRequestId: 0,
            searchRequestId: 0,
            searchEventListeners: [listener],
            aggregationsFetcher: { createContentQuery: () => query },
            getSearchInputValues: () => ({}),
            getAggregations: vi.fn().mockReturnValueOnce(searchResponse).mockReturnValueOnce(refreshResponse),
            isFilteredOrConstrained: () => true,
            dependenciesSection: { isActive: () => true },
            updateHitsCounter: vi.fn(),
            updateExportState: vi.fn(),
            updateAggregations: vi.fn(),
            sortAggregations: vi.fn(),
            displayNamesResolver: { updateAggregationsDisplayNames: () => Promise.resolve() },
        });

        const search = panel['doSearch']();
        const refresh = panel.doRefresh();
        resolveRefresh(result);
        await refresh;
        resolveSearch(result);
        await search;

        expect(listener).toHaveBeenCalledOnce();
        expect(listener).toHaveBeenCalledWith(query, 1);
    });

    it('does not publish a query after its dependency request is canceled', async () => {
        let resolveAggregations: () => void;
        const aggregations = new Promise<void>((resolve) => {
            resolveAggregations = resolve;
        });
        const listener = vi.fn();
        const panel = Object.create(ContentBrowseFilterPanel.prototype) as ContentBrowseFilterPanel;
        Object.assign(panel, {
            dependenciesSection: { reset: vi.fn() },
            mobileDependenciesSection: { reset: vi.fn() },
            dependencyRequestId: 1,
            searchRequestId: 0,
            searchEventListeners: [listener],
            aggregationsFetcher: { createContentQuery: vi.fn(() => ({}) as ContentQuery) },
            isFilteredOrConstrained: () => true,
            getAndUpdateAggregations: () => aggregations,
            getSearchInputValues: () => ({}),
        });

        const search = panel['doSearch']();
        panel.clearDependencyRequest();
        resolveAggregations();
        await search;

        expect(panel.getDependencyRequestId()).toBe(2);
        expect(listener).not.toHaveBeenCalled();
    });

    it('ends pending state when aggregation fails so filter can be shown', async () => {
        const listener = vi.fn();
        const failure = new Error('Aggregation failed');
        const panel = Object.create(ContentBrowseFilterPanel.prototype) as ContentBrowseFilterPanel;
        Object.assign(panel, {
            dependencyRequestId: 1,
            searchRequestId: 0,
            searchEventListeners: [listener],
            isFilteredOrConstrained: () => true,
            getAndUpdateAggregations: () => Promise.reject(failure),
        });
        setDependencySearchPending(true);

        try {
            await expect(panel['doSearch']()).rejects.toBe(failure);
            expect(listener).toHaveBeenCalledWith(undefined, 1);
        } finally {
            setDependencySearchPending(false);
        }
    });

    it('waits for panel render and skips a canceled dependency search', () => {
        vi.useFakeTimers();
        const search = vi.fn();
        const whenRendered = vi.fn();
        let onRemoved: () => void;
        const panel = Object.create(ContentBrowseFilterPanel.prototype) as ContentBrowseFilterPanel;
        Object.assign(panel, {
            dependencyRequestId: 1,
            dependenciesSection: { reset: vi.fn() },
            mobileDependenciesSection: { reset: vi.fn() },
            onRendered: vi.fn(),
            onRemoved: (listener: () => void) => (onRemoved = listener),
            handleEventsForDependenciesSection: vi.fn(),
            isRendered: () => false,
            whenRendered,
            search,
        });
        setDependencySearchPending(true);

        try {
            panel['handleEvents']();
            setContentFilterValue('dependency');
            vi.advanceTimersByTime(300);

            expect(whenRendered).toHaveBeenCalledOnce();
            expect(search).not.toHaveBeenCalled();

            panel.clearDependencyRequest();
            whenRendered.mock.calls[0][0]();
            expect(search).not.toHaveBeenCalled();
        } finally {
            onRemoved?.();
            resetContentFilter();
            setDependencySearchPending(false);
            vi.useRealTimers();
        }
    });
});
