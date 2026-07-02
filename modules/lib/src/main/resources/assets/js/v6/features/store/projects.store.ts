import { atom, computed, map } from 'nanostores';
import { type Project } from '../../../app/settings/data/project/Project';
import { ProjectListRequest } from '../../../app/settings/resource/ProjectListRequest';
import { ProjectUpdatedEvent } from '../../../app/settings/event/ProjectUpdatedEvent';
import { ProjectCreatedEvent } from '../../../app/settings/event/ProjectCreatedEvent';
import { ProjectDeletedEvent } from '../../../app/settings/event/ProjectDeletedEvent';
import { syncAtomStore } from '../../shared/lib/storage/sync';
import { defineEvent } from '../../shared/lib/dom/events/definedEvent';
import { setProjectSelectionDialogOpen } from './dialogs.store';
// ! Deep imports on purpose: this store sits below entities/content in the
// import graph (content.store reads the active project), and pulling the
// slice barrel here creates a module cycle.
import { resetTree } from '../../entities/content/model/content-tree.store';
import { clearSelection, setActive } from '../../entities/content/model/content-selection.store';
import { deactivateFilter } from '../../entities/content/api/content-fetcher';
import { setContentFilterOpen, resetContentFilter } from './contentFilter.store';
import { clearVersionsCache } from '../../shared/lib/widget/versions/versionsCache';
import {
    resolveActiveProjectId,
    resolveActiveProjectIdAfterDeletion,
} from '../../shared/lib/cms/projects/projectSelection';
import { isWizardUrl } from '../../shared/lib/url/app';
import { $activeProject, setActiveProject } from './activeProject.store';

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
syncAtomStore($lastSelectedProjectId, 'lastSelectedProjectId', { loadInitial: true });

export const $noProjectMode = computed($projects, (store) => {
    if (!store.loaded) {
        return store.noProjectMode;
    }

    return !store.projects.some(isAvailableProject);
});

//
// * Internal writer: applies an id to $projects map AND publishes the
// * canonical Project instance to activeProject.store. The activeProject
// * store is the single source of truth for "which project is active";
// * this function keeps the projects-list view in sync.
//
function applyActiveProjectId(project: Readonly<Project> | undefined): void {
    const existsInStore = $projects.get().projects.some((p) => getProjectId(p) === getProjectId(project));
    if (!existsInStore) return;
    // ? Update the atom before flipping noProjectMode — subscribers of
    // ? $noProjectMode that read getActiveProject() must see the new project.
    setActiveProject(project);
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

const APP_ID = 'com.enonic.app.contentstudio';

function getProjectIdFromUrl(): string | undefined {
    const viewPath = window.location.href.split(APP_ID)[1];
    const normalizedPath = viewPath?.replace(/\/[^\/]+/, '') || '/';
    return normalizedPath.split('/')[1];
}

function clearActiveProject(): void {
    $projects.setKey('activeProjectId', undefined);
    setActiveProject(undefined);
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
        applyActiveProjectId(project);
    } else {
        clearActiveProject();
    }
}

//
// * After the projects list is replaced, the activeProject atom may hold a
// * stale Project instance. Re-resolve from the new list so consumers see the
// * canonical instance (or undefined if the active id is no longer present).
//
function refreshActiveProjectInstance(): void {
    const { projects, activeProjectId } = $projects.get();
    if (!activeProjectId) return;
    const canonical = projects.find((p) => getProjectId(p) === activeProjectId);
    setActiveProject(canonical && isAvailableProject(canonical) ? canonical : undefined);
}

function resolveFallbackProjectId(
    projects: Readonly<Project>[],
    activeProjectId: string | undefined,
): string | undefined {
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
let hostProjectId: string | undefined;
let hostProjectIdReported = false;
let applyingRemoteSelection = false;
const pendingDeletedProjectNavigation = new Map<string, boolean>();

// ? Same-window pub/sub used to sync the active project across widget bundles
// ? (Settings, Studio Plus, etc.) that share the window but ship their own
// ? copy of this store. Goes through window CustomEvent; no cross-tab scope.
const activeProjectChangedEvent = defineEvent<{ projectName: string }>('enonic:cs:active-project-changed');

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
        validateHostProjectId(projects);
        refreshActiveProjectInstance();
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

//
// * Validates the host-provided id against the freshly loaded project list.
// * If the project is missing or inaccessible, logs once and clears the stale
// * activeProjectId so URL/storage fallback can resolve in updateActiveProject.
//
function validateHostProjectId(projects: Readonly<Project>[]): void {
    if (!hostProjectId || hostProjectIdReported) return;

    const projectFromHost = projects.find((project) => getProjectId(project) === hostProjectId);
    const isAvailable = !!projectFromHost && isAvailableProject(projectFromHost);

    if (!isAvailable) {
        console.error(`Project "${hostProjectId}" is not available`);
        $projects.setKey('activeProjectId', undefined);
    }

    hostProjectIdReported = true;
}

function updateActiveProject(): void {
    if ($activeProject.get()) {
        return;
    }

    const { projects, activeProjectId } = $projects.get();
    const nextProjectId =
        resolveActiveProjectId(projects, getProjectIdFromUrl()) ?? resolveFallbackProjectId(projects, activeProjectId);

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
    const { projects } = $projects.get();
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
 * Initialize the active project. The host-provided id takes precedence, then
 * URL, then in browse mode the user's last UI-selected project from storage.
 * Availability of the host id can only be verified after loadProjects() runs,
 * so it is re-checked (and reported) in updateActiveProject().
 */
function initializeActiveProject(): void {
    if (hostProjectId) {
        $projects.setKey('activeProjectId', hostProjectId);
        return;
    }

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

/**
 * Bootstraps the projects store. Must be called from the app entry point
 * (or any pluggable host: embedded widget, settings tool, etc.) — never from
 * module load — so that network I/O and event subscriptions happen after
 * config/auth init.
 *
 * @param activeProjectId Optional project id the host wants to activate.
 *     Overrides URL- and storage-based discovery when provided and the
 *     project exists in the loaded list and is accessible to the user.
 *     If it is not accessible, a single `console.error` is logged and the
 *     store falls back to URL → storage → noProjectMode as usual.
 */
export function initProjects(activeProjectId?: string): void {
    hostProjectId = activeProjectId;
    hostProjectIdReported = false;

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

    activeProjectChangedEvent.listen(({ projectName }) => {
        if ($projects.get().activeProjectId === projectName) return;
        const project = $projects.get().projects.find((p) => getProjectId(p) === projectName);
        if (!project) return;
        applyingRemoteSelection = true;
        try {
            applyActiveProjectId(project);
            $lastSelectedProjectId.set(projectName);
        } finally {
            applyingRemoteSelection = false;
        }
    });
}

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
    applyActiveProjectId(project);
    const projectId = getProjectId(project);
    // ? Persist only if the active project actually changed (i.e., project was valid).
    if ($projects.get().activeProjectId === projectId) {
        $lastSelectedProjectId.set(projectId);
        if (!applyingRemoteSelection && projectId) {
            activeProjectChangedEvent.dispatch({ projectName: projectId });
        }
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
    const { projects } = $projects.get();
    const updatedProjects = [...projects.filter((p) => getProjectId(p) !== getProjectId(project)), project as Project];
    $projects.setKey('projects', updatedProjects);
    updateActiveProject();
}

export function removeProject(projectName: string, navigateAfterDeletion: boolean = false): void {
    const { projects } = $projects.get();
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
