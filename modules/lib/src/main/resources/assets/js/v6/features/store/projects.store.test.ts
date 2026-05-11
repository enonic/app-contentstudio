import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

type MockProject = {
    getName(): string;
    getDisplayName(): string;
    getLanguage(): string;
    getParents(): string[];
};

const {
    createdHandlers,
    deletedHandlers,
    mockProjectListSendAndParse,
    mockSetProjectSelectionDialogOpen,
} = vi.hoisted(() => ({
    createdHandlers: [] as (() => void)[],
    deletedHandlers: [] as ((event: {getProjectName(): string}) => void)[],
    mockProjectListSendAndParse: vi.fn(),
    mockSetProjectSelectionDialogOpen: vi.fn(),
}));

vi.mock('../../../app/settings/resource/ProjectListRequest', () => ({
    ProjectListRequest: class {
        sendAndParse = mockProjectListSendAndParse;
    },
}));

vi.mock('../../../app/settings/event/ProjectUpdatedEvent', () => ({
    ProjectUpdatedEvent: {
        on: vi.fn(),
    },
}));

vi.mock('../../../app/settings/event/ProjectCreatedEvent', () => ({
    ProjectCreatedEvent: {
        on: vi.fn((handler: () => void) => {
            createdHandlers.push(handler);
        }),
    },
}));

vi.mock('../../../app/settings/event/ProjectDeletedEvent', () => ({
    ProjectDeletedEvent: {
        on: vi.fn((handler: (event: {getProjectName(): string}) => void) => {
            deletedHandlers.push(handler);
        }),
    },
}));

vi.mock('./config.store', () => ({
    $config: {
        get: () => ({appId: 'contentstudio'}),
    },
}));

vi.mock('./dialogs.store', () => ({
    setProjectSelectionDialogOpen: mockSetProjectSelectionDialogOpen,
}));

vi.mock('./tree-list.store', () => ({
    resetTree: vi.fn(),
}));

vi.mock('./contentTreeSelection.store', () => ({
    clearSelection: vi.fn(),
    setActive: vi.fn(),
}));

vi.mock('./contentFilter.store', () => ({
    setContentFilterOpen: vi.fn(),
    resetContentFilter: vi.fn(),
}));

vi.mock('../api/content-fetcher', () => ({
    deactivateFilter: vi.fn(),
}));

vi.mock('../utils/widget/versions/versionsCache', () => ({
    clearVersionsCache: vi.fn(),
}));

function createProject(name: string, parents: string[] = []): MockProject {
    return {
        getName: () => name,
        getDisplayName: () => name,
        getLanguage: () => '',
        getParents: () => parents,
    };
}

function emitDeleted(projectName: string): void {
    deletedHandlers.forEach((handler) => handler({
        getProjectName: () => projectName,
    }));
}

function emitCreated(): void {
    createdHandlers.forEach((handler) => handler());
}

async function flushPromises(times: number = 5): Promise<void> {
    for (let i = 0; i < times; i++) {
        await Promise.resolve();
    }
}

type LoadStoreOptions = {
    url?: string;
    clearInitMocks?: boolean;
};

const LAST_SELECTED_STORAGE_KEY = 'enonic:cs:lastselectedprojectid';

async function loadStore(
    projects: MockProject[],
    currentProjectId: string,
    options: LoadStoreOptions = {},
): Promise<typeof import('./projects.store')> {
    const {url, clearInitMocks = true} = options;

    vi.resetModules();
    createdHandlers.length = 0;
    deletedHandlers.length = 0;
    mockProjectListSendAndParse.mockReset().mockResolvedValue(projects);
    mockSetProjectSelectionDialogOpen.mockReset();
    window.history.pushState({}, '', url ?? `/contentstudio/cms/${currentProjectId}/browse`);

    const store = await import('./projects.store');
    await flushPromises();

    if (clearInitMocks) {
        mockSetProjectSelectionDialogOpen.mockClear();
    }

    return store;
}

describe('projects.store delete intent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        createdHandlers.length = 0;
        deletedHandlers.length = 0;
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('reports whether a project is active', async () => {
        const parent = createProject('parent');
        const current = createProject('current');
        const store = await loadStore([parent, current], 'current');

        expect(store.isActiveProject('current')).toBe(true);
        expect(store.isActiveProject('parent')).toBe(false);
    });

    it('uses explicit intent to fall back to parent project', async () => {
        const parent = createProject('parent');
        const child = createProject('child', ['parent']);
        const current = createProject('current');
        const store = await loadStore([parent, child, current], 'current');

        store.markPendingDeletedProject('child', true);
        emitDeleted('child');

        expect(store.$projects.get().activeProjectId).toBe('parent');
        expect(store.getActiveProject()).toBe(parent);
        expect(mockSetProjectSelectionDialogOpen).toHaveBeenCalledWith(false);
    });

    it('uses explicit intent to fall back to first remaining project when deleted project has no parent', async () => {
        const orphan = createProject('orphan');
        const alpha = createProject('alpha');
        const beta = createProject('beta');
        const store = await loadStore([orphan, alpha, beta], 'beta');

        store.markPendingDeletedProject('orphan', true);
        emitDeleted('orphan');

        expect(store.$projects.get().activeProjectId).toBe('alpha');
        expect(store.getActiveProject()).toBe(alpha);
        expect(mockSetProjectSelectionDialogOpen).toHaveBeenCalledWith(false);
    });

    it('uses explicit intent to enter empty-project state when no projects remain', async () => {
        const orphan = createProject('orphan');
        const store = await loadStore([orphan], 'orphan');

        store.markPendingDeletedProject('orphan', true);
        emitDeleted('orphan');

        expect(store.$projects.get().projects).toEqual([]);
        expect(store.$projects.get().activeProjectId).toBeUndefined();
        expect(store.$projects.get().noProjectMode).toBe(true);
        expect(mockSetProjectSelectionDialogOpen).toHaveBeenCalledWith(true);
    });

    it('does not jump active project when unrelated delete has no explicit intent', async () => {
        const parent = createProject('parent');
        const child = createProject('child', ['parent']);
        const current = createProject('current');
        const store = await loadStore([parent, child, current], 'current');

        emitDeleted('child');

        expect(store.$projects.get().activeProjectId).toBe('current');
        expect(store.$projects.get().projects.map((project) => project.getName())).toEqual(['parent', 'current']);
        expect(store.getActiveProject()).toBe(current);
        expect(mockSetProjectSelectionDialogOpen).not.toHaveBeenCalled();
    });

    it('should fall back to navigation when the active project is deleted without explicit intent', async () => {
        const parent = createProject('parent');
        const child = createProject('child', ['parent']);
        const current = createProject('current');
        const store = await loadStore([parent, child, current], 'current');

        emitDeleted('current');

        expect(store.$projects.get().activeProjectId).toBe('parent');
        expect(store.getActiveProject()).toBe(parent);
        expect(mockSetProjectSelectionDialogOpen).toHaveBeenCalledWith(false);
    });

    it('does not leave no-project mode before the created project becomes active', async () => {
        const store = await loadStore([], '');
        const createdProject = createProject('created');
        const noProjectModeTransitions: {value: boolean; activeProjectId: string | undefined}[] = [];

        expect(store.$noProjectMode.get()).toBe(true);

        const unsubscribe = store.$noProjectMode.subscribe((value: boolean) => {
            noProjectModeTransitions.push({
                value,
                activeProjectId: store.getActiveProject()?.getName(),
            });
        });

        mockProjectListSendAndParse.mockResolvedValueOnce([createdProject]);
        emitCreated();
        await flushPromises();
        unsubscribe();

        const falseTransitions = noProjectModeTransitions.filter(({value}) => !value);

        expect(store.$projects.get().activeProjectId).toBe('created');
        expect(store.$projects.get().loaded).toBe(true);
        expect(store.$projects.get().resolved).toBe(true);
        expect(store.$projects.get().loadError).toBe(false);
        expect(falseTransitions.length).toBeGreaterThan(0);
        expect(falseTransitions.every(({activeProjectId}) => activeProjectId === 'created')).toBe(true);
    });

    it('publishes load errors before marking projects as resolved', async () => {
        vi.resetModules();
        createdHandlers.length = 0;
        deletedHandlers.length = 0;
        mockProjectListSendAndParse.mockReset().mockRejectedValue(new Error('Failed to load projects'));
        mockSetProjectSelectionDialogOpen.mockReset();
        window.history.pushState({}, '', '/contentstudio/cms/current/browse');
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        const store = await import('./projects.store');
        const states: {resolved: boolean; loadError: boolean}[] = [];

        const unsubscribe = store.$projects.subscribe(({resolved, loadError}) => {
            states.push({resolved, loadError});
        });

        await flushPromises();
        unsubscribe();

        expect(store.$projects.get().resolved).toBe(true);
        expect(store.$projects.get().loadError).toBe(true);
        expect(states.some(({resolved, loadError}) => resolved && !loadError)).toBe(false);
        expect(mockSetProjectSelectionDialogOpen).not.toHaveBeenCalled();
    });
});

describe('projects.store init', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        createdHandlers.length = 0;
        deletedHandlers.length = 0;
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('uses the URL project even when storage holds a different id', async () => {
        localStorage.setItem(LAST_SELECTED_STORAGE_KEY, JSON.stringify('saved'));
        const url = createProject('url-project');
        const saved = createProject('saved');
        const store = await loadStore([url, saved], 'url-project');

        expect(store.$projects.get().activeProjectId).toBe('url-project');
    });

    it('falls back to the storage value in browse mode when the URL has no project', async () => {
        localStorage.setItem(LAST_SELECTED_STORAGE_KEY, JSON.stringify('saved'));
        const saved = createProject('saved');
        const other = createProject('other');
        const store = await loadStore([saved, other], '', {url: '/contentstudio/cms//browse'});

        expect(store.$projects.get().activeProjectId).toBe('saved');
    });

    it('does not apply the storage fallback on wizard URLs', async () => {
        localStorage.setItem(LAST_SELECTED_STORAGE_KEY, JSON.stringify('saved'));
        const saved = createProject('saved');
        const other = createProject('other');
        const store = await loadStore([saved, other], '', {
            url: '/contentstudio/cms//edit/abc123',
            clearInitMocks: false,
        });

        expect(store.$projects.get().activeProjectId).toBeUndefined();
        expect(mockSetProjectSelectionDialogOpen).toHaveBeenCalledWith(true);
    });

    it('leaves active project undefined when neither URL nor storage has a value', async () => {
        const a = createProject('a');
        const b = createProject('b');
        const store = await loadStore([a, b], '', {
            url: '/contentstudio/cms//browse',
            clearInitMocks: false,
        });

        expect(store.$projects.get().activeProjectId).toBeUndefined();
        expect(mockSetProjectSelectionDialogOpen).toHaveBeenCalledWith(true);
    });
});

describe('projects.store selectProject', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        createdHandlers.length = 0;
        deletedHandlers.length = 0;
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('updates the active project and persists the last selected id when the project is in the store', async () => {
        const a = createProject('a');
        const b = createProject('b');
        const store = await loadStore([a, b], 'a');

        // @ts-expect-error MockProject does not implement the full Project interface but is structurally compatible for this code path.
        store.selectProject(b);

        expect(store.$projects.get().activeProjectId).toBe('b');
        expect(localStorage.getItem(LAST_SELECTED_STORAGE_KEY)).toBe(JSON.stringify('b'));
    });

    it('leaves active project and storage untouched when the project is not in the store', async () => {
        const a = createProject('a');
        const stranger = createProject('stranger');
        const store = await loadStore([a], 'a');

        // @ts-expect-error MockProject does not implement the full Project interface but is structurally compatible for this code path.
        store.selectProject(stranger);

        expect(store.$projects.get().activeProjectId).toBe('a');
        expect(localStorage.getItem(LAST_SELECTED_STORAGE_KEY)).toBeNull();
    });
});

describe('projects.store storage cleanup on deletion', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        createdHandlers.length = 0;
        deletedHandlers.length = 0;
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('updates the last selected id to the fallback when the deleted project was the stored value', async () => {
        localStorage.setItem(LAST_SELECTED_STORAGE_KEY, JSON.stringify('current'));
        const parent = createProject('parent');
        const current = createProject('current');
        const store = await loadStore([parent, current], 'current');

        store.markPendingDeletedProject('current', true);
        emitDeleted('current');

        expect(store.$projects.get().activeProjectId).toBe('parent');
        expect(localStorage.getItem(LAST_SELECTED_STORAGE_KEY)).toBe(JSON.stringify('parent'));
    });

    it('clears the last selected id when no fallback is available', async () => {
        localStorage.setItem(LAST_SELECTED_STORAGE_KEY, JSON.stringify('orphan'));
        const orphan = createProject('orphan');
        const store = await loadStore([orphan], 'orphan');

        store.markPendingDeletedProject('orphan', true);
        emitDeleted('orphan');

        expect(store.$projects.get().activeProjectId).toBeUndefined();
        // ? syncAtomStore encodes undefined as '{}'-equivalent — atom-store stringifies undefined to "undefined" string,
        // ? but JSON.stringify(undefined) === undefined → setItem skipped, value remains until removeItem;
        // ? we instead expect the entry to be cleared via the listener path.
        const stored = localStorage.getItem(LAST_SELECTED_STORAGE_KEY);
        expect(stored === null || stored === 'null').toBe(true);
    });

    it('does not touch the last selected id when an unrelated project is deleted', async () => {
        localStorage.setItem(LAST_SELECTED_STORAGE_KEY, JSON.stringify('current'));
        const parent = createProject('parent');
        const child = createProject('child', ['parent']);
        const current = createProject('current');
        const store = await loadStore([parent, child, current], 'current');

        store.markPendingDeletedProject('child', true);
        emitDeleted('child');

        expect(localStorage.getItem(LAST_SELECTED_STORAGE_KEY)).toBe(JSON.stringify('current'));
    });

    it('clears the last selected id when removeProject (no navigate) removes the stored value', async () => {
        localStorage.setItem(LAST_SELECTED_STORAGE_KEY, JSON.stringify('alpha'));
        const alpha = createProject('alpha');
        const beta = createProject('beta');
        const store = await loadStore([alpha, beta], 'beta');

        store.removeProject('alpha', false);

        const stored = localStorage.getItem(LAST_SELECTED_STORAGE_KEY);
        expect(stored === null || stored === 'null').toBe(true);
    });
});
