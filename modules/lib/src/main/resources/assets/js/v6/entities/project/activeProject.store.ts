import { atom, computed } from 'nanostores';
import { type Project } from '../../../app/settings/data/project/Project';

type ProjectChangedHandler = (project: Project) => void;

//
// * Primary source of truth for the currently active project.
// * Decoupled from the projects list: anyone may read getActiveProject()
// * without pulling in projects.store's heavy dependency graph.
// * The list authority (projects.store) is the canonical writer, but
// * setActiveProject is intentionally exposed so other writers can exist.
//
export const $activeProject = atom<Readonly<Project> | undefined>(undefined);

export const $activeProjectName = computed($activeProject, (activeProject) => {
    if (!activeProject) return '';

    const projectDisplayName = activeProject.getDisplayName();
    const projectLanguage = activeProject.getLanguage();

    if (!projectLanguage) return projectDisplayName;

    return `${projectDisplayName} (${projectLanguage})`;
});

const projectChangedHandlers: ProjectChangedHandler[] = [];

export function setActiveProject(project: Readonly<Project> | undefined): void {
    const previousProject = $activeProject.get();

    $activeProject.set(project);

    // ? Reloading the projects list replaces the active Project instance without switching
    // ? the project. Handlers react to a switch (reset the filter, reload issues), so the
    // ? name is compared instead of the instance.
    if (project && project.getName() !== previousProject?.getName()) {
        notifyProjectChanged(project as Project);
    }
}

export function getActiveProject(): Project {
    return $activeProject.get() as Project;
}

export function getActiveProjectName(): string {
    return getActiveProject().getName();
}

export function isProjectInitialized(): boolean {
    return $activeProject.get() != null;
}

export function whenProjectInitialized(callback: () => void): () => void {
    if (isProjectInitialized()) {
        callback();
        return () => undefined;
    }

    let unsubscribe = () => undefined;
    unsubscribe = onActiveProjectChanged(() => {
        callback();
        unsubscribe();
    });

    return unsubscribe;
}

export function onActiveProjectChanged(handler: ProjectChangedHandler): () => void {
    projectChangedHandlers.push(handler);

    return () => {
        unActiveProjectChanged(handler);
    };
}

export function unActiveProjectChanged(handler: ProjectChangedHandler): void {
    const index = projectChangedHandlers.indexOf(handler);

    if (index > -1) {
        projectChangedHandlers.splice(index, 1);
    }
}

function notifyProjectChanged(project: Project): void {
    projectChangedHandlers.slice().forEach((handler: ProjectChangedHandler) => {
        handler(project);
    });
}
