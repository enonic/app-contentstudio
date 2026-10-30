import { type Application } from '@enonic/lib-admin-ui/application/Application';
import { ApplicationConfig } from '@enonic/lib-admin-ui/application/ApplicationConfig';
import { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { PropertyTree } from '@enonic/input-types/data';
import { Form, Input } from '@enonic/input-types/schema';
import { registerBuiltInTypes } from '@enonic/input-types';
import { okAsync } from 'neverthrow';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Project } from '../../../../app/settings/data/project/Project';
import { ProjectItemPermissionsBuilder } from '../../../../app/settings/data/project/ProjectPermissions';
import { ProjectReadAccess } from '../../../../app/settings/data/project/ProjectReadAccess';
import { ProjectReadAccessType } from '../../../../app/settings/data/project/ProjectReadAccessType';

const { mockUpdateProject, mockUpdateProjectPermissions, mockUpdateProjectReadAccess, mockCreateProject } = vi.hoisted(
    () => ({
        mockUpdateProject: vi.fn(),
        mockUpdateProjectPermissions: vi.fn(),
        mockUpdateProjectReadAccess: vi.fn(),
        mockCreateProject: vi.fn(),
    }),
);

vi.mock('../../../entities/project/api/projects.api', () => ({
    createProject: mockCreateProject,
    updateProject: mockUpdateProject,
    updateProjectPermissions: mockUpdateProjectPermissions,
    updateProjectReadAccess: mockUpdateProjectReadAccess,
}));

vi.mock('../../../entities/application', async () => {
    const { map } = await import('nanostores');
    return {
        $applications: map({ applications: [], loading: false, loaded: false }),
        loadApplications: vi.fn(),
    };
});

vi.mock('../../../entities/principal', async () => {
    const { map } = await import('nanostores');
    return {
        $principals: map({ principals: [] }),
        loadPrincipalsByKeys: vi.fn(),
    };
});

vi.mock('../../../entities/project/projects.store', async () => {
    const { map } = await import('nanostores');
    return {
        $projects: map({ activeProjectId: 'base' }),
        reloadProjects: vi.fn(),
    };
});

vi.mock('../../../entities/task', () => ({ trackTask: vi.fn() }));
vi.mock('../../../shared/dialogs/dialogs.store', () => ({ setProjectSelectionDialogOpen: vi.fn() }));
vi.mock('../../../shared/i18n', () => ({ i18n: (key: string) => key }));
vi.mock('@enonic/lib-admin-ui/notify/MessageBus', () => ({ showError: vi.fn(), showSuccess: vi.fn() }));

vi.mock('../../../pages/settings/model/settingsTreeSelection.store', () => ({
    clearSelection: vi.fn(),
    setActive: vi.fn(),
}));

vi.mock('../../../pages/settings/model/settings-tree.store', () => ({
    $settingsTreeState: { listen: () => () => undefined },
    resetSettingsTreeForReload: vi.fn(),
}));

vi.mock('../../../../app/settings/data/project/ProjectConfigContext', () => ({
    ProjectConfigContext: { get: () => ({ getProjectConfig: () => undefined }) },
}));

import { $applications } from '../../../entities/application';
import {
    $isProjectDialogDirty,
    $projectDialog,
    createProject as createProjectAction,
    $projectDialogConfigScope,
    $projectDialogInheritedAppKeys,
    closeProjectDialog,
    getProjectDialogApplicationConfig,
    moveProjectDialogApplication,
    openCreateProjectDialog,
    openEditProjectDialog,
    selectProjectDialogApplications,
    setProjectDialogApplicationConfig,
    setProjectDialogParentProjects,
    unselectProjectDialogApplication,
    updateProject,
} from './projectDialog.store';

function checkboxForm(): Form {
    return new Form([
        Input.fromJson({
            formItemType: 'Input',
            name: 'agree',
            inputType: 'Checkbox',
            label: 'agree',
            occurrences: { minimum: 1, maximum: 1 },
            config: { default: [{ value: 'checked' }] },
            helpText: '',
        } as Parameters<typeof Input.fromJson>[0]),
    ]);
}

function createApp(key: string, form?: Form): Application {
    return {
        getApplicationKey: () => ApplicationKey.fromString(key),
        getForm: () => form,
        getDisplayName: () => key,
        getDescription: () => '',
    } as unknown as Application;
}

function createSiteConfig(key: string, values: Record<string, string>): ApplicationConfig {
    const root = new PropertyTree().getRoot();
    Object.entries(values).forEach(([name, value]) => root.setString(name, 0, value));
    return ApplicationConfig.create().setApplicationKey(ApplicationKey.fromString(key)).setConfig(root).build();
}

function createProject(name: string, siteConfigs: ApplicationConfig[]): Project {
    return Project.create()
        .setName(name)
        .setDisplayName(name)
        .setSiteConfigs(siteConfigs)
        .setReadAccess(new ProjectReadAccess(ProjectReadAccessType.PUBLIC))
        .setPermissions(new ProjectItemPermissionsBuilder().build())
        .build();
}

const configOf = (key: string) => getProjectDialogApplicationConfig(key);
const ownConfigOf = (key: string) => $projectDialog.get().applicationConfigs[key];
const listedKeys = () => $projectDialog.get().applications.map((app) => app.getApplicationKey().toString());

describe('projectDialog.store application configs', () => {
    beforeAll(() => {
        registerBuiltInTypes();
    });

    beforeEach(() => {
        $applications.set({
            applications: [createApp('app:a', checkboxForm()), createApp('app:b'), createApp('app:c')],
            loading: false,
            loaded: true,
        });
    });

    afterEach(() => {
        closeProjectDialog();
        $applications.set({ applications: [], loading: false, loaded: false });
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    describe('openEditProjectDialog', () => {
        it('should seed the configs from the project site configs', async () => {
            const project = createProject('layer', [createSiteConfig('app:b', { color: 'red' })]);

            await openEditProjectDialog(project, []);

            expect(configOf('app:b')?.getString('color')).toBe('red');
            expect($isProjectDialogDirty.get()).toBe(false);
        });

        it('should resolve the own config over the parent one, and the parent one when there is no own', async () => {
            const parent = createProject('parent', [
                createSiteConfig('app:b', { color: 'blue' }),
                createSiteConfig('app:c', { size: 'large' }),
            ]);
            const layer = createProject('layer', [createSiteConfig('app:b', { color: 'red' })]);

            await openEditProjectDialog(layer, [parent]);

            expect(configOf('app:b')?.getString('color')).toBe('red');
            expect(configOf('app:c')?.getString('size')).toBe('large');
            expect(ownConfigOf('app:c')).toBeUndefined();
        });

        it('should mark an edited inherited config dirty and a restored one clean', async () => {
            const parent = createProject('parent', [createSiteConfig('app:b', { color: 'blue' })]);
            await openEditProjectDialog(createProject('layer', []), [parent]);

            const edited = new PropertyTree().getRoot();
            edited.setString('color', 0, 'green');
            setProjectDialogApplicationConfig('app:b', edited);
            expect($isProjectDialogDirty.get()).toBe(true);

            const restored = new PropertyTree().getRoot();
            restored.setString('color', 0, 'blue');
            setProjectDialogApplicationConfig('app:b', restored);
            expect($isProjectDialogDirty.get()).toBe(false);
        });

        it('should clone the configs so editing them leaves the project untouched', async () => {
            const siteConfig = createSiteConfig('app:b', { color: 'red' });

            await openEditProjectDialog(createProject('layer', [siteConfig]), []);
            configOf('app:b')?.setString('color', 0, 'green');

            expect(siteConfig.getConfig().getString('color')).toBe('red');
        });

        it('should keep the edited project for the config forms', async () => {
            const project = createProject('layer', []);

            await openEditProjectDialog(project, []);

            expect($projectDialog.get().project).toBe(project);
        });

        it('should list the inherited apps after the own ones and open clean', async () => {
            const parent = createProject('parent', [
                createSiteConfig('app:c', { size: 'large' }),
                createSiteConfig('app:b', { color: 'blue' }),
            ]);
            const layer = createProject('layer', [createSiteConfig('app:b', { color: 'red' })]);

            await openEditProjectDialog(layer, [parent]);

            expect(listedKeys()).toEqual(['app:b', 'app:c']);
            expect($isProjectDialogDirty.get()).toBe(false);
        });

        it('should skip an inherited app that is not installed', async () => {
            const parent = createProject('parent', [createSiteConfig('app:gone', { k: 'v' })]);

            await openEditProjectDialog(createProject('layer', []), [parent]);

            expect(listedKeys()).toEqual([]);
        });
    });

    describe('$projectDialogInheritedAppKeys', () => {
        it('should collect the keys of every parent in parent order', async () => {
            const p1 = createProject('p1', [createSiteConfig('app:a', {}), createSiteConfig('app:b', {})]);
            const p2 = createProject('p2', [createSiteConfig('app:a', {}), createSiteConfig('app:c', {})]);

            await openCreateProjectDialog([p1, p2]);

            expect([...$projectDialogInheritedAppKeys.get()]).toEqual(['app:a', 'app:b', 'app:c']);
        });
    });

    describe('setProjectDialogParentProjects', () => {
        it('should keep the still inherited apps, drop the rest and append the new ones', async () => {
            const p1 = createProject('p1', [createSiteConfig('app:a', {}), createSiteConfig('app:b', {})]);
            const p2 = createProject('p2', [createSiteConfig('app:a', {}), createSiteConfig('app:c', {})]);
            await openCreateProjectDialog([p1]);

            setProjectDialogParentProjects([p2]);

            expect(listedKeys()).toEqual(['app:a', 'app:c']);
        });

        it('should keep an app picked by hand across a parent switch', async () => {
            await openCreateProjectDialog([]);
            selectProjectDialogApplications(['app:a']);

            setProjectDialogParentProjects([createProject('p2', [createSiteConfig('app:b', {})])]);
            expect(listedKeys()).toEqual(['app:a', 'app:b']);

            setProjectDialogParentProjects([]);
            expect(listedKeys()).toEqual(['app:a']);
        });

        it('should take the parent config for a newly inherited app', async () => {
            await openCreateProjectDialog([]);

            setProjectDialogParentProjects([createProject('parent', [createSiteConfig('app:b', { color: 'blue' })])]);

            expect(configOf('app:b')?.getString('color')).toBe('blue');
        });
    });

    describe('openCreateProjectDialog', () => {
        it('should resolve an inherited config from the parent and keep no own one', async () => {
            const parent = createProject('parent', [createSiteConfig('app:b', { color: 'blue' })]);

            await openCreateProjectDialog([parent]);

            expect(configOf('app:b')?.getString('color')).toBe('blue');
            expect(ownConfigOf('app:b')).toBeUndefined();
        });

        it('should resolve to the first parent carrying the app', async () => {
            const p1 = createProject('p1', [createSiteConfig('app:a', { color: 'red' })]);
            const p2 = createProject('p2', [createSiteConfig('app:a', { color: 'blue' })]);

            await openCreateProjectDialog([p1, p2]);
            expect(configOf('app:a')?.getString('color')).toBe('red');

            setProjectDialogParentProjects([p2, p1]);
            expect(configOf('app:a')?.getString('color')).toBe('blue');
        });

        it('should send the new parent config after a parent switch', async () => {
            mockCreateProject.mockReturnValue(okAsync(createProject('layer', [])));
            mockUpdateProjectPermissions.mockReturnValue(okAsync({}));
            const p1 = createProject('p1', [createSiteConfig('app:a', { color: 'red' })]);
            const p2 = createProject('p2', [createSiteConfig('app:a', { color: 'blue' })]);
            await openCreateProjectDialog([p1]);

            setProjectDialogParentProjects([p2]);
            await createProjectAction();

            const { applicationConfigs } = mockCreateProject.mock.calls[0][0] as {
                applicationConfigs: ApplicationConfig[];
            };
            expect(applicationConfigs.map((c) => c.getApplicationKey().toString())).toEqual(['app:a']);
            expect(applicationConfigs[0].getConfig().getString('color')).toBe('blue');
        });

        it('should have no project while creating', async () => {
            await openCreateProjectDialog([createProject('parent', [])]);

            expect($projectDialog.get().project).toBeUndefined();
        });

        it('should open clean with the inherited apps and get dirty once one is picked', async () => {
            await openCreateProjectDialog([createProject('parent', [createSiteConfig('app:b', { color: 'blue' })])]);
            expect($isProjectDialogDirty.get()).toBe(false);

            selectProjectDialogApplications(['app:a']);

            expect($isProjectDialogDirty.get()).toBe(true);
        });

        it('should get dirty when an inherited config is edited', async () => {
            await openCreateProjectDialog([createProject('parent', [createSiteConfig('app:b', { color: 'blue' })])]);

            const edited = new PropertyTree().getRoot();
            edited.setString('color', 0, 'green');
            setProjectDialogApplicationConfig('app:b', edited);

            expect($isProjectDialogDirty.get()).toBe(true);
        });
    });

    describe('$projectDialogConfigScope', () => {
        it('should have the project and no content on edit', async () => {
            const project = createProject('layer', []);

            await openEditProjectDialog(project, []);

            expect($projectDialogConfigScope.get()).toEqual({ project, content: null });
        });

        it('should have no project and no content on create', async () => {
            await openCreateProjectDialog([createProject('parent', [])]);

            expect($projectDialogConfigScope.get()).toEqual({ project: null, content: null });
        });
    });

    describe('selectProjectDialogApplications', () => {
        it('should append the new apps in order and keep the order of the rest', async () => {
            await openCreateProjectDialog([]);
            selectProjectDialogApplications(['app:b']);

            selectProjectDialogApplications(['app:c', 'app:b', 'app:a']);

            expect(listedKeys()).toEqual(['app:b', 'app:c', 'app:a']);
        });

        it('should keep the own configs of apps that stay and drop the removed ones', async () => {
            await openEditProjectDialog(createProject('layer', [createSiteConfig('app:b', { color: 'red' })]), []);

            selectProjectDialogApplications(['app:b', 'app:c']);
            expect(ownConfigOf('app:b')?.getString('color')).toBe('red');
            expect(configOf('app:c')).toBeDefined();

            selectProjectDialogApplications(['app:c']);
            expect(ownConfigOf('app:b')).toBeUndefined();
        });

        it('should keep an inherited app left out of the selection', async () => {
            await openCreateProjectDialog([createProject('parent', [createSiteConfig('app:b', {})])]);

            selectProjectDialogApplications(['app:a']);

            expect(listedKeys()).toEqual(['app:b', 'app:a']);
        });

        it('should resolve a newly added app to its form defaults', async () => {
            await openCreateProjectDialog([]);

            selectProjectDialogApplications(['app:a']);

            expect(configOf('app:a')?.getPropertyArray('agree')?.get(0)?.getValue().getBoolean()).toBe(true);
            expect(ownConfigOf('app:a')).toBeUndefined();
        });
    });

    describe('unselectProjectDialogApplication', () => {
        it('should remove an own app and ignore an inherited one', async () => {
            await openCreateProjectDialog([createProject('parent', [createSiteConfig('app:b', {})])]);
            selectProjectDialogApplications(['app:a']);

            unselectProjectDialogApplication('app:b');
            expect(listedKeys()).toEqual(['app:b', 'app:a']);

            unselectProjectDialogApplication('app:a');
            expect(listedKeys()).toEqual(['app:b']);
        });
    });

    describe('moveProjectDialogApplication', () => {
        it('should reorder the list', async () => {
            await openCreateProjectDialog([]);
            selectProjectDialogApplications(['app:a', 'app:b', 'app:c']);

            moveProjectDialogApplication(2, 0);

            expect(listedKeys()).toEqual(['app:c', 'app:a', 'app:b']);
        });
    });

    describe('setProjectDialogApplicationConfig', () => {
        it('should mark the dialog dirty when a config changes and clean when it is restored', async () => {
            await openEditProjectDialog(createProject('layer', [createSiteConfig('app:b', { color: 'red' })]), []);

            const edited = new PropertyTree().getRoot();
            edited.setString('color', 0, 'green');
            setProjectDialogApplicationConfig('app:b', edited);
            expect($isProjectDialogDirty.get()).toBe(true);

            const restored = new PropertyTree().getRoot();
            restored.setString('color', 0, 'red');
            setProjectDialogApplicationConfig('app:b', restored);
            expect($isProjectDialogDirty.get()).toBe(false);
        });
    });

    describe('updateProject', () => {
        it('should send the stored config of every application', async () => {
            mockUpdateProject.mockReturnValue(okAsync({}));
            await openEditProjectDialog(createProject('layer', [createSiteConfig('app:b', { color: 'red' })]), []);

            const edited = new PropertyTree().getRoot();
            edited.setString('color', 0, 'green');
            setProjectDialogApplicationConfig('app:b', edited);
            await updateProject();

            expect(mockUpdateProject).toHaveBeenCalledTimes(1);
            const { applicationConfigs } = mockUpdateProject.mock.calls[0][0] as {
                applicationConfigs: ApplicationConfig[];
            };
            expect(applicationConfigs).toHaveLength(1);
            expect(applicationConfigs[0].getApplicationKey().toString()).toBe('app:b');
            expect(applicationConfigs[0].getConfig().getString('color')).toBe('green');
        });

        it('should skip the update request when only the selection order is unchanged', async () => {
            await openEditProjectDialog(createProject('layer', [createSiteConfig('app:b', { color: 'red' })]), []);

            await updateProject();

            expect(mockUpdateProject).not.toHaveBeenCalled();
        });
    });
});
