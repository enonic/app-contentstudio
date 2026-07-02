import { computed } from 'nanostores';
import { $activeProject as $_activeProjectAtom } from './activeProject.store';

export {
    $activeProjectName,
    getActiveProject,
    getActiveProjectName,
    isProjectInitialized,
    onActiveProjectChanged,
} from './activeProject.store';
export {
    $projects,
    $noProjectMode,
    clearPendingDeletedProject,
    isActiveProject,
    markPendingDeletedProject,
    onNoProjectsAvailable,
    reloadProjects,
    selectProject,
    upsertProject,
} from './projects.store';

//
// * Read-only views
//
// Atoms stay private to the slice; writes go through commands.
//

export const $activeProject = computed($_activeProjectAtom, (value) => value);
