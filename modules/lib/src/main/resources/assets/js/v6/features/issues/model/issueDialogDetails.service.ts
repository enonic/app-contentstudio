import { NodeServerChangeType } from '@enonic/lib-admin-ui/event/NodeServerChange';
import { onMount } from 'nanostores';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { IssueServerEvent } from '../../../../app/event/IssueServerEvent';
import { IssueServerEventsHandler } from '../../../../app/issue/event/IssueServerEventsHandler';
import { GetIssueRequest } from '../../../../app/issue/resource/GetIssueRequest';
import { GetPrincipalsByKeysRequest } from '../../../../app/security/GetPrincipalsByKeysRequest';
import { pruneDependantWindow } from '../../../entities/content/lib/dependantWindow';
import { findContentIdsWithCreatedDescendants } from '../../../shared/lib/cms/content/paths';
import {
    createContentIdSet,
    patchTrackedContentItems,
    removeTrackedContentItems,
} from '../../../shared/lib/cms/content/trackedItems';
import { createGuardedSocketHandler } from '../../../shared/lib/store/createGuardedSocketHandler';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import {
    $contentArchived,
    $contentCreated,
    $contentDeleted,
    $contentPublished,
    $contentRenamed,
    $contentUpdated,
} from '../../../shared/socket/socket.store';
import { $issueDialog, closeIssueDialog } from './issueDialog.store';
import {
    $issueDialogDetails,
    applyUpdatedIssue,
    loadIssueDialogComments,
    loadIssueDialogItems,
    resetIssueDialogDetails,
    type IssueAssignees,
} from './issueDialogDetails.store';

import type { Issue } from '../../../../app/issue/Issue';

//
// * Issue Dialog Details Service
//
// Keeps the open issue details in sync with content socket events, issue
// server events, and the issue dialog view state.
// Started explicitly from the app root; never a side effect of importing.
//

let unsubscribers: Array<() => void> = [];

// Guards against stale server-event reloads; bumped on reset, unmount, and each reload
let serverEventReloadRequestId = 0;

//
// * Event Handling
//

const isIssueDialogDetailsActive = (): boolean => {
    const { open, view } = $issueDialog.get();
    return open && view === 'details';
};

const onIssueDialogDetailsSocketEvent = createGuardedSocketHandler(isIssueDialogDetailsActive);

const patchTrackedIssueDialogItems = (
    updates: ContentSummary[],
): { updatedMain: boolean; updatedDependants: boolean } => {
    const change = patchTrackedContentItems($issueDialogDetails.get(), updates);

    if (change.changed) {
        $issueDialogDetails.set(change.state);
    }

    return {
        updatedMain: change.changedMain,
        updatedDependants: change.changedDependants,
    };
};

const removeTrackedIssueDialogItems = (
    idsToRemove: Set<string>,
): { removedMain: boolean; removedDependants: boolean } => {
    const change = removeTrackedContentItems($issueDialogDetails.get(), idsToRemove);
    const pruned = pruneDependantWindow(change.changed ? change.state : $issueDialogDetails.get(), idsToRemove);

    if (change.changed || pruned.changed) {
        $issueDialogDetails.set(pruned.state);
    }

    return {
        removedMain: change.changedMain,
        // An id-only prune (dependant beyond the loaded window) must also count:
        // callers rely on this flag to reschedule the dependency reload.
        removedDependants: change.changedDependants || pruned.changed,
    };
};

const getCurrentIssueDialogIssueId = (): string | undefined => {
    return $issueDialogDetails.get().issueId ?? $issueDialog.get().issueId;
};

const getCurrentIssueDialogIssue = (): Issue | undefined => {
    const state = $issueDialogDetails.get();
    if (state.issue) {
        return state.issue;
    }

    const { issues } = $issueDialog.get();
    const currentIssueId = getCurrentIssueDialogIssueId();

    return issues.find((item) => item.getIssue().getId() === currentIssueId)?.getIssue();
};

const getCurrentIssueDialogIssueName = (): string | undefined => {
    return getCurrentIssueDialogIssue()?.getName();
};

const isCurrentIssueDialogIssueId = (issueId: string): boolean => {
    return isIssueDialogDetailsActive() && getCurrentIssueDialogIssueId() === issueId;
};

const isStaleIssueDialogDetailsReload = (issueId: string, requestId: number): boolean => {
    return requestId !== serverEventReloadRequestId || !isCurrentIssueDialogIssueId(issueId);
};

const fetchIssueAssignees = async (issue: Issue): Promise<IssueAssignees | undefined> => {
    const approvers = issue.getApprovers();
    if (approvers.length === 0) {
        return [];
    }

    try {
        return await new GetPrincipalsByKeysRequest(approvers).sendAndParse();
    } catch (error) {
        console.error(error);
        return undefined;
    }
};

const reloadIssueDialogDetailsForServerEvent = async (issueId: string): Promise<void> => {
    if (!isCurrentIssueDialogIssueId(issueId)) {
        return;
    }

    const requestId = ++serverEventReloadRequestId;

    try {
        const issue = await new GetIssueRequest(issueId).sendAndParse();
        if (isStaleIssueDialogDetailsReload(issueId, requestId)) {
            return;
        }

        const assignees = await fetchIssueAssignees(issue);
        if (isStaleIssueDialogDetailsReload(issueId, requestId)) {
            return;
        }

        const dialogState = $issueDialog.get();
        const issueWithAssignees = dialogState.issues.find((item) => item.getIssue().getId() === issueId);
        applyUpdatedIssue(issue, dialogState, issueWithAssignees, {}, assignees);

        await loadIssueDialogComments(issueId, { forceReload: true });
        if (isStaleIssueDialogDetailsReload(issueId, requestId)) {
            return;
        }

        void loadIssueDialogItems(issue, { forceReload: true });
    } catch (error) {
        console.error(error);
    }
};

const queueIssueDialogDetailsServerEventReload = createDebounce((issueId: string) => {
    void reloadIssueDialogDetailsForServerEvent(issueId);
}, 1250);

const isCurrentIssueDialogServerEvent = (issueIds: string[]): boolean => {
    const currentIssueId = getCurrentIssueDialogIssueId();
    if (!currentIssueId || !isIssueDialogDetailsActive()) {
        return false;
    }

    if (issueIds.includes(currentIssueId)) {
        return true;
    }

    const currentIssueName = getCurrentIssueDialogIssueName();
    return currentIssueName != null && issueIds.includes(currentIssueName);
};

const reloadIssueDialogItemsForCurrentIssue = (): void => {
    const issue = getCurrentIssueDialogIssue();
    if (!issue) {
        return;
    }
    void loadIssueDialogItems(issue, { forceReload: true });
};

const handleIssueDialogDetailsIssueChanged = (issueIds: string[], event: IssueServerEvent): void => {
    const currentIssueId = getCurrentIssueDialogIssueId();
    if (!currentIssueId || !isCurrentIssueDialogServerEvent(issueIds)) {
        return;
    }

    // An id match (not just a name) on delete means the open issue itself was removed, not a comment.
    if (event.getType() === NodeServerChangeType.DELETE && issueIds.includes(currentIssueId)) {
        closeIssueDialog();
        return;
    }

    queueIssueDialogDetailsServerEventReload(currentIssueId);
};

// Invalidates any in-flight server-event reload before the store reset bumps its own guards.
const resetIssueDialogDetailsAndInvalidate = (issueId?: string): void => {
    serverEventReloadRequestId += 1;
    resetIssueDialogDetails(issueId);
};

//
// * Service Lifecycle
//

/**
 * Start the issue dialog details wiring.
 * Safe to call multiple times - will only initialize once.
 */
export const start = (): void => {
    if (unsubscribers.length > 0) {
        return;
    }

    unsubscribers = [
        $contentCreated.subscribe(
            onIssueDialogDetailsSocketEvent((event) => {
                const matched = findContentIdsWithCreatedDescendants($issueDialogDetails.get().items, event.data);
                if (matched.length === 0) {
                    return;
                }
                reloadIssueDialogItemsForCurrentIssue();
            }),
        ),
        $contentUpdated.subscribe(
            onIssueDialogDetailsSocketEvent((event) => {
                const { updatedMain, updatedDependants } = patchTrackedIssueDialogItems(event.data);
                if (updatedMain || updatedDependants) {
                    reloadIssueDialogItemsForCurrentIssue();
                }
            }),
        ),
        $contentRenamed.subscribe(
            onIssueDialogDetailsSocketEvent((event) => {
                patchTrackedIssueDialogItems(event.data.items);
            }),
        ),
        $contentDeleted.subscribe(
            onIssueDialogDetailsSocketEvent((event) => {
                const { removedMain, removedDependants } = removeTrackedIssueDialogItems(
                    createContentIdSet(event.data),
                );
                if (removedMain || removedDependants) {
                    reloadIssueDialogItemsForCurrentIssue();
                }
            }),
        ),
        $contentArchived.subscribe(
            onIssueDialogDetailsSocketEvent((event) => {
                const { removedMain, removedDependants } = removeTrackedIssueDialogItems(
                    createContentIdSet(event.data),
                );
                if (removedMain || removedDependants) {
                    reloadIssueDialogItemsForCurrentIssue();
                }
            }),
        ),
        $contentPublished.subscribe(
            onIssueDialogDetailsSocketEvent((event) => {
                const { updatedMain, updatedDependants } = patchTrackedIssueDialogItems(event.data);
                if (updatedMain || updatedDependants) {
                    reloadIssueDialogItemsForCurrentIssue();
                }
            }),
        ),
        onMount($issueDialogDetails, () => {
            const handler = IssueServerEventsHandler.getInstance();
            handler.onIssueChanged(handleIssueDialogDetailsIssueChanged);

            return () => {
                handler.unIssueChanged(handleIssueDialogDetailsIssueChanged);
                queueIssueDialogDetailsServerEventReload.cancel();
                serverEventReloadRequestId += 1;
            };
        }),
        $issueDialog.subscribe(({ open, view, issueId }) => {
            if (!open || view !== 'details') {
                const state = $issueDialogDetails.get();
                if (
                    state.issueId ||
                    state.issue ||
                    state.issueLoading ||
                    state.issueError ||
                    state.commentText ||
                    state.comments.length > 0
                ) {
                    resetIssueDialogDetailsAndInvalidate();
                }
                return;
            }

            const detailsState = $issueDialogDetails.get();
            if (issueId && issueId !== detailsState.issueId) {
                resetIssueDialogDetailsAndInvalidate(issueId);
            }
        }),
    ];
};

/**
 * Stop the issue dialog details wiring and detach all subscriptions.
 */
export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};
