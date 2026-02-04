import {deepMap} from 'nanostores';
import {Project} from '../../../../app/settings/data/project/Project';
import {ProjectConfigContext} from '../../../../app/settings/data/project/ProjectConfigContext';
import {loadLanguages} from '../languages.store';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {ProjectAccess} from '../../../../app/settings/access/ProjectAccess';
import {Application} from '@enonic/lib-admin-ui/application/Application';

//
// * Store State
//

type NewProjectDialogStore = {
    // config
    open: boolean;
    isMultiInheritance: boolean;
    selectedProjects: Project[];
    step: string;

    // data
    parentProjects?: Readonly<Project>[];
    defaultLanguage?: string;
    accessMode: string;
    permissions: Principal[];
    roles?: Map<string, ProjectAccess>; // Principal key as string, ProjectAccess as value
    applications?: Application[];
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

//
// * Initialization
//

void loadLanguages();
