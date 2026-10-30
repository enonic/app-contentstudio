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
    $projectDialogConfigScope,
    closeProjectDialog,
    openCreateProjectDialog,
    openEditProjectDialog,
    setProjectDialogApplicationConfig,
    setProjectDialogApplications,
    setProjectDialogParentProjects,
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

const configOf = (key: string) => $projectDialog.get().applicationConfigs[key];

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

        it('should fall back to the parent config for an inherited app the project has no config for', async () => {
            const parent = createProject('parent', [
                createSiteConfig('app:b', { color: 'blue' }),
                createSiteConfig('app:c', { size: 'large' }),
            ]);
            const layer = createProject('layer', [createSiteConfig('app:b', { color: 'red' })]);

            await openEditProjectDialog(layer, [parent]);

            expect(configOf('app:b')?.getString('color')).toBe('red');
            expect(configOf('app:c')?.getString('size')).toBe('large');
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
    });

    describe('openCreateProjectDialog', () => {
        it('should seed the configs from the parent projects', async () => {
            const parent = createProject('parent', [createSiteConfig('app:b', { color: 'blue' })]);

            await openCreateProjectDialog([parent]);

            expect(configOf('app:b')?.getString('color')).toBe('blue');
        });

        it('should have no project while creating', async () => {
            await openCreateProjectDialog([createProject('parent', [])]);

            expect($projectDialog.get().project).toBeUndefined();
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

    describe('setProjectDialogApplications', () => {
        it('should keep the configs of apps that stay and drop the removed ones', async () => {
            await openEditProjectDialog(createProject('layer', [createSiteConfig('app:b', { color: 'red' })]), []);

            setProjectDialogApplications([createApp('app:b'), createApp('app:c')]);
            expect(configOf('app:b')?.getString('color')).toBe('red');
            expect(configOf('app:c')).toBeDefined();

            setProjectDialogApplications([createApp('app:c')]);
            expect(configOf('app:b')).toBeUndefined();
        });

        it('should take the parent config for an app inherited from a parent picked after opening', async () => {
            await openCreateProjectDialog([]);
            setProjectDialogParentProjects([createProject('parent', [createSiteConfig('app:b', { color: 'blue' })])]);

            setProjectDialogApplications([createApp('app:b')]);

            expect(configOf('app:b')?.getString('color')).toBe('blue');
        });

        it('should seed the form defaults for a newly added app', async () => {
            await openCreateProjectDialog([]);

            setProjectDialogApplications([createApp('app:a', checkboxForm())]);

            expect(configOf('app:a')?.getPropertyArray('agree')?.get(0)?.getValue().getBoolean()).toBe(true);
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
