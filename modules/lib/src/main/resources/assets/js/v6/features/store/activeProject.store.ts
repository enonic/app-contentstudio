import {atom} from 'nanostores';
import {type Project} from '../../../app/settings/data/project/Project';

type ProjectChangedHandler = (project: Project) => void;

export const $currentProject = atom<Readonly<Project> | undefined>(undefined);

const projectChangedHandlers: ProjectChangedHandler[] = [];

export function setCurrentProject(project: Readonly<Project> | undefined): void {
    const previousProject = $currentProject.get();

    $currentProject.set(project);

    if (project && project !== previousProject) {
        notifyProjectChanged(project as Project);
    }
}

export function getActiveProject(): Project {
    return $currentProject.get() as Project;
}

export function getActiveProjectName(): string {
    return getActiveProject().getName();
}

export function isProjectInitialized(): boolean {
    return !!$currentProject.get();
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
