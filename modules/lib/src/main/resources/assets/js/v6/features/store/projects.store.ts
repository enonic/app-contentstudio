import {atom, computed, map} from 'nanostores';
import {type Project} from '../../../app/settings/data/project/Project';
import {ProjectListRequest} from '../../../app/settings/resource/ProjectListRequest';
import {ProjectUpdatedEvent} from '../../../app/settings/event/ProjectUpdatedEvent';
import {ProjectCreatedEvent} from '../../../app/settings/event/ProjectCreatedEvent';
import {ProjectDeletedEvent} from '../../../app/settings/event/ProjectDeletedEvent';
import {syncMapStore} from '../utils/storage/sync';
import {$config} from './config.store';
import {setProjectSelectionDialogOpen} from './dialogs.store';
import {ProjectContext} from '../../../app/project/ProjectContext';
import {resetTree} from './tree-list.store';
import {clearSelection, setActive} from './contentTreeSelection.store';
import {setContentFilterOpen, resetContentFilter} from './contentFilter.store';
import {deactivateFilter} from '../api/content-fetcher';
import {clearVersionsCache} from '../utils/widget/versions/versionsCache';
import {resolveActiveProjectId, resolveActiveProjectIdAfterDeletion} from '../utils/cms/projects/projectSelection';

/*
TODO: Enonic UI - Feature
- Store projects as JSON objects in the sync store.
- Load projects from the sync store on startup if other tabs are active.

? Reasoning:
- Projects are updated via server events over WebSocket.
- Once loaded, they will stay up to date.
- Loading existing projects from the store is faster and more efficient.
*/


const SYNC_NAME = 'projects';
type ProjectsStore = {
    projects: Readonly<Project>[];
    activeProjectId: string | undefined;
};

export const $projects = map<ProjectsStore>({
    projects: [],
    activeProjectId: undefined,
});

syncMapStore($projects, SYNC_NAME, {
    keys: ['activeProjectId'],
    loadInitial: true,
    syncTabs: true,
});

export const $activeProject = computed($projects, (store) => {
    const activeProject = store.projects.find((p) => getProjectId(p) === store.activeProjectId);

    return isAvailableProject(activeProject) ? activeProject : undefined;
});

export const $activeProjectName = computed($activeProject, (activeProject) => {
    if (!activeProject) return '';

    const projectDisplayName = activeProject.getDisplayName();
    const projectLanguage = activeProject.getLanguage();

    if (!projectLanguage) return projectDisplayName;

    return `${projectDisplayName} (${projectLanguage})`;
});

export function setActiveProject(project: Readonly<Project> | undefined): void {
    const existsInStore = $projects.get().projects.some((p) => getProjectId(p) === getProjectId(project));
    if (!existsInStore) return;
    $projects.setKey('activeProjectId', getProjectId(project));
}

export function isActiveProject(projectName: string | undefined): boolean {
    return $projects.get().activeProjectId === projectName;
}

//
// * Utilities
//
function getProjectId(project: Readonly<Project> | undefined): string | undefined {
    return project?.getName();
}

function isAvailableProject(project: Readonly<Project> | undefined): boolean {
    return !!project?.getDisplayName();
}

function getProjectIdFromUrl(): string | undefined {
    const viewPath = window.location.href.split($config.get().appId)[1];
    const normalizedPath = viewPath?.replace(/\/[^\/]+/, '') || '/';
    return normalizedPath.split('/')[1];
}

function clearActiveProject(): void {
    $projects.setKey('activeProjectId', undefined);
}

function selectProjectById(projectId: string | undefined): void {
    const project = $projects.get().projects.find((candidate) => getProjectId(candidate) === projectId);

    if (project) {
        setActiveProject(project);
    } else {
        clearActiveProject();
    }
}

function resolveFallbackProjectId(projects: Readonly<Project>[], activeProjectId: string | undefined): string | undefined {
    const activeProject = projects.find((project) => getProjectId(project) === activeProjectId);

    if (!activeProject) {
        return undefined;
    }

    return resolveActiveProjectIdAfterDeletion(projects, activeProject);
}

//
// * Internal
//
let isLoading = false;
let needsReload = false;
const pendingDeletedProjectNavigation = new Map<string, boolean>();

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

    const {projects, activeProjectId} = $projects.get();
    const nextProjectId = resolveActiveProjectId(projects, getProjectIdFromUrl())
        ?? resolveFallbackProjectId(projects, activeProjectId);

    if (nextProjectId) {
        selectProjectById(nextProjectId);
        setProjectSelectionDialogOpen(false);
        return;
    }

    clearActiveProject();
    ProjectContext.get().setNotAvailable();
    setProjectSelectionDialogOpen(true);
}

function updateActiveProjectAfterDeletion(deletedProject: Readonly<Project> | undefined): void {
    const {projects} = $projects.get();
    const nextProjectId = resolveActiveProjectIdAfterDeletion(projects, deletedProject);

    if (nextProjectId) {
        selectProjectById(nextProjectId);
        setProjectSelectionDialogOpen(false);
        return;
    }

    clearActiveProject();
    ProjectContext.get().setNotAvailable();
    setProjectSelectionDialogOpen(true);
}

/**
 * Initialize the active project from the URL without checks.
 * It is used during startup and project would not be available in the store yet.
 */
function initializeActiveProjectFromUrl(): void {
    const projectIdFromUrl = getProjectIdFromUrl();
    if (projectIdFromUrl) {
        $projects.setKey('activeProjectId', projectIdFromUrl);
    }
}

//
// * Initialization
//
initializeActiveProjectFromUrl();

void loadProjects();

ProjectUpdatedEvent.on(() => {
    loadProjects();
});

ProjectCreatedEvent.on(() => {
    loadProjects();
});

ProjectDeletedEvent.on((event: ProjectDeletedEvent) => {
    const deletedProjectId = event.getProjectName();
    removeProject(deletedProjectId, resolveDeleteNavigation(deletedProjectId));
});

//
// * Public API
//
export function reloadProjects(): void {
    void loadProjects();
}

export function markPendingDeletedProject(projectName: string, navigateAfterDeletion: boolean = false): void {
    pendingDeletedProjectNavigation.set(projectName, navigateAfterDeletion);
}

export function clearPendingDeletedProject(projectName?: string): void {
    if (projectName === undefined) {
        pendingDeletedProjectNavigation.clear();
        return;
    }

    pendingDeletedProjectNavigation.delete(projectName);
}

function consumePendingDeletedProject(projectName: string): boolean | undefined {
    const navigateAfterDeletion = pendingDeletedProjectNavigation.get(projectName);
    pendingDeletedProjectNavigation.delete(projectName);
    return navigateAfterDeletion;
}

function resolveDeleteNavigation(projectName: string): boolean {
    // ? Explicit intent from markPendingDeletedProject wins; otherwise default to
    // ? navigating when the deleted project is currently active (covers cross-tab deletes).
    return consumePendingDeletedProject(projectName) ?? isActiveProject(projectName);
}

export function upsertProject(project: Readonly<Project>): void {
    const {projects} = $projects.get();
    const updatedProjects = [...projects.filter((p) => getProjectId(p) !== getProjectId(project)), project as Project];
    $projects.setKey('projects', updatedProjects);
    updateActiveProject();
}

export function removeProject(projectName: string, navigateAfterDeletion: boolean = false): void {
    const {projects} = $projects.get();
    const deletedProject = projects.find((p) => getProjectId(p) === projectName);
    const updatedProjects = projects.filter((p) => getProjectId(p) !== projectName);
    $projects.setKey('projects', updatedProjects);

    if (navigateAfterDeletion) {
        updateActiveProjectAfterDeletion(deletedProject);
        return;
    }

    updateActiveProject();
}


//
// * Legacy
//
// TODO: Enonic UI - Deprecated - Remove this once the ProjectContext is removed
$activeProject.subscribe((project) => {
    if (!project) return;
    ProjectContext.get().setProject(project as Project);
});

// Reset dependent stores when project changes
function resetProjectDependentStores(): void {
    // Reset filter state first (this also resets filter tree)
    deactivateFilter();
    resetContentFilter();
    setContentFilterOpen(false);

    // Reset selection
    clearSelection();
    setActive(null);

    // Reset main tree (will be repopulated by ContentTreeListElement)
    resetTree();

    // Clear version history cache (versions are project-specific)
    clearVersionsCache();
}

const $previousProjectId = atom<string | undefined>(undefined);
$activeProject.subscribe((project) => {
    const currentId = project?.getName();
    const previousId = $previousProjectId.get();

    // Skip on initial load (no previous project)
    if (previousId === undefined) {
        $previousProjectId.set(currentId);
        return;
    }

    // Skip if project didn't actually change
    if (currentId === previousId) {
        return;
    }

    $previousProjectId.set(currentId);
    resetProjectDependentStores();
});
