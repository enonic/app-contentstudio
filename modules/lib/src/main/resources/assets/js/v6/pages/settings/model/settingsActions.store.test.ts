import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Project } from '../../../../app/settings/data/project/Project';
import { $projects } from '../../../entities/project/projects.store';
import { SETTINGS_PROJECTS_FOLDER_ID } from './settings-tree.store';
import { clearSelection, setActive, setSelection } from './settingsTreeSelection.store';

const auth = vi.hoisted(() => ({ isContentAdmin: true, isAdmin: true }));
const dialogs = vi.hoisted(() => ({
    openCreateProjectDialog: vi.fn<(parents: { getName(): string }[]) => Promise<void>>(async () => {}),
    openEditProjectDialog: vi.fn<(project: { getName(): string }, parents: { getName(): string }[]) => Promise<void>>(
        async () => {},
    ),
    openDeleteSettingsDialog: vi.fn<(expected: string, name: string, navigate: boolean) => void>(),
}));
type TaskTracker = (taskId: string, config: { onComplete?: (state: string, message: string) => void }) => () => void;

const sync = vi.hoisted(() => ({
    syncProjects: vi.fn<() => unknown>(),
    trackTask: vi.fn<TaskTracker>(),
    cleanupTask: vi.fn(),
    showFeedback: vi.fn(),
    showWarning: vi.fn(),
}));
const config = vi.hoisted(() => ({ isMultiInheritance: false }));

vi.mock('@enonic/lib-admin-ui/auth/AuthHelper', () => ({
    AuthHelper: { isContentAdmin: () => auth.isContentAdmin, isAdmin: () => auth.isAdmin },
}));

vi.mock('@enonic/lib-admin-ui/notify/MessageBus', () => ({
    showFeedback: sync.showFeedback,
    showWarning: sync.showWarning,
}));

vi.mock('../../../../app/settings/data/project/ProjectConfigContext', () => ({
    ProjectConfigContext: {
        get: () => ({ getProjectConfig: () => ({ isMultiInheritance: () => config.isMultiInheritance }) }),
    },
}));

vi.mock('../../../features/manage-project/model/projectDialog.store', () => ({
    openCreateProjectDialog: dialogs.openCreateProjectDialog,
    openEditProjectDialog: dialogs.openEditProjectDialog,
}));

vi.mock('./deleteSettingsDialog.store', () => ({
    openDeleteSettingsDialog: dialogs.openDeleteSettingsDialog,
}));

vi.mock('../../../entities/project/api/projects.api', () => ({
    syncProjects: sync.syncProjects,
}));

vi.mock('../../../entities/task', () => ({
    trackTask: sync.trackTask,
    cleanupTask: sync.cleanupTask,
}));

const {
    $settingsActions,
    createSettingsItem,
    deleteCurrentSettingsItem,
    editCurrentSettingsItem,
    executeSettingsAction,
    syncLayers,
} = await import('./settingsActions.store');

function project(name: string, parents?: string[]): Project {
    return Project.create().setName(name).setDisplayName(name).setParents(parents).build();
}

function setProjects(projects: Project[], noProjectMode = false): void {
    $projects.set({
        projects,
        activeProjectId: projects[0]?.getName(),
        loaded: true,
        resolved: true,
        loadError: false,
        noProjectMode,
    });
}

const unsubscribe = $settingsActions.subscribe(() => {});

beforeEach(() => {
    auth.isContentAdmin = true;
    auth.isAdmin = true;
    config.isMultiInheritance = false;
    clearSelection();
    setActive(null);
    setProjects([project('root'), project('layer', ['root'])]);
});

afterEach(() => {
    vi.clearAllMocks();
});

afterAll(() => {
    unsubscribe();
});

describe('$settingsActions', () => {
    it('should enable only new without a current item', () => {
        const state = $settingsActions.get();

        expect(state.new.enabled).toBe(true);
        expect(state.edit.enabled).toBe(false);
        expect(state.delete.enabled).toBe(false);
    });

    it('should enable edit and delete for a single leaf project', () => {
        setActive('layer');

        const state = $settingsActions.get();

        expect(state.edit.enabled).toBe(true);
        expect(state.delete.enabled).toBe(true);
    });

    it('should disable delete for a project with layers and for the folder', () => {
        setActive('root');
        expect($settingsActions.get().delete.enabled).toBe(false);

        setActive(SETTINGS_PROJECTS_FOLDER_ID);
        expect($settingsActions.get().delete.enabled).toBe(false);
    });

    it('should disable delete when more than one item is selected', () => {
        setSelection(['root', 'layer']);

        const state = $settingsActions.get();

        expect(state.edit.enabled).toBe(true);
        expect(state.delete.enabled).toBe(false);
    });

    it('should hide sync until three projects exist and show it for admins', () => {
        expect($settingsActions.get().sync.visible).toBe(false);

        setProjects([project('a'), project('b'), project('c')]);
        expect($settingsActions.get().sync).toEqual({ enabled: true, visible: true });

        auth.isAdmin = false;
        setProjects([project('a'), project('b'), project('c'), project('d')]);
        expect($settingsActions.get().sync.visible).toBe(false);
    });

    it('should keep only new in no-project mode', () => {
        setProjects([], true);

        const state = $settingsActions.get();

        expect(state.new.enabled).toBe(true);
        expect(state.edit.enabled).toBe(false);
        expect(state.delete.enabled).toBe(false);
        expect(state.sync.visible).toBe(false);
    });
});

describe('createSettingsItem', () => {
    it('should open the create dialog with the last selected project as parent', () => {
        setSelection(['root', 'layer']);

        createSettingsItem();

        const [parents] = dialogs.openCreateProjectDialog.mock.calls[0];
        expect(parents.map((p) => p.getName())).toEqual(['layer']);
    });

    it('should pass every selected project under multi-inheritance', () => {
        config.isMultiInheritance = true;
        setSelection(['root', 'layer']);

        createSettingsItem();

        const [parents] = dialogs.openCreateProjectDialog.mock.calls[0];
        expect(parents.map((p) => p.getName())).toEqual(['root', 'layer']);
    });

    it('should do nothing without content admin rights', () => {
        auth.isContentAdmin = false;

        createSettingsItem();

        expect(dialogs.openCreateProjectDialog).not.toHaveBeenCalled();
    });
});

describe('editCurrentSettingsItem', () => {
    it('should open the edit dialog with the resolved parent projects', () => {
        setActive('layer');

        editCurrentSettingsItem();

        const [target, parents] = dialogs.openEditProjectDialog.mock.calls[0];
        expect(target.getName()).toBe('layer');
        expect(parents.map((p) => p.getName())).toEqual(['root']);
    });

    it('should ignore the projects folder', () => {
        setActive(SETTINGS_PROJECTS_FOLDER_ID);

        editCurrentSettingsItem();

        expect(dialogs.openEditProjectDialog).not.toHaveBeenCalled();
    });
});

describe('deleteCurrentSettingsItem', () => {
    it('should open the delete dialog and flag navigation for the active project', () => {
        setActive('root');

        deleteCurrentSettingsItem();

        expect(dialogs.openDeleteSettingsDialog).toHaveBeenCalledWith('root', 'root', true);
    });

    it('should not flag navigation for another project', () => {
        setActive('layer');

        deleteCurrentSettingsItem();

        expect(dialogs.openDeleteSettingsDialog).toHaveBeenCalledWith('layer', 'layer', false);
    });
});

describe('syncLayers', () => {
    it('should report the outcome of the tracked task and re-enable sync afterwards', async () => {
        setProjects([project('a'), project('b'), project('c')]);
        let complete: ((state: string, message: string) => void) | undefined;
        sync.syncProjects.mockReturnValue({
            match: (onOk: (taskId: string) => void) => {
                onOk('task-1');
                return Promise.resolve();
            },
        });
        sync.trackTask.mockImplementation((_taskId, { onComplete }) => {
            complete = onComplete;
            return () => {};
        });

        syncLayers();

        expect(sync.showFeedback).toHaveBeenCalledTimes(1);
        expect($settingsActions.get().sync.enabled).toBe(false);

        complete?.('SUCCESS', '');

        expect(sync.showFeedback).toHaveBeenCalledTimes(2);
        expect(sync.cleanupTask).toHaveBeenCalledWith('task-1');
        expect($settingsActions.get().sync.enabled).toBe(true);
    });

    it('should warn when the request fails and re-enable sync', () => {
        setProjects([project('a'), project('b'), project('c')]);
        sync.syncProjects.mockReturnValue({
            match: (_onOk: unknown, onErr: () => void) => {
                onErr();
                return Promise.resolve();
            },
        });

        syncLayers();

        expect(sync.showWarning).toHaveBeenCalledTimes(1);
        expect($settingsActions.get().sync.enabled).toBe(true);
    });
});

describe('executeSettingsAction', () => {
    it('should skip a disabled action', () => {
        executeSettingsAction('edit');

        expect(dialogs.openEditProjectDialog).not.toHaveBeenCalled();
    });

    it('should run an enabled action', () => {
        setActive('layer');

        executeSettingsAction('edit');

        expect(dialogs.openEditProjectDialog).toHaveBeenCalledTimes(1);
    });
});
