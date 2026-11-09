import { listenKeys } from 'nanostores';
import { $applications } from '../../../entities/application';
import { refreshProjectDialogApplications } from './projectDialog.store';

//
// * Project Dialog Service
//
// Re-resolves the listed apps when the installed ones reload on an application event,
// so a stopped or uninstalled app loses its pencil and an installed one gets it back
// while the dialog is open.
// Started explicitly from the browse and settings bootstraps; never a side effect of importing.
//

let unsubscribers: Array<() => void> = [];

//
// * Service Lifecycle
//

/**
 * Start the project dialog wiring.
 * Safe to call multiple times - will only initialize once.
 */
export const start = (): void => {
    if (unsubscribers.length > 0) {
        return;
    }

    unsubscribers = [
        // The installed apps only; the loading flips of the store leave the list alone.
        listenKeys($applications, ['applications'], () => refreshProjectDialogApplications()),
    ];
};

/**
 * Stop the project dialog wiring and detach all subscriptions.
 */
export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};
