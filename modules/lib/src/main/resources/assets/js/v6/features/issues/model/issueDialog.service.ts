import { IssueServerEventsHandler } from '../../../../app/issue/event/IssueServerEventsHandler';
import { $activeProject } from '../../../entities/project/activeProject.store';
import { $issueDialog, loadIssueDialogList, triggerReload } from './issueDialog.store';

//
// * Issue Dialog Service
//
// Loads the issue list when the dialog opens and keeps it fresh on active
// project switches and issue server events.
// Started explicitly from the app root; never a side effect of importing.
//

let unsubscribers: Array<() => void> = [];

// Tracks the previous open state to detect the closed-to-open transition.
let wasOpen = false;

//
// * Service Lifecycle
//

/**
 * Start the issue dialog wiring.
 * Safe to call multiple times - will only initialize once.
 */
export const start = (): void => {
    if (unsubscribers.length > 0) {
        return;
    }

    wasOpen = $issueDialog.get().open;

    const serverEventsHandler = IssueServerEventsHandler.getInstance();
    const handleIssueCreated = (): void => {
        triggerReload();
    };
    const handleIssueUpdated = (): void => {
        triggerReload();
    };

    unsubscribers = [
        $activeProject.subscribe((activeProject) => {
            if (!activeProject) {
                return;
            }
            triggerReload();
        }),
        $issueDialog.subscribe(({ open }) => {
            if (!wasOpen && open) {
                void loadIssueDialogList();
            }
            wasOpen = open;
        }),
    ];

    serverEventsHandler.onIssueCreated(handleIssueCreated);
    serverEventsHandler.onIssueUpdated(handleIssueUpdated);
    unsubscribers.push(
        () => serverEventsHandler.unIssueCreated(handleIssueCreated),
        () => serverEventsHandler.unIssueUpdated(handleIssueUpdated),
    );
};

/**
 * Stop the issue dialog wiring and detach all subscriptions.
 */
export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};
