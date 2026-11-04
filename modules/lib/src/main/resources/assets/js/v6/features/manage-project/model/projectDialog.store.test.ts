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
    applyProjectDialogApplicationConfig,
    $projectDialog,
    createProject as createProjectAction,
    $projectDialogConfigScope,
    $projectDialogInheritedAppKeys,
    closeProjectDialog,
    closeProjectDialogApplicationConfig,
    discardProjectDialogApplicationConfig,
    getProjectDialogApplicationConfig,
    moveProjectDialogApplication,
    openCreateProjectDialog,
    openEditProjectDialog,
    openProjectDialogApplicationConfig,
    selectProjectDialogApplications,
    setProjectDialogApplicationConfig,
    setProjectDialogConfigDirty,
    setProjectDialogName,
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
const sentConfigs = (mock: typeof mockUpdateProject): ApplicationConfig[] =>
    (mock.mock.calls[0][0] as { applicationConfigs: ApplicationConfig[] }).applicationConfigs;
const rename = (): void =>
    setProjectDialogName({ name: 'renamed', identifier: 'layer', description: '', hasError: false });

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

        it('should resolve the own config, and the form defaults for an inherited app, never the parent one', async () => {
            const parent = createProject('parent', [
                createSiteConfig('app:a', { agree: 'no' }),
                createSiteConfig('app:b', { color: 'blue' }),
            ]);
            const layer = createProject('layer', [createSiteConfig('app:b', { color: 'red' })]);

            await openEditProjectDialog(layer, [parent]);

            expect(configOf('app:b')?.getString('color')).toBe('red');
            expect(configOf('app:a')?.getPropertyArray('agree')?.get(0)?.getValue().getBoolean()).toBe(true);
            expect(ownConfigOf('app:a')).toBeUndefined();
        });

        it('should mark an edited inherited config dirty and one back at the defaults clean', async () => {
            const parent = createProject('parent', [createSiteConfig('app:b', { color: 'blue' })]);
            await openEditProjectDialog(createProject('layer', []), [parent]);

            const edited = new PropertyTree().getRoot();
            edited.setString('color', 0, 'green');
            setProjectDialogApplicationConfig('app:b', edited);
            expect($isProjectDialogDirty.get()).toBe(true);

            setProjectDialogApplicationConfig('app:b', new PropertyTree().getRoot());
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
        it('should collect the keys of the first parent only', async () => {
            const p1 = createProject('p1', [createSiteConfig('app:a', {}), createSiteConfig('app:b', {})]);
            const p2 = createProject('p2', [createSiteConfig('app:a', {}), createSiteConfig('app:c', {})]);

            await openCreateProjectDialog([p1, p2]);

            expect([...$projectDialogInheritedAppKeys.get()]).toEqual(['app:a', 'app:b']);
        });

        it('should keep the same set across an unrelated change and replace it on a parent switch', async () => {
            const p1 = createProject('p1', [createSiteConfig('app:a', {})]);
            await openCreateProjectDialog([p1]);
            const before = $projectDialogInheritedAppKeys.get();

            rename();
            expect($projectDialogInheritedAppKeys.get()).toBe(before);

            setProjectDialogParentProjects([createProject('p2', [createSiteConfig('app:b', {})])]);
            expect($projectDialogInheritedAppKeys.get()).not.toBe(before);
            expect([...$projectDialogInheritedAppKeys.get()]).toEqual(['app:b']);
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

        it('should give a newly inherited app the form defaults, not the parent config', async () => {
            await openCreateProjectDialog([]);

            setProjectDialogParentProjects([createProject('parent', [createSiteConfig('app:b', { color: 'blue' })])]);

            expect(configOf('app:b')?.toJson()).toEqual([]);
        });

        it('should ignore the same parents set again', async () => {
            await openCreateProjectDialog([createProject('p1', [createSiteConfig('app:a', {})])]);
            const { applications, applicationConfigs } = $projectDialog.get();
            const inheritedKeys = $projectDialogInheritedAppKeys.get();

            setProjectDialogParentProjects([createProject('p1', [createSiteConfig('app:a', {})])]);

            expect($projectDialog.get().applications).toBe(applications);
            expect($projectDialog.get().applicationConfigs).toBe(applicationConfigs);
            expect($projectDialogInheritedAppKeys.get()).toBe(inheritedKeys);
        });
    });

    describe('openCreateProjectDialog', () => {
        it('should list an inherited app at the form defaults and keep no own config', async () => {
            const parent = createProject('parent', [createSiteConfig('app:b', { color: 'blue' })]);

            await openCreateProjectDialog([parent]);

            expect(configOf('app:b')?.toJson()).toEqual([]);
            expect(ownConfigOf('app:b')).toBeUndefined();
        });

        it('should list the first parent apps and follow a reorder', async () => {
            const p1 = createProject('p1', [createSiteConfig('app:a', { color: 'red' })]);
            const p2 = createProject('p2', [createSiteConfig('app:b', { color: 'blue' })]);

            await openCreateProjectDialog([p1, p2]);
            expect(listedKeys()).toEqual(['app:a']);

            setProjectDialogParentProjects([p2, p1]);
            expect(listedKeys()).toEqual(['app:b']);
        });

        it('should not inherit an app only the second parent carries', async () => {
            const p1 = createProject('p1', [createSiteConfig('app:a', { color: 'red' })]);
            const p2 = createProject('p2', [createSiteConfig('app:b', { color: 'blue' })]);

            await openCreateProjectDialog([p1, p2]);

            expect(listedKeys()).toEqual(['app:a']);
            expect(configOf('app:b')).toBeUndefined();
        });

        it('should send the form defaults for an inherited app, whichever parent it came from', async () => {
            mockCreateProject.mockReturnValue(okAsync(createProject('layer', [])));
            mockUpdateProjectPermissions.mockReturnValue(okAsync({}));
            const p1 = createProject('p1', [createSiteConfig('app:a', { agree: 'no' })]);
            const p2 = createProject('p2', [createSiteConfig('app:a', { agree: 'maybe' })]);
            await openCreateProjectDialog([p1]);

            setProjectDialogParentProjects([p2]);
            await createProjectAction();

            const configs = sentConfigs(mockCreateProject);
            expect(configs.map((c) => c.getApplicationKey().toString())).toEqual(['app:a']);
            expect(configs[0].getConfig().getPropertyArray('agree')?.get(0)?.getValue().getBoolean()).toBe(true);
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

    describe('application config view', () => {
        const editing = () => $projectDialog.get().editingConfig;
        const view = () => $projectDialog.get().view;

        it('should open the config view on a clone of the resolved config', async () => {
            await openEditProjectDialog(createProject('layer', [createSiteConfig('app:b', { color: 'red' })]), []);

            openProjectDialogApplicationConfig('app:b');

            expect(view()).toBe('config');
            expect(editing()?.application.getApplicationKey().toString()).toBe('app:b');
            expect(editing()?.configSet.getString('color')).toBe('red');
            expect(editing()?.configSet).not.toBe(configOf('app:b'));
            expect($projectDialog.get().configDirty).toBe(false);
        });

        it('should ignore an app that is not listed', async () => {
            await openEditProjectDialog(createProject('layer', []), []);

            openProjectDialogApplicationConfig('app:b');

            expect(view()).toBe('main');
            expect(editing()).toBeUndefined();
        });

        it('should not open the config view while creating', async () => {
            await openCreateProjectDialog([]);
            selectProjectDialogApplications(['app:a']);

            openProjectDialogApplicationConfig('app:a');

            expect(view()).toBe('main');
            expect(editing()).toBeUndefined();
        });

        it('should store the edited clone as the own config on apply', async () => {
            await openEditProjectDialog(createProject('layer', [createSiteConfig('app:b', { color: 'red' })]), []);
            openProjectDialogApplicationConfig('app:b');
            editing()?.configSet.setString('color', 0, 'green');

            applyProjectDialogApplicationConfig();

            expect(view()).toBe('main');
            expect(editing()).toBeUndefined();
            expect(ownConfigOf('app:b').getString('color')).toBe('green');
            expect($isProjectDialogDirty.get()).toBe(true);
        });

        it('should close without asking when the config is clean', async () => {
            await openEditProjectDialog(createProject('layer', [createSiteConfig('app:b', { color: 'red' })]), []);
            openProjectDialogApplicationConfig('app:b');

            closeProjectDialogApplicationConfig();

            expect(view()).toBe('main');
            expect(editing()).toBeUndefined();
        });

        it('should ask before closing when the config is dirty, then drop the edit on discard', async () => {
            await openEditProjectDialog(createProject('layer', [createSiteConfig('app:b', { color: 'red' })]), []);
            openProjectDialogApplicationConfig('app:b');
            editing()?.configSet.setString('color', 0, 'green');
            setProjectDialogConfigDirty(true);

            closeProjectDialogApplicationConfig();
            expect(view()).toBe('config-discard');
            expect(editing()).toBeDefined();

            discardProjectDialogApplicationConfig();
            expect(view()).toBe('main');
            expect(editing()).toBeUndefined();
            expect(ownConfigOf('app:b').getString('color')).toBe('red');
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

        it('should send the form defaults for an inherited app, not the parent config', async () => {
            mockUpdateProject.mockReturnValue(okAsync({}));
            const parent = createProject('parent', [createSiteConfig('app:b', { color: 'blue' })]);
            await openEditProjectDialog(createProject('layer', []), [parent]);

            rename();
            await updateProject();

            const configs = sentConfigs(mockUpdateProject);
            expect(configs.map((c) => c.getApplicationKey().toString())).toEqual(['app:b']);
            expect(configs[0].getConfig().toJson()).toEqual([]);
        });
    });

    describe('preserved configs', () => {
        const projectWithUnlisted = () =>
            createProject('layer', [
                createSiteConfig('portal', { baseUrl: '/site' }),
                createSiteConfig('app:b', { color: 'red' }),
                createSiteConfig('app:gone', { k: 'v' }),
            ]);

        it('should list only the installed apps and open clean', async () => {
            await openEditProjectDialog(projectWithUnlisted(), []);

            expect(listedKeys()).toEqual(['app:b']);
            expect($projectDialog.get().preservedSiteConfigs.map((c) => c.getApplicationKey().toString())).toEqual([
                'portal',
                'app:gone',
            ]);
            expect($isProjectDialogDirty.get()).toBe(false);
        });

        it('should send the portal and uninstalled configs back unchanged, around the listed apps', async () => {
            mockUpdateProject.mockReturnValue(okAsync({}));
            await openEditProjectDialog(projectWithUnlisted(), []);

            rename();
            await updateProject();

            const configs = sentConfigs(mockUpdateProject);
            expect(configs.map((c) => c.getApplicationKey().toString())).toEqual(['portal', 'app:b', 'app:gone']);
            expect(configs[0].getConfig().getString('baseUrl')).toBe('/site');
            expect(configs[1].getConfig().getString('color')).toBe('red');
            expect(configs[2].getConfig().getString('k')).toBe('v');
        });

        it('should preserve nothing on create', async () => {
            mockCreateProject.mockReturnValue(okAsync(createProject('layer', [])));
            mockUpdateProjectPermissions.mockReturnValue(okAsync({}));
            await openCreateProjectDialog([]);

            await createProjectAction();

            expect(sentConfigs(mockCreateProject)).toEqual([]);
        });
    });
});
