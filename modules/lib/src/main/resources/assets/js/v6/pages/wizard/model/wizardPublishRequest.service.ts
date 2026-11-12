import { IssueServerEventsHandler } from '../../../../app/issue/event/IssueServerEventsHandler';
import { IssueType } from '../../../../app/issue/IssueType';
import { findOpenIssues } from '../../../entities/issue/api/issues.api';
import { openIssueDialogDetails } from '../../../features/issues/model/issueDialog.store';
import { handleError } from '../../../shared/notifications';
import { patchWizardActionFacts } from './wizardActions.store';

//
// * Wizard Publish Request Service
//
// Finds the open publish request the edited content belongs to, so the
// wizard can offer to open it.
//

const REFRESH_DELAY_MS = 500;

let contentId: string | undefined;
let publishRequestId: string | undefined;
let requestId = 0;
let pendingRefresh: ReturnType<typeof setTimeout> | undefined;
let stopListening: (() => void) | undefined;

function setPublishRequest(id: string | undefined): void {
    publishRequestId = id;
    patchWizardActionFacts({ hasPublishRequest: id != null });
}

function refresh(): void {
    pendingRefresh = undefined;
    if (contentId == null) return;

    const id = ++requestId;

    void findOpenIssues(contentId).match((issues) => {
        if (id !== requestId) return;

        // The oldest publish request wins when the content is in several.
        const publishRequest = [...issues].reverse().find((issue) => issue.getType() === IssueType.PUBLISH_REQUEST);
        setPublishRequest(publishRequest?.getId());
    }, handleError);
}

function scheduleRefresh(): void {
    if (contentId == null) return;

    clearTimeout(pendingRefresh);
    pendingRefresh = setTimeout(refresh, REFRESH_DELAY_MS);
}

/** Looks the publish request up again; called whenever the edited content is updated. */
export function refreshWizardPublishRequest(id: string): void {
    const isFirst = contentId == null;
    contentId = id;

    if (isFirst) {
        refresh();
    } else {
        scheduleRefresh();
    }
}

export function openWizardPublishRequest(): void {
    if (publishRequestId != null) openIssueDialogDetails(publishRequestId);
}

//
// * Service Lifecycle
//

export const start = (): void => {
    if (stopListening) return;

    const handler = IssueServerEventsHandler.getInstance();
    // The content may have been taken out of an issue, so every issue change counts.
    handler.onIssueCreated(scheduleRefresh);
    handler.onIssueUpdated(scheduleRefresh);

    stopListening = () => {
        handler.unIssueCreated(scheduleRefresh);
        handler.unIssueUpdated(scheduleRefresh);
    };
};

export const stop = (): void => {
    stopListening?.();
    stopListening = undefined;
    clearTimeout(pendingRefresh);
    pendingRefresh = undefined;
    contentId = undefined;
    publishRequestId = undefined;
    requestId += 1;
};
