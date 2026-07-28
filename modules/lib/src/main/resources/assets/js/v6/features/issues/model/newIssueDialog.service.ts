import { type ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { fetchContentSummaries } from '../../../entities/content';
import { pruneDependantWindow } from '../../../entities/content/lib/dependantWindow';
import { findContentIdsWithCreatedDescendants } from '../../../shared/lib/cms/content/paths';
import {
    createContentIdSet,
    patchTrackedContentItems,
    refreshTrackedMainContentItems,
    removeTrackedContentItems,
} from '../../../shared/lib/cms/content/trackedItems';
import { createGuardedSocketHandler } from '../../../shared/lib/store/createGuardedSocketHandler';
import {
    $contentArchived,
    $contentCreated,
    $contentDeleted,
    $contentPublished,
    $contentRenamed,
    $contentUpdated,
} from '../../../shared/socket/socket.store';
import { $newIssueDialog, reloadDependenciesDebounced, resetDependenciesState } from './newIssueDialog.store';

//
// * New Issue Dialog Service
//
// Keeps the new issue dialog items and dependants in sync with content socket
// events while the dialog is open.
// Started explicitly from the app root; never a side effect of importing.
//

let unsubscribers: Array<() => void> = [];

//
// * Event Handling
//

const isNewIssueDialogActive = (): boolean => {
    const { open, items } = $newIssueDialog.get();
    return open && items.length > 0;
};

const onNewIssueSocketEvent = createGuardedSocketHandler(isNewIssueDialogActive);

const patchTrackedNewIssueItems = (updates: ContentSummary[]): { updatedMain: boolean; updatedDependants: boolean } => {
    const change = patchTrackedContentItems($newIssueDialog.get(), updates);

    if (change.changed) {
        $newIssueDialog.set(change.state);
    }

    return {
        updatedMain: change.changedMain,
        updatedDependants: change.changedDependants,
    };
};

const removeTrackedNewIssueItems = (idsToRemove: Set<string>): { removedMain: boolean; removedDependants: boolean } => {
    const change = removeTrackedContentItems($newIssueDialog.get(), idsToRemove);
    const pruned = pruneDependantWindow(change.changed ? change.state : $newIssueDialog.get(), idsToRemove);

    if (change.changed || pruned.changed) {
        $newIssueDialog.set(pruned.state);
    }

    return {
        removedMain: change.changedMain,
        // An id-only prune (dependant beyond the loaded window) must also count:
        // callers rely on this flag to reschedule the dependency reload.
        removedDependants: change.changedDependants || pruned.changed,
    };
};

const handleRemovedNewIssueItems = (idsToRemove: Set<string>): void => {
    const { removedMain, removedDependants } = removeTrackedNewIssueItems(idsToRemove);

    if ($newIssueDialog.get().items.length === 0) {
        $newIssueDialog.set(
            resetDependenciesState({
                ...$newIssueDialog.get(),
                items: [],
                excludeChildrenIds: [],
                appliedExcludeChildrenIds: [],
            }),
        );
        return;
    }

    if (removedMain || removedDependants) {
        reloadDependenciesDebounced();
    }
};

const refreshNewIssueMainItems = async (ids: ContentId[]): Promise<void> => {
    try {
        const change = await refreshTrackedMainContentItems($newIssueDialog.get(), ids, fetchContentSummaries);

        if (change.changed && isNewIssueDialogActive()) {
            $newIssueDialog.set(change.state);
        }
    } catch (error) {
        console.error(error);
    }
};

//
// * Service Lifecycle
//

/**
 * Start the new issue dialog wiring.
 * Safe to call multiple times - will only initialize once.
 */
export const start = (): void => {
    if (unsubscribers.length > 0) {
        return;
    }

    unsubscribers = [
        $contentCreated.subscribe(
            onNewIssueSocketEvent((event) => {
                const matched = findContentIdsWithCreatedDescendants($newIssueDialog.get().items, event.data);
                if (matched.length === 0) {
                    return;
                }

                void refreshNewIssueMainItems(matched).finally(() => {
                    reloadDependenciesDebounced();
                });
            }),
        ),
        $contentUpdated.subscribe(
            onNewIssueSocketEvent((event) => {
                const { updatedMain, updatedDependants } = patchTrackedNewIssueItems(event.data);
                if (updatedMain || updatedDependants) {
                    reloadDependenciesDebounced();
                }
            }),
        ),
        $contentRenamed.subscribe(
            onNewIssueSocketEvent((event) => {
                patchTrackedNewIssueItems(event.data.items);
            }),
        ),
        $contentDeleted.subscribe(
            onNewIssueSocketEvent((event) => {
                handleRemovedNewIssueItems(createContentIdSet(event.data));
            }),
        ),
        $contentArchived.subscribe(
            onNewIssueSocketEvent((event) => {
                handleRemovedNewIssueItems(createContentIdSet(event.data));
            }),
        ),
        $contentPublished.subscribe(
            onNewIssueSocketEvent((event) => {
                const { updatedMain, updatedDependants } = patchTrackedNewIssueItems(event.data);
                if (updatedMain || updatedDependants) {
                    reloadDependenciesDebounced();
                }
            }),
        ),
    ];
};

/**
 * Stop the new issue dialog wiring and detach all subscriptions.
 */
export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};
