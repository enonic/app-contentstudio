import {atom, computed, map} from 'nanostores';
import {type Project} from '../../../app/settings/data/project/Project';
import {ProjectListRequest} from '../../../app/settings/resource/ProjectListRequest';
import {ProjectUpdatedEvent} from '../../../app/settings/event/ProjectUpdatedEvent';
import {ProjectCreatedEvent} from '../../../app/settings/event/ProjectCreatedEvent';
import {ProjectDeletedEvent} from '../../../app/settings/event/ProjectDeletedEvent';
import {syncAtomStore} from '../utils/storage/sync';
import {$config} from './config.store';
import {setProjectSelectionDialogOpen} from './dialogs.store';
import {resetTree} from './tree-list.store';
import {clearSelection, setActive} from './contentTreeSelection.store';
import {setContentFilterOpen, resetContentFilter} from './contentFilter.store';
import {deactivateFilter} from '../api/content-fetcher';
import {clearVersionsCache} from '../utils/widget/versions/versionsCache';
import {resolveActiveProjectId, resolveActiveProjectIdAfterDeletion} from '../utils/cms/projects/projectSelection';
import {isWizardUrl} from '../utils/url/app';
import {setCurrentProject} from './activeProject.store';
export {
    getActiveProject,
    getActiveProjectName,
    isProjectInitialized,
    onActiveProjectChanged,
    unActiveProjectChanged,
    whenProjectInitialized,
} from './activeProject.store';

// TODO: Enonic UI - Feature: store projects as JSON objects in the sync store
// TODO: Enonic UI - Feature: load projects from the sync store on startup if other tabs are active
// ? Projects update via server events over WebSocket and stay up to date once loaded.
// ? Reading existing projects from the store on startup is faster and more efficient.

type ProjectsStore = {
    projects: Readonly<Project>[];
    activeProjectId: string | undefined;
    loaded: boolean;
    resolved: boolean;
    loadError: boolean;
    noProjectMode: boolean;
};

export const $projects = map<ProjectsStore>({
    projects: [],
    activeProjectId: undefined,
    loaded: false,
    resolved: false,
    loadError: false,
    noProjectMode: false,
});

//
// * Last user-selected project, persisted across sessions.
// * Written only on explicit UI selection or on deletion-driven fallback.
// * Read in browse mode when the URL has no project; ignored on wizard URLs.
//
const $lastSelectedProjectId = atom<string | undefined>(undefined);
syncAtomStore($lastSelectedProjectId, 'lastSelectedProjectId', {loadInitial: true});

export const $activeProject = computed($projects, (store) => {
    const activeProject = store.projects.find((p) => getProjectId(p) === store.activeProjectId);

    return isAvailableProject(activeProject) ? activeProject : undefined;
});

export const $noProjectMode = computed($projects, (store) => {
    if (!store.loaded) {
        return store.noProjectMode;
    }

    return !store.projects.some(isAvailableProject);
});

export const $activeProjectName = computed($activeProject, (activeProject) => {
    if (!activeProject) return '';

    const projectDisplayName = activeProject.getDisplayName();
    const projectLanguage = activeProject.getLanguage();

    if (!projectLanguage) return projectDisplayName;

    return `${projectDisplayName} (${projectLanguage})`;
});

function setActiveProject(project: Readonly<Project> | undefined): void {
    const existsInStore = $projects.get().projects.some((p) => getProjectId(p) === getProjectId(project));
    if (!existsInStore) return;
    $projects.setKey('activeProjectId', getProjectId(project));
    $projects.setKey('noProjectMode', false);
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

const noProjectsAvailableListeners: (() => void)[] = [];

function setNoProjectMode(): void {
    $projects.setKey('noProjectMode', true);
    noProjectsAvailableListeners.slice().forEach((handler: () => void) => handler());
}

export function onNoProjectsAvailable(handler: () => void): () => void {
    noProjectsAvailableListeners.push(handler);

    return () => {
        const index = noProjectsAvailableListeners.indexOf(handler);

        if (index > -1) {
            noProjectsAvailableListeners.splice(index, 1);
        }
    };
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

function updateProjectsState(state: Partial<ProjectsStore>): void {
    $projects.set({
        ...$projects.get(),
        ...state,
    });
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
    updateProjectsState({
        loaded: false,
        resolved: false,
        loadError: false,
    });

    try {
        const request = new ProjectListRequest(true);
        const projects = await request.sendAndParse();

        updateProjectsState({
            projects,
            loaded: false,
            resolved: false,
            loadError: false,
        });
        updateActiveProject();
        updateProjectsState({
            loaded: true,
            resolved: true,
            loadError: false,
        });
    } catch (error) {
        updateProjectsState({
            loaded: false,
            loadError: true,
            resolved: true,
        });
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
    setNoProjectMode();
    setProjectSelectionDialogOpen(true);
}

function updateActiveProjectAfterDeletion(deletedProject: Readonly<Project> | undefined): void {
    const {projects} = $projects.get();
    const nextProjectId = resolveActiveProjectIdAfterDeletion(projects, deletedProject);
    const wasLast = $lastSelectedProjectId.get() === getProjectId(deletedProject);

    if (nextProjectId) {
        selectProjectById(nextProjectId);
        if (wasLast) {
            $lastSelectedProjectId.set(nextProjectId);
        }
        setProjectSelectionDialogOpen(false);
        return;
    }

    clearActiveProject();
    if (wasLast) {
        $lastSelectedProjectId.set(undefined);
    }
    setNoProjectMode();
    setProjectSelectionDialogOpen(true);
}

/**
 * Initialize the active project. URL takes precedence; in browse mode we
 * fall back to the user's last UI-selected project from storage.
 */
function initializeActiveProject(): void {
    const fromUrl = getProjectIdFromUrl();
    if (fromUrl) {
        $projects.setKey('activeProjectId', fromUrl);
        return;
    }

    if (!isWizardUrl()) {
        const fromStorage = $lastSelectedProjectId.get();
        if (fromStorage) {
            $projects.setKey('activeProjectId', fromStorage);
        }
    }
}

//
// * Initialization
//
initializeActiveProject();

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

/**
 * UI-driven project selection. Updates the active project and persists it as
 * the last selected project. Use this from UI handlers; programmatic code
 * paths inside the store stay on the internal helpers.
 */
export function selectProject(project: Readonly<Project>): void {
    setActiveProject(project);
    const projectId = getProjectId(project);
    // ? Persist only if the active project actually changed (i.e., project was valid).
    if ($projects.get().activeProjectId === projectId) {
        $lastSelectedProjectId.set(projectId);
    }
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

    if ($lastSelectedProjectId.get() === projectName) {
        $lastSelectedProjectId.set(undefined);
    }

    updateActiveProject();
}


$activeProject.subscribe((project) => {
    setCurrentProject(project);
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
