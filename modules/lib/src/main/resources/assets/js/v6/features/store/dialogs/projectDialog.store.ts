import {atom, computed, map} from 'nanostores';
import {ResultAsync} from 'neverthrow';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {showError, showSuccess} from '@enonic/lib-admin-ui/notify/MessageBus';
import {type Project} from '../../../../app/settings/data/project/Project';
import {ProjectConfigContext} from '../../../../app/settings/data/project/ProjectConfigContext';
import {loadLanguages} from '../languages.store';
import {ProjectAccess} from '../../../../app/settings/access/ProjectAccess';
import {ProjectCreateRequest} from '../../../../app/settings/resource/ProjectCreateRequest';
import {ProjectUpdateRequest} from '../../../../app/settings/resource/ProjectUpdateRequest';
import {ProjectReadAccess} from '../../../../app/settings/data/project/ProjectReadAccess';
import {type ProjectReadAccessType} from '../../../../app/settings/data/project/ProjectReadAccessType';
import {UpdateProjectLanguageRequest} from '../../../../app/settings/resource/UpdateProjectLanguageRequest';
import {UpdateProjectPermissionsRequest} from '../../../../app/settings/resource/UpdateProjectPermissionsRequest';
import {ProjectItemPermissionsBuilder} from '../../../../app/settings/data/project/ProjectPermissions';
import {type Principal} from '@enonic/lib-admin-ui/security/Principal';
import {type Application} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {$applications, loadApplications} from '../applications.store';
import {getProjectDetailedPermissions} from '../../utils/url/projects';
import {$principals, loadPrincipalsByKeys} from '../principals.store';
import {formatError} from '../../utils/format/error';
import {UpdateProjectReadAccessRequest} from '../../../../app/settings/resource/UpdateProjectReadAccessRequest';
import {trackTask} from '../../services/task.service';
import {ProjectCreatedEvent} from '../../../../app/settings/event/ProjectCreatedEvent';
import {ProjectUpdatedEvent} from '../../../../app/settings/event/ProjectUpdatedEvent';
import {clearSelection, setActive} from '../settingsTreeSelection.store';
import {$settingsTreeState, resetSettingsTreeForReload} from '../settings-tree.store';
import {reloadProjects} from '../projects.store';

//
// * Store State
//

export type ProjectNameData = {
    name: string;
    identifier: string;
    description: string;
    hasError: boolean;
};

type ProjectDialogStore = {
    // config
    title: string;
    open: boolean;
    mode: 'create' | 'edit';
    view: 'main' | 'confirmation';
    isMultiInheritance: boolean;
    step: string;
    submitting: boolean;

    // data
    parentProjects: Readonly<Project>[];
    defaultLanguage: string;
    accessMode: string;
    permissions: Principal[];
    roles: Record<string, ProjectAccess>;
    rolePrincipals: Principal[];
    applications: Application[];
    nameData: ProjectNameData;
};

type EditProjectSnapshot = {
    name: string;
    description: string;
    defaultLanguage: string;
    accessMode: string;
    permissions: Principal[];
    roles: Record<string, ProjectAccess>;
    applications: Application[];
};

const initialState: ProjectDialogStore = {
    // config
    title: '',
    open: false,
    view: 'main',
    isMultiInheritance: false,
    step: 'step-parent',
    submitting: false,
    mode: 'create',

    // data
    parentProjects: [],
    defaultLanguage: '',
    accessMode: '',
    permissions: [],
    roles: {},
    rolePrincipals: [],
    applications: [],
    nameData: {
        name: '',
        identifier: '',
        description: '',
        hasError: false,
    },
};

export const $projectDialog = map<ProjectDialogStore>(structuredClone(initialState));
const $editProjectSnapshot = atom<EditProjectSnapshot | null>(null);

export const $isProjectDialogDirty = computed([$projectDialog, $editProjectSnapshot], (state, snapshot): boolean => {
    if (state.mode === 'edit' && snapshot) {
        const currentPermissionKeys = state.permissions.map((p) => p.getKey().toString());
        const snapshotPermissionKeys = snapshot.permissions.map((p) => p.getKey().toString());
        const permissionsDirty =
            currentPermissionKeys.length !== snapshotPermissionKeys.length ||
            currentPermissionKeys.some((k, i) => k !== snapshotPermissionKeys[i]);

        const currentRoleKeys = Object.keys(state.roles);
        const snapshotRoleKeys = Object.keys(snapshot.roles);
        const rolesDirty =
            currentRoleKeys.length !== snapshotRoleKeys.length ||
            currentRoleKeys.some((k, i) => k !== snapshotRoleKeys[i]) ||
            currentRoleKeys.some((k) => state.roles[k] !== snapshot.roles[k]);

        const currentAppKeys = state.applications.map((a) => a.getApplicationKey().toString());
        const snapshotAppKeys = snapshot.applications.map((a) => a.getApplicationKey().toString());
        const appsDirty = currentAppKeys.length !== snapshotAppKeys.length || currentAppKeys.some((k, i) => k !== snapshotAppKeys[i]);

        return (
            permissionsDirty ||
            rolesDirty ||
            appsDirty ||
            state.defaultLanguage !== snapshot.defaultLanguage ||
            state.accessMode !== snapshot.accessMode ||
            state.nameData.name !== snapshot.name ||
            state.nameData.description !== snapshot.description
        );
    }

    return (
        state.defaultLanguage !== '' ||
        state.accessMode !== '' ||
        state.permissions.length > 0 ||
        Object.keys(state.roles).length > 0 ||
        state.rolePrincipals.length > 0 ||
        state.applications.length > 0 ||
        state.nameData.name !== '' ||
        state.nameData.identifier !== '' ||
        state.nameData.description !== ''
    );
});

//
// * Public API
//

export const openCreateProjectDialog = (selectedProjects: Project[]): void => {
    const isMultiInheritance = Boolean(ProjectConfigContext.get().getProjectConfig()?.isMultiInheritance());

    $projectDialog.set({
        ...structuredClone(initialState),
        title: i18n('dialog.project.wizard.title'),
        open: true,
        parentProjects: selectedProjects,
        isMultiInheritance: isMultiInheritance,
    });
};

export const openEditProjectDialog = async (project: Project, parentProjects: Project[]): Promise<void> => {
    const isMultiInheritance = Boolean(ProjectConfigContext.get().getProjectConfig()?.isMultiInheritance());
    const {principalKeys: rolePrincipalKeys, roles} = getProjectDetailedPermissions(project);

    const accessPrincipalKeys = project
        .getReadAccess()
        .getPrincipalsKeys()
        .map((k) => k.toString());

    await loadPrincipalsByKeys([...rolePrincipalKeys, ...accessPrincipalKeys].map((k) => PrincipalKey.fromString(k)));

    const principals = $principals.get().principals;
    const rolePrincipals = principals.filter((p) => rolePrincipalKeys.includes(p.getKey().toString()));
    const permissionPrincipals = principals.filter((p) => accessPrincipalKeys.includes(p.getKey().toString()));

    await loadApplications();

    const applications = $applications.get().applications;
    const projectApplications = project
        .getSiteConfigs()
        .map((config) => applications.find((app) => app.getApplicationKey().toString() === config.getApplicationKey().toString()))
        .filter(Boolean);

    const snapshot: EditProjectSnapshot = {
        name: project.getDisplayName() || '',
        description: project.getDescription() || '',
        defaultLanguage: project.getLanguage() || '',
        accessMode: project.getReadAccess().getType() || '',
        roles,
        permissions: permissionPrincipals,
        applications: projectApplications,
    };

    $editProjectSnapshot.set(snapshot);

    $projectDialog.set({
        ...structuredClone(initialState),
        title: i18n('dialog.project.wizard.edit.title', project.getDisplayName() ?? ''),
        open: true,
        mode: 'edit',
        isMultiInheritance,
        parentProjects,
        defaultLanguage: snapshot.defaultLanguage,
        accessMode: snapshot.accessMode || '',
        permissions: permissionPrincipals,
        roles: snapshot.roles,
        rolePrincipals: rolePrincipals,
        applications: projectApplications,
        nameData: {
            name: snapshot.name,
            identifier: project.getName(),
            description: snapshot.description,
            hasError: false,
        },
    });
};

export const closeProjectDialog = (): void => {
    $editProjectSnapshot.set(null);
    $projectDialog.set(structuredClone(initialState));
};

export const setProjectDialogView = (view: 'main' | 'confirmation'): void => {
    $projectDialog.setKey('view', view);
};

export const setProjectDialogStep = (step: string): void => {
    $projectDialog.setKey('step', step);
};

export const setProjectDialogParentProjects = (parentProjects: Readonly<Project>[]): void => {
    $projectDialog.setKey('parentProjects', parentProjects);
};

export const setProjectDialogDefaultLanguage = (defaultLanguage: string): void => {
    $projectDialog.setKey('defaultLanguage', defaultLanguage);
};

export const setProjectDialogAccessMode = (accessMode: string): void => {
    $projectDialog.setKey('accessMode', accessMode);
};

export const setProjectDialogPermissions = (permissions: Principal[]): void => {
    $projectDialog.setKey('permissions', permissions);
};

export const setProjectDialogRoles = (roles: Record<string, ProjectAccess>): void => {
    $projectDialog.setKey('roles', roles);
};

export const setProjectDialogRolePrincipals = (rolePrincipals: Principal[]): void => {
    $projectDialog.setKey('rolePrincipals', rolePrincipals);
};

export const setProjectDialogApplications = (applications: Application[]): void => {
    $projectDialog.setKey('applications', applications);
};

export const setProjectDialogName = (data: ProjectNameData): void => {
    $projectDialog.setKey('nameData', data);
};

export const createProject = (): ResultAsync<void, Error> => {
    $projectDialog.setKey('submitting', true);

    const {
        parentProjects,
        nameData: {name, identifier, description},
        defaultLanguage,
        permissions,
    } = $projectDialog.get();

    const {readAccess, applicationConfigs, projectRoles} = getDataForRequests();

    // Building requests
    const projectCreateRequest = new ProjectCreateRequest()
        .setParents(parentProjects)
        .setReadAccess(readAccess)
        .setDescription(description)
        .setName(identifier)
        .setDisplayName(name)
        .setApplicationConfigs(applicationConfigs);
    const updateProjectLanguageRequest = new UpdateProjectLanguageRequest().setName(identifier).setLanguage(defaultLanguage);
    const updateProjectPermissionsRequest = new UpdateProjectPermissionsRequest()
        .setName(identifier)
        .setPermissions(projectRoles)
        .setViewers(permissions.map((p: Principal) => p.getKey()));

    // Project create
    return ResultAsync.fromPromise(projectCreateRequest.sendAndParse(), formatError)
        .andThen((project) => {
            const updateLanguageResult = ResultAsync.fromPromise(updateProjectLanguageRequest.sendAndParse(), formatError);
            const updatePermissionsResult = ResultAsync.fromPromise(updateProjectPermissionsRequest.sendAndParse(), formatError);

            return ResultAsync.combine([updateLanguageResult, updatePermissionsResult]).map(() => project);
        })
        .map((project) => {
            $projectDialog.setKey('submitting', false);
            closeProjectDialog();
            new ProjectCreatedEvent(project.getName()).fire();
            showSuccess(i18n('notify.settings.project.created', project.getDisplayName()));
        })
        .mapErr((error) => {
            $projectDialog.setKey('submitting', false);
            showError(i18n('notify.settings.project.createFailed'));
            console.error(error);
            return error;
        });
};

export const updateProject = (): ResultAsync<void, Error> => {
    $projectDialog.setKey('submitting', true);

    const {
        nameData: {name, identifier, description},
        defaultLanguage,
        permissions,
    } = $projectDialog.get();

    const {readAccess, applicationConfigs, projectRoles} = getDataForRequests();

    // Building requests
    const projectUpdateRequest = new ProjectUpdateRequest()
        .setDescription(description)
        .setName(identifier)
        .setDisplayName(name)
        .setApplicationConfigs(applicationConfigs);
    const updateProjectLanguageRequest = new UpdateProjectLanguageRequest().setName(identifier).setLanguage(defaultLanguage);
    const updateProjectPermissionsRequest = new UpdateProjectPermissionsRequest()
        .setName(identifier)
        .setPermissions(projectRoles)
        .setViewers(permissions.map((p: Principal) => p.getKey()));
    const updateProjectReadAccessRequest = new UpdateProjectReadAccessRequest().setName(identifier).setReadAccess(readAccess);

    // Project update
    return ResultAsync.fromPromise<Project, Error>(projectUpdateRequest.sendAndParse(), formatError)
        .andThen((project) => {
            const updateLanguageResult = ResultAsync.fromPromise(updateProjectLanguageRequest.sendAndParse(), formatError);
            const updatePermissionsResult = ResultAsync.fromPromise(updateProjectPermissionsRequest.sendAndParse(), formatError);
            const updateReadAccessResult = ResultAsync.fromPromise(updateProjectReadAccessRequest.sendAndParse(), formatError);

            return ResultAsync.combine([updateLanguageResult, updatePermissionsResult, updateReadAccessResult]).map(([_, __, taskId]) => ({
                project,
                taskId,
            }));
        })
        .map(({project, taskId}) => {
            trackTask(taskId, {
                onComplete: (resultState, message) => {
                    if (resultState === 'SUCCESS') {
                        $projectDialog.setKey('submitting', false);
                        closeProjectDialog();
                        new ProjectUpdatedEvent(project.getName()).fire();
                        showSuccess(i18n('notify.settings.project.modified', project.getDisplayName()));
                        refreshAndSelectProject(project.getName());
                    } else {
                        $projectDialog.setKey('submitting', false);
                        showError(i18n('notify.settings.project.modifyFailed'));
                        console.error(message);
                    }
                },
            });
        })
        .mapErr((error) => {
            $projectDialog.setKey('submitting', false);
            showError(i18n('notify.settings.project.modifyFailed'));
            console.error(error);
            return error;
        });
};

//
// * Initialization
//

void loadLanguages();

//
// * Internal
//

function getDataForRequests() {
    const {accessMode, permissions, roles, applications} = $projectDialog.get();

    const readAccess = new ProjectReadAccess(
        accessMode as ProjectReadAccessType,
        permissions.map((p: Principal) => p.getKey())
    );

    const applicationConfigs = applications.map((app: Application) =>
        ApplicationConfig.create().setApplicationKey(app.getApplicationKey()).setConfig(new PropertySet()).build()
    );

    const rolesEntries = Object.entries(roles);

    const owners = rolesEntries.filter(([_, value]) => value === ProjectAccess.OWNER).map(([key]) => PrincipalKey.fromString(key));
    const contributors = rolesEntries
        .filter(([_, value]) => value === ProjectAccess.CONTRIBUTOR)
        .map(([key]) => PrincipalKey.fromString(key));
    const editors = rolesEntries.filter(([_, value]) => value === ProjectAccess.EDITOR).map(([key]) => PrincipalKey.fromString(key));
    const authors = rolesEntries.filter(([_, value]) => value === ProjectAccess.AUTHOR).map(([key]) => PrincipalKey.fromString(key));

    const projectRoles = new ProjectItemPermissionsBuilder()
        .setOwners(owners)
        .setContributors(contributors)
        .setEditors(editors)
        .setAuthors(authors)
        .build();

    return {
        readAccess,
        applicationConfigs,
        projectRoles,
    };
}

export function refreshAndSelectProject(projectId: string) {
    clearSelection();
    setActive(null);
    resetSettingsTreeForReload();
    reloadProjects();

    const unlisten = $settingsTreeState.listen((state) => {
        if (!state.nodes.has(projectId)) return;

        setActive(projectId);
        unlisten();
    });

    // Clean up after 10 seconds if the node never appears
    setTimeout(unlisten, 10000);
}
