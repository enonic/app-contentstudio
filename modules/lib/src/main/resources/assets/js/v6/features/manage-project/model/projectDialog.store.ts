import { atom, computed, map } from 'nanostores';
import { okAsync, ResultAsync } from 'neverthrow';
import { notifyError, notifySuccess } from '../../../shared/notifications';
import { i18n } from '../../../shared/i18n';
import { type Project } from '../../../../app/settings/data/project/Project';
import { ProjectConfigContext } from '../../../../app/settings/data/project/ProjectConfigContext';
import { ProjectAccess } from '../../../../app/settings/access/ProjectAccess';
import { ProjectReadAccess } from '../../../../app/settings/data/project/ProjectReadAccess';
import { type ProjectReadAccessType } from '../../../../app/settings/data/project/ProjectReadAccessType';
import { ProjectItemPermissionsBuilder } from '../../../../app/settings/data/project/ProjectPermissions';
import { type Principal } from '@enonic/ui-types';
import { parsePrincipalKey } from '@enonic/ui-utils';
import { PropertySet, PropertyTree } from '@enonic/input-types/data';
import { seedFormDefaults } from '@enonic/input-types';
import { fromLegacyPrincipalKey, toLegacyPrincipalKey } from '../../../shared/lib/cms/security/legacy';
import { $applications, loadApplications } from '../../../entities/application';
import { type Application } from '../../../entities/application';
import {
    type ApplicationConfig,
    fromLegacyApplicationConfig,
} from '../../../shared/lib/cms/application/applicationConfig';
import { APPLICATION_KEY } from '../../../shared/lib/cms/application/applicationKey';
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
    view: 'main' | 'dirty-confirmation' | 'access-confirmation' | 'progress' | 'config' | 'config-discard';
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
     * without one resolves to the form defaults; a parent's config is never copied.
     */
    applicationConfigs: Record<string, PropertySet>;
    /** The edited project's site configs step 2 does not list, the portal's; sent back as it is. */
    preservedSiteConfigs: ApplicationConfig[];
    /** The app whose config the `config` view edits, on a clone the store gets back on apply. */
    editingConfig?: EditingConfig;
    /** Whether the edited config differs from its state on open; reported by the view. */
    configDirty: boolean;
    nameData: ProjectNameData;
};

type EditingConfig = {
    application: Application;
    configSet: PropertySet;
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

type SerializedApplicationConfigs = {
    applications: Application[];
    ownConfigs: Record<string, PropertySet>;
    result: string;
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
    preservedSiteConfigs: [],
    configDirty: false,
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

// The last serialization, by its inputs; the dirty check runs on every store change, the inputs rarely.
let serializedApplicationConfigs: SerializedApplicationConfigs | undefined;

/** The apps seeded from the parents on create, serialized like the edit snapshot's. */
const $initialApplicationConfigs = atom<string>(serializeApplicationConfigs([], {}));
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

// The last derived set, by the parents it came from; the same instance keeps the step from re-rendering.
let inheritedAppKeysMemo: { parentProjects: readonly Readonly<Project>[]; keys: ReadonlySet<string> } | undefined;

/** The keys of the apps inherited from the first parent project. */
export const $projectDialogInheritedAppKeys = computed($projectDialog, ({ parentProjects }): ReadonlySet<string> => {
    if (inheritedAppKeysMemo?.parentProjects !== parentProjects) {
        inheritedAppKeysMemo = { parentProjects, keys: new Set(getInheritedAppKeys(parentProjects)) };
    }
    return inheritedAppKeysMemo.keys;
});

export const $isProjectDialogDirty = computed(
    [$projectDialog, $editProjectSnapshot, $initialParentNames, $initialApplicationConfigs],
    (state, snapshot, initialParents, initialApplicationConfigs): boolean => {
        if (state.mode === 'edit' && snapshot) {
            const currentPermissionKeys = state.permissions.map((p) => p.key);
            const snapshotPermissionKeys = snapshot.permissions.map((p) => p.key);
            const permissionsDirty =
                currentPermissionKeys.length !== snapshotPermissionKeys.length ||
                currentPermissionKeys.some((k, i) => k !== snapshotPermissionKeys[i]);

            const currentRoleKeys = Object.keys(state.roles);
            const snapshotRoleKeys = Object.keys(snapshot.roles);
            const rolesDirty =
                currentRoleKeys.length !== snapshotRoleKeys.length ||
                currentRoleKeys.some((k) => state.roles[k] !== snapshot.roles[k]);

            const appsDirty =
                serializeApplicationConfigs(state.applications, state.applicationConfigs) !==
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
            serializeApplicationConfigs(state.applications, state.applicationConfigs) !== initialApplicationConfigs ||
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
    $initialApplicationConfigs.set(serializeApplicationConfigs(selectedApplications, {}));
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

    const accessPrincipalKeys = project.getReadAccess().getPrincipalsKeys().map(fromLegacyPrincipalKey);

    await loadPrincipalsByKeys([...rolePrincipalKeys, ...accessPrincipalKeys]);

    const principals = $principals.get().principals;
    const rolePrincipals = principals.filter((p) => rolePrincipalKeys.includes(p.key));
    const permissionPrincipals = principals.filter((p) => accessPrincipalKeys.includes(p.key));

    await loadApplications();

    // The project's own apps first, then the inherited ones it has no config for; the portal is no app.
    const siteConfigs = getSiteConfigs(project);
    const ownKeys = siteConfigs.filter((config) => !isPortalConfig(config)).map((config) => config.applicationKey);
    const inheritedKeys = getInheritedAppKeys(parentProjects).filter((key) => !ownKeys.includes(key));
    const projectApplications = resolveApplications([...ownKeys, ...inheritedKeys]);

    const applicationConfigs = collectSiteConfigs(siteConfigs);
    const listedKeys = new Set(projectApplications.map((app) => app.key));
    const preservedSiteConfigs = siteConfigs.filter((config) => !listedKeys.has(config.applicationKey));

    const snapshot: EditProjectSnapshot = {
        name: project.getDisplayName() || '',
        description: project.getDescription() || '',
        defaultLanguage: project.getLanguage() || '',
        accessMode: project.getReadAccess().getType() || '',
        roles,
        permissions: permissionPrincipals,
        applications: projectApplications,
        applicationConfigs: serializeApplicationConfigs(projectApplications, applicationConfigs),
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
        preservedSiteConfigs,
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
    $initialApplicationConfigs.set(serializeApplicationConfigs([], {}));
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

/**
 * Sets the parents; drops the apps no longer inherited and appends the newly inherited ones.
 * The same names again are a no-op: the step syncs on every mount of the main view, and the
 * memos and the step's rendering hang on the identity of the arrays this replaces.
 */
export const setProjectDialogParentProjects = (parentProjects: Readonly<Project>[]): void => {
    const state = $projectDialog.get();
    if (haveSameNames(state.parentProjects, parentProjects)) return;

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

/**
 * Applies a selection: new keys are appended in order. Inherited apps stay even when left out,
 * and so do unavailable ones, which the selector cannot list; the X removes those.
 */
export const selectProjectDialogApplications = (keys: readonly string[]): void => {
    const { applications, parentProjects } = $projectDialog.get();
    const inherited = new Set(getInheritedAppKeys(parentProjects));
    const selected = new Set(keys);
    const listed = new Set(applications.map(keyOf));

    const kept = applications.filter(
        (app) => selected.has(keyOf(app)) || inherited.has(keyOf(app)) || isUnavailable(app),
    );
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

/**
 * Re-resolves the listed apps against the installed ones, so a stopped or uninstalled app reads
 * as unavailable and an installed one gets its form back. Keys, order and own configs stay.
 */
export const refreshProjectDialogApplications = (): void => {
    const { open, applications } = $projectDialog.get();
    if (!open || applications.length === 0) return;

    $projectDialog.setKey('applications', resolveApplications(applications.map(keyOf)));
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
    const { applications, applicationConfigs } = $projectDialog.get();
    const application = applications.find((app) => keyOf(app) === applicationKey);
    return application && resolveApplicationConfig(application, applicationConfigs);
};

/**
 * Opens the `config` view on a clone of the app's resolved config; the store gets it back on apply.
 * A no-op while creating: configs are editable once the project exists, and the step says so.
 */
export const openProjectDialogApplicationConfig = (applicationKey: string): void => {
    const { mode, applications, applicationConfigs } = $projectDialog.get();
    if (mode === 'create') return;

    const application = applications.find((app) => keyOf(app) === applicationKey);
    if (!application) return;

    const config = resolveApplicationConfig(application, applicationConfigs);
    const configSet = PropertyTree.fromJson(config.toJson()).getRoot();

    $projectDialog.setKey('editingConfig', { application, configSet });
    $projectDialog.setKey('configDirty', false);
    $projectDialog.setKey('view', 'config');
};

export const setProjectDialogConfigDirty = (dirty: boolean): void => {
    $projectDialog.setKey('configDirty', dirty);
};

export const applyProjectDialogApplicationConfig = (): void => {
    const { editingConfig } = $projectDialog.get();
    if (!editingConfig) return;

    setProjectDialogApplicationConfig(keyOf(editingConfig.application), editingConfig.configSet);
    closeConfigView();
};

/** Leaves the `config` view, asking first when the config has changes. */
export const closeProjectDialogApplicationConfig = (): void => {
    if ($projectDialog.get().configDirty) {
        $projectDialog.setKey('view', 'config-discard');
    } else {
        closeConfigView();
    }
};

export const discardProjectDialogApplicationConfig = (): void => {
    closeConfigView();
};

function closeConfigView(): void {
    $projectDialog.setKey('editingConfig', undefined);
    $projectDialog.setKey('configDirty', false);
    $projectDialog.setKey('view', 'main');
}

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
                permissions.map((p) => p.key),
            ).map(() => project),
        )
        .map((project) => {
            $projectDialog.setKey('submitting', false);
            closeProjectDialog();
            new ProjectCreatedEvent(project.getName()).fire();
            notifySuccess(i18n('notify.settings.project.created', project.getDisplayName()));
        })
        .mapErr((error) => {
            $projectDialog.setKey('submitting', false);
            notifyError(i18n('notify.settings.project.createFailed'));
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
        notifySuccess(i18n('notify.settings.project.modified', name));
        refreshAndSelectProject(identifier);
    };

    const handleUpdateError = (message?: string): void => {
        $projectDialog.setKey('submitting', false);
        $projectDialog.setKey('readAccessProgress', null);
        $projectDialog.setKey('view', 'main');
        notifyError(i18n('notify.settings.project.modifyFailed'));
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
                        accessMode === 'custom' ? permissions.map((p) => p.key) : [],
                    ),
                );
            }

            if (accessGuard) {
                $projectDialog.setKey('view', 'progress');
                const readAccessResult = updateProjectReadAccess(identifier, readAccess);
                return ResultAsync.combine([...requests, readAccessResult]).map(
                    (results) => results[results.length - 1] as string,
                );
            }

            if (requests.length === 0) {
                return okAsync(null as string | null);
            }

            return ResultAsync.combine(requests).map(() => null as string | null);
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
    const { accessMode, permissions, roles, applications, applicationConfigs, preservedSiteConfigs } =
        $projectDialog.get();

    const readAccess = new ProjectReadAccess(
        accessMode as ProjectReadAccessType,
        permissions.map((p) => toLegacyPrincipalKey(p.key)),
    );

    const listedConfigs = applications.map((app): ApplicationConfig => ({
        applicationKey: app.key,
        config: resolveApplicationConfig(app, applicationConfigs),
    }));
    // The preserved entries go around the listed apps: portal first, the rest last.
    const requestConfigs = [
        ...preservedSiteConfigs.filter(isPortalConfig),
        ...listedConfigs,
        ...preservedSiteConfigs.filter((config) => !isPortalConfig(config)),
    ];

    const rolesEntries = Object.entries(roles);

    const owners = rolesEntries
        .filter(([_, value]) => value === ProjectAccess.OWNER)
        .map(([key]) => toLegacyPrincipalKey(parsePrincipalKey(key)));
    const contributors = rolesEntries
        .filter(([_, value]) => value === ProjectAccess.CONTRIBUTOR)
        .map(([key]) => toLegacyPrincipalKey(parsePrincipalKey(key)));
    const editors = rolesEntries
        .filter(([_, value]) => value === ProjectAccess.EDITOR)
        .map(([key]) => toLegacyPrincipalKey(parsePrincipalKey(key)));
    const authors = rolesEntries
        .filter(([_, value]) => value === ProjectAccess.AUTHOR)
        .map(([key]) => toLegacyPrincipalKey(parsePrincipalKey(key)));

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
        nameData: { name, description },
    } = $projectDialog.get();

    const currentPermKeys = permissions.map((p) => p.key);
    const snapshotPermKeys = snapshot.permissions.map((p) => p.key);
    const currentRoleKeys = Object.keys(roles);
    const snapshotRoleKeys = Object.keys(snapshot.roles);

    const appsDirty = serializeApplicationConfigs(applications, applicationConfigs) !== snapshot.applicationConfigs;
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

/**
 * Keys in selection order with their resolved config JSON, so one string compares apps, order and configs.
 * Cached on the identity of the inputs, which the commands replace rather than mutate.
 */
function serializeApplicationConfigs(applications: Application[], ownConfigs: Record<string, PropertySet>): string {
    const last = serializedApplicationConfigs;
    if (last && last.applications === applications && last.ownConfigs === ownConfigs) {
        return last.result;
    }

    const result = JSON.stringify(
        applications.map((app) => [keyOf(app), resolveApplicationConfig(app, ownConfigs).toJson()]),
    );
    serializedApplicationConfigs = { applications, ownConfigs, result };
    return result;
}

/** The config an app saves with: its own, else the form defaults. A parent's config is never copied. */
function resolveApplicationConfig(application: Application, ownConfigs: Record<string, PropertySet>): PropertySet {
    return ownConfigs[application.key] ?? createDefaultConfig(application);
}

const keyOf = (application: Application): string => application.key;

const isPortalConfig = (config: ApplicationConfig): boolean => config.applicationKey === APPLICATION_KEY.PORTAL;

const getSiteConfigs = (project: Readonly<Project>): ApplicationConfig[] =>
    (project.getSiteConfigs() ?? []).map(fromLegacyApplicationConfig);

const haveSameNames = (a: readonly Readonly<Project>[], b: readonly Readonly<Project>[]): boolean =>
    a.length === b.length && a.every((project, i) => project.getName() === b[i].getName());

/** The app keys the first parent carries a site config for, the portal left out; the other parents do not inherit. */
function getInheritedAppKeys(parentProjects: readonly Readonly<Project>[]): string[] {
    const parent = parentProjects[0];
    if (!parent) return [];
    return getSiteConfigs(parent)
        .filter((config) => !isPortalConfig(config))
        .map((config) => config.applicationKey);
}

/**
 * The applications for the given keys, in order: the installed one, else a placeholder the step
 * shows as unavailable, so a stopped or uninstalled app stays visible and removable, as in legacy.
 */
function resolveApplications(keys: readonly string[]): Application[] {
    const installed = $applications.get().applications;
    return keys.map((key) => installed.find((app) => app.key === key) ?? createUnavailableApplication(key));
}

/** A stand-in for an app this node does not run: the key as name, no form, no state. */
const createUnavailableApplication = (key: string): Application => ({ key, displayName: key });

/** Whether the app is a stand-in, see `createUnavailableApplication`. */
const isUnavailable = (application: Application): boolean => application.state == null;

/** Clones the site configs by app key. */
function collectSiteConfigs(siteConfigs: readonly ApplicationConfig[]): Record<string, PropertySet> {
    const configs: Record<string, PropertySet> = {};

    for (const { applicationKey, config } of siteConfigs) {
        if (!config) continue;
        configs[applicationKey] = PropertyTree.fromJson(config.toJson()).getRoot();
    }

    return configs;
}

function createDefaultConfig(application: Application): PropertySet {
    const root = new PropertyTree().getRoot();
    const form = application.form;
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
