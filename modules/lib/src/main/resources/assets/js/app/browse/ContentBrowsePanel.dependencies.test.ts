import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentQuery } from '../content/ContentQuery';
import { Branch } from '../versioning/Branch';
import { setContextLayoutMetrics } from '../../v6/shared/app-state/browsePanels.store';
import {
    $isDependencySearchPending,
    setDependencySearchPending,
} from '../../v6/features/search/model/contentFilter.store';
import { deactivateFilter } from '../../v6/entities/content';
import { ContentBrowsePanel } from './ContentBrowsePanel';
import type { ToggleSearchPanelWithDependenciesEvent } from './ToggleSearchPanelWithDependenciesEvent';

vi.mock('../../v6/shared/ui/dialogs/ConfirmationDialog', () => ({
    ConfirmationDialog: {},
    useConfirmationDialog: vi.fn(),
}));

type SearchListener = (query?: ContentQuery, requestId?: number) => void;

function createPanel() {
    let requestId = 0;
    const listeners = new Set<SearchListener>();
    const filterPanel = {
        setTargetBranch: vi.fn(),
        setDependencyItem: vi.fn(() => requestId++),
        getDependencyRequestId: vi.fn(() => requestId),
        clearDependencyRequest: vi.fn(() => requestId++),
        cancelDependencyRequest: vi.fn(() => requestId++),
        onSearchEvent: vi.fn((listener: SearchListener) => listeners.add(listener)),
        unSearchEvent: vi.fn((listener: SearchListener) => listeners.delete(listener)),
    };
    const contentTreeList = { setFilterQuery: vi.fn() };
    const showFilterPanel = vi.fn();
    const hideFilterPanel = vi.fn();
    const panel = Object.create(ContentBrowsePanel.prototype) as ContentBrowsePanel;
    Object.assign(panel, {
        toolbar: { getSelectionPanelToggler: () => ({ isActive: () => false }) },
        filterPanel,
        contentTreeList,
        showFilterPanel,
        hideFilterPanel,
    });

    const event = {
        getBranch: () => Branch.MASTER,
        getContent: () => ({ getId: () => 'dependency' }),
        isInbound: () => true,
        getType: () => undefined,
    } as unknown as ToggleSearchPanelWithDependenciesEvent;

    const showDependencies = () => panel['showDependencies'](event);
    const emitSearch = (query: ContentQuery | undefined, id: number) => {
        for (const listener of listeners) {
            listener(query, id);
        }
    };

    return {
        panel,
        filterPanel,
        contentTreeList,
        showFilterPanel,
        hideFilterPanel,
        listeners,
        showDependencies,
        emitSearch,
    };
}

describe('ContentBrowsePanel mobile dependencies', () => {
    beforeEach(() => {
        setContextLayoutMetrics({ totalWidth: 700, contextWidth: 360, windowWidth: 700 });
        setDependencySearchPending(false);
    });

    afterEach(() => {
        deactivateFilter();
        setDependencySearchPending(false);
        setContextLayoutMetrics({ totalWidth: 0, contextWidth: 0, windowWidth: 0 });
    });

    it('shows results only for the matching dependency request', () => {
        const setup = createPanel();
        const query = {} as ContentQuery;

        setup.showDependencies();

        expect($isDependencySearchPending.get()).toBe(true);
        expect(setup.showFilterPanel).toHaveBeenCalledOnce();
        expect(setup.filterPanel.setTargetBranch).toHaveBeenCalledWith(Branch.MASTER);
        expect(setup.listeners.size).toBe(1);

        setup.emitSearch(query, 0);
        expect(setup.hideFilterPanel).not.toHaveBeenCalled();

        setup.emitSearch(query, 1);
        expect(setup.hideFilterPanel).toHaveBeenCalledOnce();
        expect(setup.listeners.size).toBe(0);
        expect($isDependencySearchPending.get()).toBe(false);
    });

    it('clears pending callback and loading state on navigation', () => {
        const setup = createPanel();
        setup.showDependencies();

        window.dispatchEvent(new HashChangeEvent('hashchange'));

        expect(setup.listeners.size).toBe(0);
        expect(setup.filterPanel.cancelDependencyRequest).toHaveBeenCalledOnce();
        expect(setup.contentTreeList.setFilterQuery).toHaveBeenCalledWith(null);
        expect(setup.hideFilterPanel).toHaveBeenCalledOnce();
        expect($isDependencySearchPending.get()).toBe(false);
    });

    it('reveals filter when dependency query fails', () => {
        const setup = createPanel();
        setup.showDependencies();

        setup.emitSearch(undefined, 1);

        expect(setup.hideFilterPanel).not.toHaveBeenCalled();
        expect(setup.listeners.size).toBe(0);
        expect($isDependencySearchPending.get()).toBe(false);
    });

    it('clears previous callback when a new dependency request starts', () => {
        const setup = createPanel();
        setup.showDependencies();
        setup.showDependencies();

        expect(setup.filterPanel.cancelDependencyRequest).toHaveBeenCalledOnce();
        expect(setup.listeners.size).toBe(1);
        expect($isDependencySearchPending.get()).toBe(true);

        setup.panel['cancelPendingDependencySearch']();
        expect(setup.listeners.size).toBe(0);
    });
});
