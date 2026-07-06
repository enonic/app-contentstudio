import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { errAsync, okAsync } from 'neverthrow';
import { AppError } from '../../shared/api/errors';

type MockProject = {
    getName(): string;
    getDisplayName(): string;
    getLanguage(): string;
    getParents(): string[];
};

const { createdHandlers, deletedHandlers, mockListProjects, mockSetProjectSelectionDialogOpen } = vi.hoisted(() => ({
    createdHandlers: [] as (() => void)[],
    deletedHandlers: [] as ((event: { getProjectName(): string }) => void)[],
    mockListProjects: vi.fn(),
    mockSetProjectSelectionDialogOpen: vi.fn(),
}));

vi.mock('./api/projects.api', () => ({
    listProjects: mockListProjects,
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
        on: vi.fn((handler: (event: { getProjectName(): string }) => void) => {
            deletedHandlers.push(handler);
        }),
    },
}));

vi.mock('../../shared/dialogs/dialogs.store', () => ({
    setProjectSelectionDialogOpen: mockSetProjectSelectionDialogOpen,
}));

vi.mock('../content/model/content-tree.store', () => ({
    resetTree: vi.fn(),
}));

vi.mock('../content/model/content-selection.store', () => ({
    clearSelection: vi.fn(),
    setActive: vi.fn(),
}));

vi.mock('../../features/search/model/contentFilter.store', () => ({
    setContentFilterOpen: vi.fn(),
    resetContentFilter: vi.fn(),
}));

vi.mock('../content/api/content-fetcher', () => ({
    deactivateFilter: vi.fn(),
}));

vi.mock('../../shared/lib/widget/versions/versionsCache', () => ({
    clearVersionsCache: vi.fn(),
}));

function createProject(name: string, parents: string[] = [], displayName: string = name): MockProject {
    return {
        getName: () => name,
        getDisplayName: () => displayName,
        getLanguage: () => '',
        getParents: () => parents,
    };
}

function createInaccessibleProject(name: string, parents: string[] = []): MockProject {
    return createProject(name, parents, '');
}

function emitDeleted(projectName: string): void {
    deletedHandlers.forEach((handler) =>
        handler({
            getProjectName: () => projectName,
        }),
    );
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
    hostProjectId?: string;
};

const LAST_SELECTED_STORAGE_KEY = 'enonic:cs:lastselectedprojectid';

async function loadStore(
    projects: MockProject[],
    currentProjectId: string,
    options: LoadStoreOptions = {},
): Promise<typeof import('./projects.store') & typeof import('./activeProject.store')> {
    const { url, clearInitMocks = true, hostProjectId } = options;

    vi.resetModules();
    createdHandlers.length = 0;
    deletedHandlers.length = 0;
    mockListProjects.mockReset().mockImplementation(() => okAsync(projects));
    mockSetProjectSelectionDialogOpen.mockReset();
    window.history.pushState({}, '', url ?? `/com.enonic.app.contentstudio/cms/${currentProjectId}/browse`);

    const projectsStore = await import('./projects.store');
    const activeProjectStore = await import('./activeProject.store');
    projectsStore.initProjects(hostProjectId);
    await flushPromises();

    if (clearInitMocks) {
        mockSetProjectSelectionDialogOpen.mockClear();
    }

    return Object.assign({}, projectsStore, activeProjectStore);
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
        const noProjectModeTransitions: { value: boolean; activeProjectId: string | undefined }[] = [];

        expect(store.$noProjectMode.get()).toBe(true);

        const unsubscribe = store.$noProjectMode.subscribe((value: boolean) => {
            noProjectModeTransitions.push({
                value,
                activeProjectId: store.getActiveProject()?.getName(),
            });
        });

        mockListProjects.mockReturnValueOnce(okAsync([createdProject]));
        emitCreated();
        await flushPromises();
        unsubscribe();

        const falseTransitions = noProjectModeTransitions.filter(({ value }) => !value);

        expect(store.$projects.get().activeProjectId).toBe('created');
        expect(store.$projects.get().loaded).toBe(true);
        expect(store.$projects.get().resolved).toBe(true);
        expect(store.$projects.get().loadError).toBe(false);
        expect(falseTransitions.length).toBeGreaterThan(0);
        expect(falseTransitions.every(({ activeProjectId }) => activeProjectId === 'created')).toBe(true);
    });

    it('publishes load errors before marking projects as resolved', async () => {
        vi.resetModules();
        createdHandlers.length = 0;
        deletedHandlers.length = 0;
        mockListProjects.mockReset().mockImplementation(() => errAsync(new AppError('Failed to load projects')));
        mockSetProjectSelectionDialogOpen.mockReset();
        window.history.pushState({}, '', '/com.enonic.app.contentstudio/cms/current/browse');
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        const store = await import('./projects.store');
        store.initProjects();
        const states: { resolved: boolean; loadError: boolean }[] = [];

        const unsubscribe = store.$projects.subscribe(({ resolved, loadError }) => {
            states.push({ resolved, loadError });
        });

        await flushPromises();
        unsubscribe();

        expect(store.$projects.get().resolved).toBe(true);
        expect(store.$projects.get().loadError).toBe(true);
        expect(states.some(({ resolved, loadError }) => resolved && !loadError)).toBe(false);
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
        const store = await loadStore([saved, other], '', { url: '/com.enonic.app.contentstudio/cms//browse' });

        expect(store.$projects.get().activeProjectId).toBe('saved');
    });

    it('does not apply the storage fallback on wizard URLs', async () => {
        localStorage.setItem(LAST_SELECTED_STORAGE_KEY, JSON.stringify('saved'));
        const saved = createProject('saved');
        const other = createProject('other');
        const store = await loadStore([saved, other], '', {
            url: '/com.enonic.app.contentstudio/cms//edit/abc123',
            clearInitMocks: false,
        });

        expect(store.$projects.get().activeProjectId).toBeUndefined();
        expect(mockSetProjectSelectionDialogOpen).toHaveBeenCalledWith(true);
    });

    it('leaves active project undefined when neither URL nor storage has a value', async () => {
        const a = createProject('a');
        const b = createProject('b');
        const store = await loadStore([a, b], '', {
            url: '/com.enonic.app.contentstudio/cms//browse',
            clearInitMocks: false,
        });

        expect(store.$projects.get().activeProjectId).toBeUndefined();
        expect(mockSetProjectSelectionDialogOpen).toHaveBeenCalledWith(true);
    });

    it('auto-selects the accessible layer when storage holds an inaccessible parent', async () => {
        localStorage.setItem(LAST_SELECTED_STORAGE_KEY, JSON.stringify('parent'));
        const parentStub = createInaccessibleProject('parent');
        const layer = createProject('layer', ['parent']);
        const store = await loadStore([parentStub, layer], '', {
            url: '/com.enonic.app.contentstudio/cms//browse',
            clearInitMocks: false,
        });

        expect(store.$projects.get().activeProjectId).toBe('layer');
        expect(store.getActiveProject().getName()).toBe('layer');
        expect(mockSetProjectSelectionDialogOpen).not.toHaveBeenCalledWith(true);
    });

    it('auto-selects the single accessible project when storage holds an unrelated id', async () => {
        localStorage.setItem(LAST_SELECTED_STORAGE_KEY, JSON.stringify('parent'));
        const otherParentStub = createInaccessibleProject('other-parent');
        const otherLayer = createProject('other-layer', ['other-parent']);
        const store = await loadStore([otherParentStub, otherLayer], '', {
            url: '/com.enonic.app.contentstudio/cms//browse',
            clearInitMocks: false,
        });

        expect(store.$projects.get().activeProjectId).toBe('other-layer');
        expect(store.getActiveProject().getName()).toBe('other-layer');
        expect(mockSetProjectSelectionDialogOpen).not.toHaveBeenCalledWith(true);
    });

    it('still requires manual selection when several accessible projects remain and storage is unresolvable', async () => {
        localStorage.setItem(LAST_SELECTED_STORAGE_KEY, JSON.stringify('ghost'));
        const alpha = createProject('alpha');
        const beta = createProject('beta');
        const store = await loadStore([alpha, beta], '', {
            url: '/com.enonic.app.contentstudio/cms//browse',
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

describe('projects.store host project override', () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        createdHandlers.length = 0;
        deletedHandlers.length = 0;
        localStorage.clear();
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('selects the host project when it is available, overriding the URL', async () => {
        const alpha = createProject('alpha');
        const beta = createProject('beta');
        const store = await loadStore([alpha, beta], 'alpha', { hostProjectId: 'beta' });

        expect(store.$projects.get().activeProjectId).toBe('beta');
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('logs an error and falls back to the URL when the host project is unknown', async () => {
        const alpha = createProject('alpha');
        const beta = createProject('beta');
        const store = await loadStore([alpha, beta], 'alpha', { hostProjectId: 'ghost' });

        expect(store.$projects.get().activeProjectId).toBe('alpha');
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(String(errorSpy.mock.calls[0][0])).toContain('ghost');
    });

    it('does not re-report the error on subsequent loadProjects triggers', async () => {
        const alpha = createProject('alpha');
        const beta = createProject('beta');
        const child = createProject('child', ['alpha']);
        const store = await loadStore([alpha, beta, child], 'alpha', { hostProjectId: 'ghost' });

        expect(errorSpy).toHaveBeenCalledTimes(1);

        emitDeleted('child');
        await flushPromises();

        expect(store.$projects.get().activeProjectId).toBe('alpha');
        expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('treats a host project with no displayName as unavailable and falls back', async () => {
        const alpha = createProject('alpha');
        const inaccessible: MockProject = {
            getName: () => 'beta',
            getDisplayName: () => '',
            getLanguage: () => '',
            getParents: () => [],
        };
        const store = await loadStore([alpha, inaccessible], 'alpha', { hostProjectId: 'beta' });

        expect(store.$projects.get().activeProjectId).toBe('alpha');
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(String(errorSpy.mock.calls[0][0])).toContain('beta');
    });
});
