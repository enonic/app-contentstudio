import {computed, map} from 'nanostores';
import {ResultAsync} from 'neverthrow';
import {Project} from '../../../../app/settings/data/project/Project';
import {ProjectConfigContext} from '../../../../app/settings/data/project/ProjectConfigContext';
import {loadLanguages} from '../languages.store';
import {ProjectAccess} from '../../../../app/settings/access/ProjectAccess';
import {ProjectCreateRequest} from '../../../../app/settings/resource/ProjectCreateRequest';
import {ProjectReadAccess} from '../../../../app/settings/data/project/ProjectReadAccess';
import {ProjectReadAccessType} from '../../../../app/settings/data/project/ProjectReadAccessType';
import {UpdateProjectLanguageRequest} from '../../../../app/settings/resource/UpdateProjectLanguageRequest';
import {UpdateProjectPermissionsRequest} from '../../../../app/settings/resource/UpdateProjectPermissionsRequest';
import {ProjectItemPermissionsBuilder, ProjectPermissions} from '../../../../app/settings/data/project/ProjectPermissions';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {Application} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';

//
// * Store State
//

type NewProjectNameData = {
    name: string;
    identifier: string;
    description: string;
    hasError: boolean;
};

type NewProjectDialogStore = {
    // config
    open: boolean;
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
    nameData: NewProjectNameData;
};

const initialState: NewProjectDialogStore = {
    // config
    open: false,
    view: 'main',
    isMultiInheritance: false,
    step: 'step-parent',
    submitting: false,

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

export const $newProjectDialog = map<NewProjectDialogStore>(structuredClone(initialState));

export const $isNewProjectDialogDirty = computed($newProjectDialog, (state): boolean => {
    return (
        state.parentProjects.length > 0 ||
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

export const openNewProjectDialog = (selectedProjects: Project[]): void => {
    const isMultiInheritance = Boolean(ProjectConfigContext.get().getProjectConfig()?.isMultiInheritance());

    $newProjectDialog.set({
        ...structuredClone(initialState),
        open: true,
        parentProjects: selectedProjects,
        isMultiInheritance: isMultiInheritance,
    });
};

export const closeNewProjectDialog = (): void => {
    $newProjectDialog.set(structuredClone(initialState));
};

export const setNewProjectDialogView = (view: 'main' | 'confirmation'): void => {
    $newProjectDialog.setKey('view', view);
};

export const setNewProjectDialogStep = (step: string): void => {
    $newProjectDialog.setKey('step', step);
};

export const setNewProjectDialogParentProjects = (parentProjects: Readonly<Project>[]): void => {
    $newProjectDialog.setKey('parentProjects', parentProjects);
};

export const setNewProjectDialogDefaultLanguage = (defaultLanguage: string): void => {
    $newProjectDialog.setKey('defaultLanguage', defaultLanguage);
};

export const setNewProjectDialogAccessMode = (accessMode: string): void => {
    $newProjectDialog.setKey('accessMode', accessMode);
};

export const setNewProjectDialogPermissions = (permissions: Principal[]): void => {
    $newProjectDialog.setKey('permissions', permissions);
};

export const setNewProjectDialogRoles = (roles: Record<string, ProjectAccess>): void => {
    $newProjectDialog.setKey('roles', roles);
};

export const setNewProjectDialogRolePrincipals = (rolePrincipals: Principal[]): void => {
    $newProjectDialog.setKey('rolePrincipals', rolePrincipals);
};

export const setNewProjectDialogApplications = (applications: Application[]): void => {
    $newProjectDialog.setKey('applications', applications);
};

export const setNewProjectDialogName = (data: NewProjectNameData): void => {
    $newProjectDialog.setKey('nameData', data);
};

export const createProject = (): ResultAsync<
    {
        project: Project;
        languageId: string;
        permissions: ProjectPermissions;
    },
    Error
> => {
    $newProjectDialog.setKey('submitting', true);

    const {
        parentProjects,
        nameData: {name, identifier, description},
        defaultLanguage,
        accessMode,
        permissions,
        roles,
        applications,
    } = $newProjectDialog.get();

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

    // Project creation
    return ResultAsync.fromPromise(projectCreateRequest.sendAndParse(), (error) =>
        error instanceof Error ? error : new Error(String(error))
    )
        .andThen((project) => {
            const updateLanguageResult = ResultAsync.fromPromise(updateProjectLanguageRequest.sendAndParse(), (error) =>
                error instanceof Error ? error : new Error(String(error))
            );

            const updatePermissionsResult = ResultAsync.fromPromise(updateProjectPermissionsRequest.sendAndParse(), (error) =>
                error instanceof Error ? error : new Error(String(error))
            );

            return ResultAsync.combine([updateLanguageResult, updatePermissionsResult]).map(([languageId, permissions]) => ({
                project,
                languageId,
                permissions,
            }));
        })
        .map((result) => {
            $newProjectDialog.setKey('submitting', false);
            return result;
        })
        .mapErr((error) => {
            $newProjectDialog.setKey('submitting', false);
            return error;
        });
};

//
// * Initialization
//

void loadLanguages();
