import { $currentIds } from '../entities/content';
import {
    $contentPermissionsUpdated,
    $contentPublished,
    $contentUnpublished,
    $contentUpdated,
} from '../shared/socket/socket.store';
import { $actionsNeedRefresh } from './actions.store';

//
// * Actions Refresh Service
//
// Signals an actions refresh when socket events report changes (publish,
// update, permissions) to currently selected items.
// Started explicitly from the app root; never a side effect of importing.
//

let unsubscribers: Array<() => void> = [];

// Check if any changed IDs are in current selection and signal refresh
function checkAndSignalRefresh(changedIds: string[]): void {
    const currentIds = $currentIds.get();
    if (currentIds.length === 0) return;

    const changedSet = new Set(changedIds);
    if (currentIds.some((id) => changedSet.has(id))) {
        $actionsNeedRefresh.set(Date.now());
    }
}

//
// * Service Lifecycle
//

/**
 * Start watching socket events for changes that affect action availability.
 * Safe to call multiple times - will only initialize once.
 */
export const start = (): void => {
    if (unsubscribers.length > 0) {
        return;
    }

    unsubscribers = [
        // Content updated - properties may affect action availability
        $contentUpdated.subscribe((event) => {
            if (event?.data) {
                checkAndSignalRefresh(event.data.map((item) => item.getId()));
            }
        }),
        // Content published - publish state affects many actions
        $contentPublished.subscribe((event) => {
            if (event?.data) {
                checkAndSignalRefresh(event.data.map((item) => item.getId()));
            }
        }),
        // Content unpublished - publish state affects many actions
        $contentUnpublished.subscribe((event) => {
            if (event?.data) {
                checkAndSignalRefresh(event.data.map((item) => item.getId()));
            }
        }),
        // Permissions updated - directly affects action availability
        $contentPermissionsUpdated.subscribe((event) => {
            if (event?.data) {
                checkAndSignalRefresh(event.data.map((id) => id.toString()));
            }
        }),
    ];
};

/**
 * Stop watching and detach all subscriptions.
 */
export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};
