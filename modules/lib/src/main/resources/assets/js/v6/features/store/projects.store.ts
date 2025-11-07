import {computed, map} from 'nanostores';
import {Project} from '../../../app/settings/data/project/Project';
import {ProjectListRequest} from '../../../app/settings/resource/ProjectListRequest';
import {ProjectUpdatedEvent} from '../../../app/settings/event/ProjectUpdatedEvent';
import {ProjectCreatedEvent} from '../../../app/settings/event/ProjectCreatedEvent';
import {ProjectDeletedEvent} from '../../../app/settings/event/ProjectDeletedEvent';
import {syncMapStore} from '../utils/stores';
import {$config} from './config.store';

type ProjectsStore = {
    projects: Readonly<Project>[];
    activeProjectId: string | undefined;
};

export const $projects = map<ProjectsStore>({
    projects: [],
    activeProjectId: undefined,
});

syncMapStore($projects, 'activeProjectId', {
    keys: ['activeProjectId'],
    loadInitial: true,
    syncTabs: true,
});

export const $activeProject = computed($projects, (store) => {
    return store.projects.find((p) => getProjectId(p) === store.activeProjectId);
});

export const $activeProjectName = computed($activeProject, (activeProject) => {
    if (!activeProject) return '';

    const projectDisplayName = activeProject.getDisplayName();
    const projectLanguage = activeProject.getLanguage();

    if (!projectLanguage) return projectDisplayName;

    return `${projectDisplayName} (${projectLanguage})`;
});

export const $isInitialized = computed($projects, (store) => {
    return store.activeProjectId === undefined || store.projects.length > 0;
});

export function setActiveProject(project: Readonly<Project> | undefined): void {
    const existsInStore = $projects.get().projects.some((p) => getProjectId(p) === getProjectId(project));
    if (!existsInStore) return;
    $projects.setKey('activeProjectId', getProjectId(project));
}

//
// * Utilities
//
export function getProjectId(project: Readonly<Project> | undefined): string | undefined {
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
    if ($activeProject.get()) {
        return;
    }

    const {projects} = $projects.get();

    if (projects.length === 1) {
        setActiveProject(projects[0]);
        return;
    }

    const projectFromUrl = projects.find((p) => getProjectId(p) === getProjectIdFromUrl());
    if (projectFromUrl) {
        setActiveProject(projectFromUrl);
    }
}

function getProjectIdFromUrl(): string | undefined {
    const viewPath = window.location.href.split($config.get().appId)[1];
    const normalizedPath = viewPath?.replace(/\/[^\/]+/, '') || '/';
    return normalizedPath.split('/')[1];
}

//
// * Initialization
//
const projectIdFromUrl = getProjectIdFromUrl();
if (projectIdFromUrl) {
    $projects.setKey('activeProjectId', projectIdFromUrl);
}

void loadProjects();

ProjectUpdatedEvent.on(() => {
    loadProjects();
});

ProjectCreatedEvent.on(() => {
    loadProjects();
});

ProjectDeletedEvent.on((event: ProjectDeletedEvent) => {
    const {projects} = $projects.get();
    const updatedProjects = projects.filter((p) => getProjectId(p) !== event.getProjectName());
    $projects.setKey('projects', updatedProjects);
    updateActiveProject();
});
