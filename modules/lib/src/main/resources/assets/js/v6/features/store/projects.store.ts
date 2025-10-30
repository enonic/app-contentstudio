import {computed, map} from 'nanostores';
import {Project} from '../../../app/settings/data/project/Project';
import {ProjectListRequest} from '../../../app/settings/resource/ProjectListRequest';
import {ProjectUpdatedEvent} from '../../../app/settings/event/ProjectUpdatedEvent';
import {ProjectCreatedEvent} from '../../../app/settings/event/ProjectCreatedEvent';
import {ProjectDeletedEvent} from '../../../app/settings/event/ProjectDeletedEvent';

type ProjectsStore = {
    projects: Readonly<Project>[];
    activeProjectId: string | undefined;
};

export const $projects = map<ProjectsStore>({
    projects: [],
    activeProjectId: undefined,
});

export function setActiveProject(project: Readonly<Project> | undefined): void {
    const isProjectInStore = $projects.get().projects.some((p) => getProjectKey(p) === getProjectKey(project));
    if (!isProjectInStore) throw new Error('Project not found in store');
    $projects.setKey('activeProjectId', getProjectKey(project));
}

export const $activeProject = computed($projects, (store) => {
    return store.projects.find((p) => getProjectKey(p) === store.activeProjectId);
});

export const $activeProjectName = computed($activeProject, (activeProject) => {
    if (!activeProject) return '';

    return `${activeProject.getDisplayName()} (${activeProject.getLanguage()})`;
});

export const $isInitialized = computed($projects, (store) => {
    return store.activeProjectId === undefined || store.projects.length > 0;
});

//
// * Utilities
//
export function getProjectKey(project: Readonly<Project> | undefined): string | undefined {
    return project?.getName();
}

//
// * Internal
//
let isLoading = false;
let needsReload = false;
async function loadProjects(): Promise<void> {
    if (isLoading) {
        needsReload = true;
        return;
    }

    isLoading = true;

    try {
        const request = new ProjectListRequest(true);
        const projects = await request.sendAndParse();

        $projects.setKey('projects', projects);
        updateActiveProject();
    } catch (error) {
        console.error(error);
    } finally {
        isLoading = false;
    }

    if (needsReload) {
        needsReload = false;
        await loadProjects();
    }
}

function updateActiveProject(): void {
    if ($activeProject.get()) return;

    const {projects} = $projects.get();

    if (projects.length === 1) {
        setActiveProject(projects[0]);
        return;
    }
}

//
// * Initialization
//

void loadProjects();

ProjectUpdatedEvent.on(() => {
    loadProjects();
});
ProjectCreatedEvent.on(() => {
    loadProjects();
});
ProjectDeletedEvent.on((event: ProjectDeletedEvent) => {
    const {projects} = $projects.get();
    const updatedProjects = projects.filter((p) => getProjectKey(p) !== event.getProjectName());
    $projects.setKey('projects', updatedProjects);
    updateActiveProject();
});
