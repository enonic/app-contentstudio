import { atom, computed, map } from 'nanostores';
import { okAsync, ResultAsync } from 'neverthrow';
import { type TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { showError, showSuccess } from '@enonic/lib-admin-ui/notify/MessageBus';
import { i18n } from '../../../shared/i18n';
import { type Project } from '../../../../app/settings/data/project/Project';
import { ProjectConfigContext } from '../../../../app/settings/data/project/ProjectConfigContext';
import { ProjectAccess } from '../../../../app/settings/access/ProjectAccess';
import { ProjectReadAccess } from '../../../../app/settings/data/project/ProjectReadAccess';
import { type ProjectReadAccessType } from '../../../../app/settings/data/project/ProjectReadAccessType';
import { ProjectItemPermissionsBuilder } from '../../../../app/settings/data/project/ProjectPermissions';
import { type Principal } from '@enonic/lib-admin-ui/security/Principal';
import { type Application } from '@enonic/lib-admin-ui/application/Application';
import { ApplicationConfig } from '@enonic/lib-admin-ui/application/ApplicationConfig';
import { PropertySet, PropertyTree } from '@enonic/input-types/data';
import { seedFormDefaults } from '@enonic/input-types';
import { PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { $applications, loadApplications } from '../../../entities/application';
import { getProjectDetailedPermissions } from '../../../shared/lib/url/projects';
import { $principals, loadPrincipalsByKeys } from '../../../entities/principal';
import {
    createProject as createProjectRequest,
    updateProject as updateProjectRequest,
    updateProjectPermissions,
    updateProjectReadAccess,
} from '../../../entities/project/api/projects.api';
import { trackTask } from '../../../entities/task';
import { ProjectCreatedEvent } from '../../../../app/settings/event/ProjectCreatedEvent';
import { ProjectUpdatedEvent } from '../../../../app/settings/event/ProjectUpdatedEvent';
import { clearSelection, setActive } from '../../../pages/settings/model/settingsTreeSelection.store';
import { $settingsTreeState, resetSettingsTreeForReload } from '../../../pages/settings/model/settings-tree.store';
import { $projects, reloadProjects } from '../../../entities/project/projects.store';
import { setProjectSelectionDialogOpen } from '../../../shared/dialogs/dialogs.store';
import { type FormScope } from '../../shared/form';

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
    view: 'main' | 'dirty-confirmation' | 'access-confirmation' | 'progress';
    isMultiInheritance: boolean;
    step: string;
    submitting: boolean;
    readAccessProgress: number | null;

    // data
    /** The edited project; unset while creating. */
    project?: Readonly<Project>;
    parentProjects: Readonly<Project>[];
    defaultLanguage: string;
    accessMode: string;
    permissions: Principal[];
    roles: Record<string, ProjectAccess>;
    rolePrincipals: Principal[];
    /** The listed applications in order: the project's own and the inherited ones. */
    applications: Application[];
    /**
     * The own configs by app key: the edited project's, plus what the user applies. An app
     * without one resolves to its first parent's, else to the form defaults.
     */
    applicationConfigs: Record<string, PropertySet>;
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
    /** Serialized applications with their configs, see `serializeApplicationConfigs`. */
    applicationConfigs: string;
};

const initialState: ProjectDialogStore = {
    // config
    title: '',
    open: false,
    view: 'main',
    isMultiInheritance: false,
    step: 'step-parent',
    submitting: false,
    readAccessProgress: null,
    mode: 'create',

    // data
    parentProjects: [],
    defaultLanguage: '',
    accessMode: '',
    permissions: [],
    roles: {},
    rolePrincipals: [],
    applications: [],
    applicationConfigs: {},
    nameData: {
        name: '',
        identifier: '',
        description: '',
        hasError: false,
    },
};

export const $projectDialog = map<ProjectDialogStore>(structuredClone(initialState));
const $editProjectSnapshot = atom<EditProjectSnapshot | undefined>(undefined);
const $initialParentNames = atom<readonly string[]>([]);
/** The apps seeded from the parents on create, serialized like the edit snapshot's. */
const $initialApplicationConfigs = atom<string>(serializeApplicationConfigs([], {}, []));
const $confirmedAccessMode = atom<string | undefined>(undefined);

export const $isProjectDialogAccessModeDirty = computed(
    [$projectDialog, $editProjectSnapshot, $confirmedAccessMode],
    (state, snapshot, confirmedAccessMode): boolean => {
        if (state.mode !== 'edit' || !snapshot) return false;
        if (state.accessMode === snapshot.accessMode) return false;
        if (confirmedAccessMode !== undefined && state.accessMode === confirmedAccessMode) return false;

        return true;
    },
);

/** The scope of an application's config form: the edited project, if any, and no content. */
export const $projectDialogConfigScope = computed($projectDialog, ({ project }): FormScope => ({
    project: project ?? null,
    content: null,
}));

/** The keys of the apps inherited from the parent projects, in parent order. */
export const $projectDialogInheritedAppKeys = computed(
    $projectDialog,
    ({ parentProjects }): ReadonlySet<string> => new Set(getInheritedAppKeys(parentProjects)),
);

export const $isProjectDialogDirty = computed(
    [$projectDialog, $editProjectSnapshot, $initialParentNames, $initialApplicationConfigs],
    (state, snapshot, initialParents, initialApplicationConfigs): boolean => {
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
                currentRoleKeys.some((k) => state.roles[k] !== snapshot.roles[k]);

            const appsDirty =
                serializeApplicationConfigs(state.applications, state.applicationConfigs, state.parentProjects) !==
                snapshot.applicationConfigs;

            return (
                permissionsDirty ||
                rolesDirty ||
                appsDirty ||
                state.defaultLanguage !== snapshot.defaultLanguage ||
                $isProjectDialogAccessModeDirty.get() ||
                state.nameData.name !== snapshot.name ||
                state.nameData.description !== snapshot.description
            );
        }

        const currentParentNames = state.parentProjects.map((p) => p.getName());
        const parentsDirty =
            currentParentNames.length !== initialParents.length ||
            currentParentNames.some((name, i) => name !== initialParents[i]);

        return (
            parentsDirty ||
            state.defaultLanguage !== '' ||
            state.accessMode !== '' ||
            state.permissions.length > 0 ||
            Object.keys(state.roles).length > 0 ||
            state.rolePrincipals.length > 0 ||
            serializeApplicationConfigs(state.applications, state.applicationConfigs, state.parentProjects) !==
                initialApplicationConfigs ||
            state.nameData.name !== '' ||
            state.nameData.identifier !== '' ||
            state.nameData.description !== ''
        );
    },
);

//
// * Public API
//

export const openCreateProjectDialog = async (selectedProjects: Project[]): Promise<void> => {
    const isMultiInheritance = Boolean(ProjectConfigContext.get().getProjectConfig()?.isMultiInheritance());

    await loadApplications();

    const selectedApplications = resolveApplications(getInheritedAppKeys(selectedProjects));

    $initialParentNames.set(selectedProjects.map((p) => p.getName()));
    $initialApplicationConfigs.set(serializeApplicationConfigs(selectedApplications, {}, selectedProjects));
    $projectDialog.set({
        ...structuredClone(initialState),
        title: i18n('dialog.project.wizard.title'),
        open: true,
        parentProjects: selectedProjects,
        applications: selectedApplications,
        isMultiInheritance: isMultiInheritance,
    });
};

export const openEditProjectDialog = async (project: Project, parentProjects: Project[]): Promise<void> => {
    const isMultiInheritance = Boolean(ProjectConfigContext.get().getProjectConfig()?.isMultiInheritance());
    const { principalKeys: rolePrincipalKeys, roles } = getProjectDetailedPermissions(project);

    const accessPrincipalKeys = project
        .getReadAccess()
        .getPrincipalsKeys()
        .map((k) => k.toString());

    await loadPrincipalsByKeys([...rolePrincipalKeys, ...accessPrincipalKeys].map((k) => PrincipalKey.fromString(k)));

    const principals = $principals.get().principals;
    const rolePrincipals = principals.filter((p) => rolePrincipalKeys.includes(p.getKey().toString()));
    const permissionPrincipals = principals.filter((p) => accessPrincipalKeys.includes(p.getKey().toString()));

    await loadApplications();

    // The project's own apps first, then the inherited ones it has no config for.
    const ownKeys = project.getSiteConfigs().map((config) => config.getApplicationKey().toString());
    const inheritedKeys = getInheritedAppKeys(parentProjects).filter((key) => !ownKeys.includes(key));
    const projectApplications = resolveApplications([...ownKeys, ...inheritedKeys]);

    const applicationConfigs = collectSiteConfigs([project]);

    const snapshot: EditProjectSnapshot = {
        name: project.getDisplayName() || '',
        description: project.getDescription() || '',
        defaultLanguage: project.getLanguage() || '',
        accessMode: project.getReadAccess().getType() || '',
        roles,
        permissions: permissionPrincipals,
        applications: projectApplications,
        applicationConfigs: serializeApplicationConfigs(projectApplications, applicationConfigs, parentProjects),
    };

    $editProjectSnapshot.set(snapshot);
    $confirmedAccessMode.set(undefined);

    $projectDialog.set({
        ...structuredClone(initialState),
        title: i18n('dialog.project.wizard.edit.title', project.getDisplayName() ?? ''),
        open: true,
        mode: 'edit',
        isMultiInheritance,
        project,
        parentProjects,
        defaultLanguage: snapshot.defaultLanguage,
        accessMode: snapshot.accessMode || '',
        permissions: permissionPrincipals,
        roles: snapshot.roles,
        rolePrincipals: rolePrincipals,
        applications: projectApplications,
        applicationConfigs,
        nameData: {
            name: snapshot.name,
            identifier: project.getName(),
            description: snapshot.description,
            hasError: false,
        },
    });
};

export const closeProjectDialog = (): void => {
    $editProjectSnapshot.set(undefined);
    $initialParentNames.set([]);
    $initialApplicationConfigs.set(serializeApplicationConfigs([], {}, []));
    $confirmedAccessMode.set(undefined);
    $projectDialog.set(structuredClone(initialState));
};

export const cancelProjectDialog = (): void => {
    closeProjectDialog();
    if ($projects.get().activeProjectId == null) {
        setProjectSelectionDialogOpen(true);
    }
};

export const setProjectDialogView = (view: ProjectDialogStore['view']): void => {
    $projectDialog.setKey('view', view);
};

export const setProjectDialogStep = (step: string): void => {
    $projectDialog.setKey('step', step);
};

/** Sets the parents; drops the apps no longer inherited and appends the newly inherited ones. */
export const setProjectDialogParentProjects = (parentProjects: Readonly<Project>[]): void => {
    const state = $projectDialog.get();
    const before = new Set(getInheritedAppKeys(state.parentProjects));
    const after = getInheritedAppKeys(parentProjects);
    const afterSet = new Set(after);
    const listed = new Set(state.applications.map(keyOf));

    const kept = state.applications.filter((app) => !before.has(keyOf(app)) || afterSet.has(keyOf(app)));
    const added = resolveApplications(after.filter((key) => !listed.has(key)));

    $projectDialog.setKey('parentProjects', parentProjects);
    setApplications([...kept, ...added]);
};

export const setProjectDialogDefaultLanguage = (defaultLanguage: string): void => {
    $projectDialog.setKey('defaultLanguage', defaultLanguage);
};

export const setProjectDialogAccessMode = (accessMode: string): void => {
    $projectDialog.setKey('accessMode', accessMode);
};

export const confirmProjectDialogAccessMode = (): void => {
    $confirmedAccessMode.set($projectDialog.get().accessMode);
};

export const revertProjectDialogAccessMode = (): void => {
    const snapshot = $editProjectSnapshot.get();
    if (!snapshot) return;

    const confirmed = $confirmedAccessMode.get();
    const target = confirmed ?? snapshot.accessMode;
    $projectDialog.setKey('accessMode', target);

    if (target === snapshot.accessMode) {
        $projectDialog.setKey('permissions', snapshot.permissions);
    }
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

/** Applies a selection: new keys are appended in order, inherited apps stay even when left out. */
export const selectProjectDialogApplications = (keys: readonly string[]): void => {
    const { applications, parentProjects } = $projectDialog.get();
    const inherited = new Set(getInheritedAppKeys(parentProjects));
    const selected = new Set(keys);
    const listed = new Set(applications.map(keyOf));

    const kept = applications.filter((app) => selected.has(keyOf(app)) || inherited.has(keyOf(app)));
    const added = resolveApplications(keys.filter((key) => !listed.has(key)));
    if (kept.length === applications.length && added.length === 0) return;

    setApplications([...kept, ...added]);
};

/** Removes an app from the list; inherited apps cannot be removed. */
export const unselectProjectDialogApplication = (key: string): void => {
    const { applications, parentProjects } = $projectDialog.get();
    if (getInheritedAppKeys(parentProjects).includes(key)) return;

    setApplications(applications.filter((app) => keyOf(app) !== key));
};

export const moveProjectDialogApplication = (fromIndex: number, toIndex: number): void => {
    const next = [...$projectDialog.get().applications];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return;

    next.splice(toIndex, 0, moved);
    $projectDialog.setKey('applications', next);
};

/** Sets the list and drops the own configs of the apps no longer on it. */
function setApplications(applications: Application[]): void {
    const { applicationConfigs: previous } = $projectDialog.get();
    const listed = new Set(applications.map(keyOf));
    const applicationConfigs = Object.fromEntries(Object.entries(previous).filter(([key]) => listed.has(key)));

    $projectDialog.setKey('applications', applications);
    $projectDialog.setKey('applicationConfigs', applicationConfigs);
}

export const setProjectDialogApplicationConfig = (applicationKey: string, config: PropertySet): void => {
    $projectDialog.setKey('applicationConfigs', {
        ...$projectDialog.get().applicationConfigs,
        [applicationKey]: config,
    });
};

/** The config a listed app currently resolves to, see `resolveApplicationConfig`. Not a clone. */
export const getProjectDialogApplicationConfig = (applicationKey: string): PropertySet | undefined => {
    const { applications, applicationConfigs, parentProjects } = $projectDialog.get();
    const application = applications.find((app) => keyOf(app) === applicationKey);
    return application && resolveApplicationConfig(application, applicationConfigs, parentProjects);
};

export const setProjectDialogName = (data: ProjectNameData): void => {
    $projectDialog.setKey('nameData', data);
};

export const createProject = (): ResultAsync<void, Error> => {
    $projectDialog.setKey('submitting', true);

    const {
        parentProjects,
        nameData: { name, identifier, description },
        defaultLanguage,
        permissions,
    } = $projectDialog.get();

    const { readAccess, applicationConfigs, projectRoles } = getDataForRequests();

    // Project create, followed by the permissions update.
    return createProjectRequest({
        name: identifier,
        displayName: name,
        description,
        language: defaultLanguage,
        applicationConfigs,
        parents: parentProjects,
        readAccess,
    })
        .andThen((project) =>
            updateProjectPermissions(
                identifier,
                projectRoles,
                permissions.map((p: Principal) => p.getKey()),
            ).map(() => project),
        )
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
    const {
        nameData: { name, identifier, description },
        defaultLanguage,
        accessMode,
        permissions,
    } = $projectDialog.get();

    const { readAccess, applicationConfigs, projectRoles } = getDataForRequests();
    const { updateGuard, permissionsGuard, accessGuard } = getRequestsGuards();

    const handleUpdateSuccess = (): void => {
        $projectDialog.setKey('submitting', false);
        $projectDialog.setKey('readAccessProgress', null);
        closeProjectDialog();
        new ProjectUpdatedEvent(identifier).fire();
        showSuccess(i18n('notify.settings.project.modified', name));
        refreshAndSelectProject(identifier);
    };

    const handleUpdateError = (message?: string): void => {
        $projectDialog.setKey('submitting', false);
        $projectDialog.setKey('readAccessProgress', null);
        $projectDialog.setKey('view', 'main');
        showError(i18n('notify.settings.project.modifyFailed'));
        if (message) console.error(message);
    };

    $projectDialog.setKey('submitting', true);

    const modifyResult: ResultAsync<void, Error> = updateGuard
        ? updateProjectRequest({
              name: identifier,
              displayName: name,
              description,
              language: defaultLanguage,
              applicationConfigs,
          }).map(() => undefined)
        : okAsync(undefined);

    return modifyResult
        .andThen(() => {
            const requests: ResultAsync<unknown, Error>[] = [];

            if (permissionsGuard) {
                requests.push(
                    updateProjectPermissions(
                        identifier,
                        projectRoles,
                        accessMode === 'custom' ? permissions.map((p: Principal) => p.getKey()) : [],
                    ),
                );
            }

            if (accessGuard) {
                $projectDialog.setKey('view', 'progress');
                const readAccessResult = updateProjectReadAccess(identifier, readAccess);
                return ResultAsync.combine([...requests, readAccessResult]).map(
                    (results) => results[results.length - 1] as TaskId,
                );
            }

            if (requests.length === 0) {
                return okAsync(null as TaskId | null);
            }

            return ResultAsync.combine(requests).map(() => null as TaskId | null);
        })
        .map((taskId) => {
            if (taskId) {
                trackTask(taskId, {
                    onComplete: (resultState, message) => {
                        if (resultState === 'SUCCESS') {
                            handleUpdateSuccess();
                        } else {
                            handleUpdateError(message);
                        }
                    },
                    onProgress: (progress) => {
                        $projectDialog.setKey('readAccessProgress', progress);
                    },
                });
            } else {
                handleUpdateSuccess();
            }
        })
        .mapErr((error) => {
            handleUpdateError();
            console.error(error);
            return error;
        });
};

//
// * Internal
//

function getDataForRequests() {
    const { accessMode, permissions, roles, applications, applicationConfigs, parentProjects } = $projectDialog.get();

    const readAccess = new ProjectReadAccess(
        accessMode as ProjectReadAccessType,
        permissions.map((p: Principal) => p.getKey()),
    );

    const requestConfigs = applications.map((app: Application) =>
        ApplicationConfig.create()
            .setApplicationKey(app.getApplicationKey())
            .setConfig(resolveApplicationConfig(app, applicationConfigs, parentProjects))
            .build(),
    );

    const rolesEntries = Object.entries(roles);

    const owners = rolesEntries
        .filter(([_, value]) => value === ProjectAccess.OWNER)
        .map(([key]) => PrincipalKey.fromString(key));
    const contributors = rolesEntries
        .filter(([_, value]) => value === ProjectAccess.CONTRIBUTOR)
        .map(([key]) => PrincipalKey.fromString(key));
    const editors = rolesEntries
        .filter(([_, value]) => value === ProjectAccess.EDITOR)
        .map(([key]) => PrincipalKey.fromString(key));
    const authors = rolesEntries
        .filter(([_, value]) => value === ProjectAccess.AUTHOR)
        .map(([key]) => PrincipalKey.fromString(key));

    const projectRoles = new ProjectItemPermissionsBuilder()
        .setOwners(owners)
        .setContributors(contributors)
        .setEditors(editors)
        .setAuthors(authors)
        .build();

    return {
        readAccess,
        applicationConfigs: requestConfigs,
        projectRoles,
    };
}

type RequestGuards = {
    updateGuard: boolean;
    permissionsGuard: boolean;
    accessGuard: boolean;
};

function getRequestsGuards(): RequestGuards {
    const snapshot = $editProjectSnapshot.get();

    if (!snapshot) {
        return { updateGuard: false, permissionsGuard: false, accessGuard: false };
    }

    const {
        defaultLanguage,
        accessMode,
        permissions,
        roles,
        applications,
        applicationConfigs,
        parentProjects,
        nameData: { name, description },
    } = $projectDialog.get();

    const currentPermKeys = permissions.map((p) => p.getKey().toString());
    const snapshotPermKeys = snapshot.permissions.map((p) => p.getKey().toString());
    const currentRoleKeys = Object.keys(roles);
    const snapshotRoleKeys = Object.keys(snapshot.roles);

    const appsDirty =
        serializeApplicationConfigs(applications, applicationConfigs, parentProjects) !== snapshot.applicationConfigs;
    const permissionsDirty =
        currentPermKeys.length !== snapshotPermKeys.length || currentPermKeys.some((k, i) => k !== snapshotPermKeys[i]);
    const rolesDirty =
        currentRoleKeys.length !== snapshotRoleKeys.length ||
        currentRoleKeys.some((k) => roles[k] !== snapshot.roles[k]);

    const updateGuard =
        name !== snapshot.name ||
        description !== snapshot.description ||
        defaultLanguage !== snapshot.defaultLanguage ||
        appsDirty;
    const accessGuard = accessMode !== snapshot.accessMode;
    // third condition clears viewers when switching away from 'custom' mode
    const permissionsGuard =
        rolesDirty ||
        permissionsDirty ||
        (accessMode !== 'custom' && snapshot.accessMode === 'custom' && permissions.length > 0);

    return { updateGuard, permissionsGuard, accessGuard };
}

/** Keys in selection order with their resolved config JSON, so one string compares apps, order and configs. */
function serializeApplicationConfigs(
    applications: Application[],
    ownConfigs: Record<string, PropertySet>,
    parentProjects: readonly Readonly<Project>[],
): string {
    return JSON.stringify(
        applications.map((app) => [keyOf(app), resolveApplicationConfig(app, ownConfigs, parentProjects).toJson()]),
    );
}

/** The config an app saves with: its own, else the first parent's carrying it, else the form defaults. */
function resolveApplicationConfig(
    application: Application,
    ownConfigs: Record<string, PropertySet>,
    parentProjects: readonly Readonly<Project>[],
): PropertySet {
    const key = keyOf(application);
    return ownConfigs[key] ?? findInheritedConfig(parentProjects, key) ?? createDefaultConfig(application);
}

/** The config of the first parent carrying the key, as the parent holds it; callers must not edit it. */
function findInheritedConfig(parentProjects: readonly Readonly<Project>[], key: string): PropertySet | undefined {
    for (const parent of parentProjects) {
        const siteConfig = parent.getSiteConfigs()?.find((c) => c.getApplicationKey().toString() === key);
        if (siteConfig?.getConfig()) return siteConfig.getConfig();
    }
    return undefined;
}

const keyOf = (application: Application): string => application.getApplicationKey().toString();

/** The app keys the given projects carry a site config for, deduped, in project order. */
function getInheritedAppKeys(projects: readonly Readonly<Project>[]): string[] {
    const keys = projects
        .flatMap((project) => project.getSiteConfigs() ?? [])
        .map((c) => c.getApplicationKey().toString());
    return [...new Set(keys)];
}

/** The installed applications for the given keys, in order; keys of uninstalled apps are skipped. */
function resolveApplications(keys: readonly string[]): Application[] {
    const installed = $applications.get().applications;
    return keys.map((key) => installed.find((app) => keyOf(app) === key)).filter(Boolean);
}

/** Clones the site configs of the given projects by app key; the first project to carry a key wins. */
function collectSiteConfigs(projects: readonly Readonly<Project>[]): Record<string, PropertySet> {
    const configs: Record<string, PropertySet> = {};

    for (const project of projects) {
        for (const siteConfig of project.getSiteConfigs() ?? []) {
            const key = siteConfig.getApplicationKey().toString();
            if (key in configs || !siteConfig.getConfig()) continue;
            configs[key] = PropertyTree.fromJson(siteConfig.getConfig().toJson()).getRoot();
        }
    }

    return configs;
}

function createDefaultConfig(application: Application): PropertySet {
    const root = new PropertyTree().getRoot();
    const form = application.getForm();
    if (form) seedFormDefaults(form, root);
    return root;
}

function refreshAndSelectProject(projectId: string) {
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
