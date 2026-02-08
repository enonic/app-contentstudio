import {deepMap} from 'nanostores';
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
    isMultiInheritance: boolean;
    selectedProjects: Project[];
    step: string;

    // data
    parentProjects: Readonly<Project>[];
    defaultLanguage: string;
    accessMode: string;
    permissions: Principal[];
    roles: Map<string, ProjectAccess>; // Principal key as string, ProjectAccess as value
    applications: Application[];
    nameData: NewProjectNameData;
};

const initialState: NewProjectDialogStore = {
    // config
    open: false,
    isMultiInheritance: false,
    selectedProjects: [],
    step: 'step-parent',

    // data
    parentProjects: [],
    defaultLanguage: '',
    accessMode: '',
    permissions: [],
    roles: new Map(),
    applications: [],
    nameData: {
        name: '',
        identifier: '',
        description: '',
        hasError: false,
    },
};

export const $newProjectDialog = deepMap<NewProjectDialogStore>(structuredClone(initialState));

//
// * Public API
//

export const openNewProjectDialog = (selectedProjects: Project[]): void => {
    const isMultiInheritance = Boolean(ProjectConfigContext.get().getProjectConfig()?.isMultiInheritance());

    $newProjectDialog.set({
        ...structuredClone(initialState),
        open: true,
        selectedProjects: selectedProjects,
        isMultiInheritance: isMultiInheritance,
    });
};

export const closeNewProjectDialog = (): void => {
    $newProjectDialog.set(structuredClone(initialState));
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

export const setNewProjectDialogRoles = (roles: Map<string, ProjectAccess>): void => {
    $newProjectDialog.setKey('roles', roles);
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
    const {
        parentProjects: parents,
        nameData: {name, identifier, description},
        defaultLanguage,
        accessMode,
        permissions,
        roles,
        applications,
    } = $newProjectDialog.get();

    // Data
    const parentProjects = parents as Project[];

    const readAccess = new ProjectReadAccess(
        accessMode as ProjectReadAccessType,
        permissions.map((p: Principal) => p.getKey())
    );

    const applicationConfigs = applications.map((app: Application) =>
        ApplicationConfig.create().setApplicationKey(app.getApplicationKey()).setConfig(new PropertySet()).build()
    );

    const rolesEntriesArray = Array.from(roles.entries());

    const owners = rolesEntriesArray.filter(([_, value]) => value === ProjectAccess.OWNER).map(([key, _]) => PrincipalKey.fromString(key));

    const contributors = rolesEntriesArray
        .filter(([_, value]) => value === ProjectAccess.CONTRIBUTOR)
        .map(([key, _]) => PrincipalKey.fromString(key));

    const editors = rolesEntriesArray
        .filter(([_, value]) => value === ProjectAccess.EDITOR)
        .map(([key, _]) => PrincipalKey.fromString(key));

    const authors = rolesEntriesArray
        .filter(([_, value]) => value === ProjectAccess.AUTHOR)
        .map(([key, _]) => PrincipalKey.fromString(key));

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
    ).andThen((project) => {
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
    });
};

//
// * Initialization
//

void loadLanguages();
