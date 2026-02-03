import {deepMap} from 'nanostores';
import {Project} from '../../../../app/settings/data/project/Project';
import {ProjectConfigContext} from '../../../../app/settings/data/project/ProjectConfigContext';
import {loadLanguages} from '../languages.store';

//
// * Store State
//

type NewProjectDialogStore = {
    // config
    open: boolean;
    isMultiInheritance: boolean;
    selectedProjects: Project[];

    // data
    parentProjects?: Readonly<Project>[];
    defaultLanguage?: string;
};

const initialState: NewProjectDialogStore = {
    // config
    open: false,
    isMultiInheritance: false,
    selectedProjects: [],

    // data
    parentProjects: [],
    defaultLanguage: '',
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

export const setNewProjectDialogParentProjects = (parentProjects: Readonly<Project>[]): void => {
    $newProjectDialog.setKey('parentProjects', parentProjects);
};

export const setNewProjectDialogDefaultLanguage = (defaultLanguage: string): void => {
    $newProjectDialog.setKey('defaultLanguage', defaultLanguage);
};

//
// * Initialization
//

void loadLanguages();
