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
    mockProjectContextSetProject,
    mockProjectContextSetNotAvailable,
    mockProjectContextIsNotAvailable,
    noProjectsAvailableHandlers,
    projectChangedHandlers,
} = vi.hoisted(() => ({
    createdHandlers: [] as (() => void)[],
    deletedHandlers: [] as ((event: {getProjectName(): string}) => void)[],
    mockProjectListSendAndParse: vi.fn(),
    mockSetProjectSelectionDialogOpen: vi.fn(),
    mockProjectContextSetProject: vi.fn(),
    mockProjectContextSetNotAvailable: vi.fn(),
    mockProjectContextIsNotAvailable: vi.fn(() => false),
    noProjectsAvailableHandlers: [] as (() => void)[],
    projectChangedHandlers: [] as ((project: MockProject) => void)[],
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

vi.mock('../utils/storage/sync', () => ({
    syncMapStore: vi.fn(),
}));

vi.mock('./config.store', () => ({
    $config: {
        get: () => ({appId: 'contentstudio'}),
    },
}));

vi.mock('./dialogs.store', () => ({
    setProjectSelectionDialogOpen: mockSetProjectSelectionDialogOpen,
}));

vi.mock('../../../app/project/ProjectContext', () => ({
    ProjectContext: {
        get: () => ({
            setProject: mockProjectContextSetProject,
            setNotAvailable: mockProjectContextSetNotAvailable,
            isNotAvailable: mockProjectContextIsNotAvailable,
            onNoProjectsAvailable: vi.fn((handler: () => void) => {
                noProjectsAvailableHandlers.push(handler);
            }),
            onProjectChanged: vi.fn((handler: (project: MockProject) => void) => {
                projectChangedHandlers.push(handler);
            }),
        }),
    },
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

function resetProjectContextMocks(): void {
    mockProjectContextSetProject.mockReset().mockImplementation((project: MockProject) => {
        projectChangedHandlers.forEach((handler) => handler(project));
    });
    mockProjectContextSetNotAvailable.mockReset().mockImplementation(() => {
        noProjectsAvailableHandlers.forEach((handler) => handler());
    });
    mockProjectContextIsNotAvailable.mockReset().mockReturnValue(false);
}

async function loadStore(projects: MockProject[], currentProjectId: string): Promise<typeof import('./projects.store')> {
    vi.resetModules();
    createdHandlers.length = 0;
    deletedHandlers.length = 0;
    noProjectsAvailableHandlers.length = 0;
    projectChangedHandlers.length = 0;
    mockProjectListSendAndParse.mockReset().mockResolvedValue(projects);
    mockSetProjectSelectionDialogOpen.mockReset();
    resetProjectContextMocks();
    window.history.pushState({}, '', `/contentstudio/cms/${currentProjectId}/browse`);

    const store = await import('./projects.store');
    await flushPromises();

    mockSetProjectSelectionDialogOpen.mockClear();
    mockProjectContextSetProject.mockClear();
    mockProjectContextSetNotAvailable.mockClear();

    return store;
}

describe('projects.store delete intent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        createdHandlers.length = 0;
        deletedHandlers.length = 0;
        noProjectsAvailableHandlers.length = 0;
        projectChangedHandlers.length = 0;
        resetProjectContextMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
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
        expect(mockSetProjectSelectionDialogOpen).toHaveBeenCalledWith(false);
        expect(mockProjectContextSetProject).toHaveBeenCalledWith(parent);
        expect(mockProjectContextSetNotAvailable).not.toHaveBeenCalled();
    });

    it('uses explicit intent to fall back to first remaining project when deleted project has no parent', async () => {
        const orphan = createProject('orphan');
        const alpha = createProject('alpha');
        const beta = createProject('beta');
        const store = await loadStore([orphan, alpha, beta], 'beta');

        store.markPendingDeletedProject('orphan', true);
        emitDeleted('orphan');

        expect(store.$projects.get().activeProjectId).toBe('alpha');
        expect(mockSetProjectSelectionDialogOpen).toHaveBeenCalledWith(false);
        expect(mockProjectContextSetProject).toHaveBeenCalledWith(alpha);
        expect(mockProjectContextSetNotAvailable).not.toHaveBeenCalled();
    });

    it('uses explicit intent to enter empty-project state when no projects remain', async () => {
        const orphan = createProject('orphan');
        const store = await loadStore([orphan], 'orphan');

        store.markPendingDeletedProject('orphan', true);
        emitDeleted('orphan');

        expect(store.$projects.get().projects).toEqual([]);
        expect(store.$projects.get().activeProjectId).toBeUndefined();
        expect(mockSetProjectSelectionDialogOpen).toHaveBeenCalledWith(true);
        expect(mockProjectContextSetNotAvailable).toHaveBeenCalledTimes(1);
    });

    it('does not jump active project when unrelated delete has no explicit intent', async () => {
        const parent = createProject('parent');
        const child = createProject('child', ['parent']);
        const current = createProject('current');
        const store = await loadStore([parent, child, current], 'current');

        emitDeleted('child');

        expect(store.$projects.get().activeProjectId).toBe('current');
        expect(store.$projects.get().projects.map((project) => project.getName())).toEqual(['parent', 'current']);
        expect(mockSetProjectSelectionDialogOpen).not.toHaveBeenCalled();
        expect(mockProjectContextSetProject).not.toHaveBeenCalled();
        expect(mockProjectContextSetNotAvailable).not.toHaveBeenCalled();
    });

    it('should fall back to navigation when the active project is deleted without explicit intent', async () => {
        const parent = createProject('parent');
        const child = createProject('child', ['parent']);
        const current = createProject('current');
        const store = await loadStore([parent, child, current], 'current');

        emitDeleted('current');

        expect(store.$projects.get().activeProjectId).toBe('parent');
        expect(mockSetProjectSelectionDialogOpen).toHaveBeenCalledWith(false);
        expect(mockProjectContextSetProject).toHaveBeenCalledWith(parent);
        expect(mockProjectContextSetNotAvailable).not.toHaveBeenCalled();
    });

    it('does not leave no-project mode before the created project becomes active', async () => {
        const store = await loadStore([], '');
        const createdProject = createProject('created');
        const noProjectModeTransitions: {value: boolean; setProjectCalls: number}[] = [];

        expect(store.$noProjectMode.get()).toBe(true);

        const unsubscribe = store.$noProjectMode.subscribe((value: boolean) => {
            noProjectModeTransitions.push({
                value,
                setProjectCalls: mockProjectContextSetProject.mock.calls.length,
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
        expect(falseTransitions.every(({setProjectCalls}) => setProjectCalls > 0)).toBe(true);
    });

    it('publishes load errors before marking projects as resolved', async () => {
        vi.resetModules();
        createdHandlers.length = 0;
        deletedHandlers.length = 0;
        noProjectsAvailableHandlers.length = 0;
        projectChangedHandlers.length = 0;
        mockProjectListSendAndParse.mockReset().mockRejectedValue(new Error('Failed to load projects'));
        mockSetProjectSelectionDialogOpen.mockReset();
        resetProjectContextMocks();
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
        expect(mockProjectContextSetProject).not.toHaveBeenCalled();
        expect(mockProjectContextSetNotAvailable).not.toHaveBeenCalled();
    });
});
