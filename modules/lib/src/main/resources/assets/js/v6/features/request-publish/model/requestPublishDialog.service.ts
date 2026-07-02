import { type ContentId } from '../../../../app/content/ContentId';
import { fetchContentSummaries } from '../../../entities/content';
import { findContentIdsWithCreatedDescendants } from '../../../shared/lib/cms/content/paths';
import { createContentIdSet, refreshTrackedMainContentItems } from '../../../shared/lib/cms/content/trackedItems';
import { createGuardedSocketHandler } from '../../../shared/lib/store/createGuardedSocketHandler';
import {
    $contentArchived,
    $contentCreated,
    $contentDeleted,
    $contentPublished,
    $contentRenamed,
    $contentUpdated,
} from '../../../shared/socket/socket.store';
import {
    $requestPublishDialog,
    hasOpenRequestPublishDialog,
    patchTrackedRequestPublishItems,
    queueRequestPublishSocketChanges,
    reloadDependenciesDebounced,
    removeTrackedRequestPublishItems,
    resetRequestPublishDialogContext,
} from './requestPublishDialog.store';

//
// * Request Publish Dialog Service
//
// Keeps the request publish dialog items, dependants, and readiness checks in
// sync with socket events, queueing changes that arrive while submitting.
// Started explicitly from the app root; never a side effect of importing.
//

let unsubscribers: Array<() => void> = [];

//
// * Event Handling
//

const isRequestPublishDialogActive = (): boolean => {
    const { submitting } = $requestPublishDialog.get();
    return hasOpenRequestPublishDialog() && !submitting;
};

const onActiveRequestPublishSocketEvent = createGuardedSocketHandler(isRequestPublishDialogActive);

const onRequestPublishSocketEvent = <T>(
    handler: (event: T) => void,
    getRemovedIds?: (event: T) => Iterable<string>,
): ((event: T | null | undefined) => void) => {
    const activeHandler = onActiveRequestPublishSocketEvent(handler);

    return (event) => {
        if (event == null) {
            return;
        }

        const { submitting } = $requestPublishDialog.get();
        if (submitting && hasOpenRequestPublishDialog()) {
            queueRequestPublishSocketChanges(getRemovedIds?.(event));
            return;
        }

        activeHandler(event);
    };
};

const refreshRequestPublishMainItems = async (ids: ContentId[]): Promise<void> => {
    if (ids.length === 0) {
        return;
    }

    try {
        const change = await refreshTrackedMainContentItems($requestPublishDialog.get(), ids, fetchContentSummaries);

        if (change.changed && isRequestPublishDialogActive()) {
            $requestPublishDialog.set(change.state);
        }
    } catch (error) {
        console.error(error);
    }
};

const handleRemovedRequestPublishItems = (idsToRemove: Set<string>): void => {
    const { removedMain, removedDependants } = removeTrackedRequestPublishItems(idsToRemove);

    if ($requestPublishDialog.get().items.length === 0) {
        resetRequestPublishDialogContext();
        return;
    }

    if (removedMain || removedDependants) {
        reloadDependenciesDebounced();
    }
};

//
// * Service Lifecycle
//

/**
 * Start the request publish dialog wiring.
 * Safe to call multiple times - will only initialize once.
 */
export const start = (): void => {
    if (unsubscribers.length > 0) {
        return;
    }

    unsubscribers = [
        $contentCreated.subscribe(
            onRequestPublishSocketEvent((event) => {
                const mainItemIds = findContentIdsWithCreatedDescendants($requestPublishDialog.get().items, event.data);
                if (mainItemIds.length === 0) {
                    return;
                }

                void refreshRequestPublishMainItems(mainItemIds).finally(() => {
                    reloadDependenciesDebounced();
                });
            }),
        ),
        $contentUpdated.subscribe(
            onRequestPublishSocketEvent((event) => {
                const { updatedMain, updatedDependants } = patchTrackedRequestPublishItems(event.data);

                if (updatedMain || updatedDependants) {
                    reloadDependenciesDebounced();
                }
            }),
        ),
        $contentRenamed.subscribe(
            onRequestPublishSocketEvent((event) => {
                patchTrackedRequestPublishItems(event.data.items);
            }),
        ),
        $contentDeleted.subscribe(
            onRequestPublishSocketEvent(
                (event) => {
                    handleRemovedRequestPublishItems(createContentIdSet(event.data));
                },
                (event) => event.data.map((item) => item.getContentId().toString()),
            ),
        ),
        $contentArchived.subscribe(
            onRequestPublishSocketEvent(
                (event) => {
                    handleRemovedRequestPublishItems(createContentIdSet(event.data));
                },
                (event) => event.data.map((item) => item.getContentId().toString()),
            ),
        ),
        $contentPublished.subscribe(
            onRequestPublishSocketEvent(
                (event) => {
                    handleRemovedRequestPublishItems(createContentIdSet(event.data));
                },
                (event) => event.data.map((item) => item.getContentId().toString()),
            ),
        ),
    ];
};

/**
 * Stop the request publish dialog wiring and detach all subscriptions.
 */
export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};
