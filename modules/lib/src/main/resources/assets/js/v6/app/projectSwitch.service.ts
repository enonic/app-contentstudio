import { atom } from 'nanostores';
import { clearSelection, deactivateFilter, resetTree, setActive } from '../entities/content';
import { clearVersionsCache } from '../shared/lib/widget/versions/versionsCache';
import { $activeProject } from '../entities/project/activeProject.store';
import { resetContentFilter, setContentFilterOpen } from '../features/search/model/contentFilter.store';

//
// * Project Switch Service
//
// Cross-slice orchestration: when the active project changes, reset every
// project-dependent piece of state in a defined order. Lives above the
// entity slices so neither project nor content reaches sideways.
// Started explicitly from the app root; never a side effect of importing.
//

let unsubscribe: (() => void) | undefined;

const $previousProjectId = atom<string | undefined>(undefined);

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

/**
 * Start watching for project switches.
 * Safe to call multiple times - will only initialize once.
 */
export const start = (): void => {
    if (unsubscribe) {
        return;
    }

    unsubscribe = $activeProject.subscribe((project) => {
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
};

/**
 * Stop watching and detach the subscription.
 */
export const stop = (): void => {
    unsubscribe?.();
    unsubscribe = undefined;
};

export const isRunning = (): boolean => {
    return unsubscribe != null;
};
