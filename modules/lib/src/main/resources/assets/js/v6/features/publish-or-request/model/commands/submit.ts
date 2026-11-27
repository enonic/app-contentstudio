// Commands that submit the publish or request dialog. A publish, scheduled or not, runs as a
// task on the server: the dialog shows its progress and closes when it ends.

import { publishContent } from '../../../../entities/content/api/publish.api';
import { cleanupTask, trackTask, type TaskResultState } from '../../../../entities/task';
import { i18n } from '../../../../shared/i18n';
import { notifyError, notifySuccess } from '../../../../shared/notifications';
import { $publishOrRequestDialog, $publishOrRequestPublishableCount } from '../publishOrRequestDialog.store';
import {
    $isPublishOrRequestSubmitAllowed,
    $publishOrRequestAction,
    $publishOrRequestFields,
} from '../publishOrRequestFields.store';
import { cancelPublishOrRequestDialogLoad, loadPublishOrRequestDialogData } from './load';
import { closePublishOrRequestDialog, getPublishOrRequestDialogSessionId } from './open';

/**
 * Runs what the second step was filled for: publishes the items, now or at the dates entered.
 * Does nothing while the dialog cannot be submitted.
 */
export async function submitPublishOrRequestDialog(): Promise<void> {
    if (!$isPublishOrRequestSubmitAllowed.get()) return;

    const action = $publishOrRequestAction.get();
    // TODO: [#11792] Create the publish request.
    if (action === 'request') return;

    const { comment, scheduleFrom, scheduleTo } = $publishOrRequestFields.get();

    await publishItems({
        message: comment.trim() || undefined,
        schedule: action === 'schedule' ? { from: scheduleFrom, to: scheduleTo } : undefined,
    });
}

// *
// * Internal
// *

type PublishOptions = {
    message?: string;
    /** Without "from" the items go online now. */
    schedule?: { from?: Date; to?: Date };
};

// Publishes what the applied selection resolves to: the same three lists the dependencies
// were resolved with, so what is published is what was listed.
async function publishItems({ message, schedule }: PublishOptions): Promise<void> {
    const sessionId = getPublishOrRequestDialogSessionId();
    const { items, excludeChildrenIds, appliedExcludedDependantIds } = $publishOrRequestDialog.get();
    const count = $publishOrRequestPublishableCount.get();
    const name = items[0]?.getDisplayName() || items[0]?.getPath()?.toString() || '';
    const isScheduled = schedule != null;

    // A load that waits for more events would change what is on screen behind the progress.
    cancelPublishOrRequestDialogLoad();
    $publishOrRequestDialog.setKey('submitting', 'publish');

    const result = await publishContent({
        ids: items.map((item) => item.getContentId()),
        excludedIds: appliedExcludedDependantIds,
        excludeChildrenIds,
        message,
        schedule,
    });
    if (sessionId !== getPublishOrRequestDialogSessionId()) return;

    if (result.isErr()) {
        notifyError(i18n('dialog.publish.publishing.error'));
        $publishOrRequestDialog.setKey('submitting', undefined);
        // The events were ignored meanwhile, so the list may be behind.
        void loadPublishOrRequestDialogData();
        return;
    }

    const taskId = result.value;

    // ? Tracked before the id is stored: the progress view tracks the same task once it
    // ? shows, and the first one to track is the one whose callback runs.
    trackTask(taskId, {
        onComplete: (state: TaskResultState, text: string) => {
            if (state === 'SUCCESS') {
                notifySuccess(getSuccessText(isScheduled, count, name));
            } else {
                notifyError(text);
            }

            cleanupTask(taskId);
            if (sessionId === getPublishOrRequestDialogSessionId()) closePublishOrRequestDialog();
        },
    });

    $publishOrRequestDialog.setKey('taskId', taskId);
}

function getSuccessText(isScheduled: boolean, count: number, name: string): string {
    if (isScheduled) {
        return count > 1
            ? i18n('dialog.publishOrRequest.scheduled.multiple', count)
            : i18n('dialog.publishOrRequest.scheduled.single', name);
    }

    return count > 1 ? i18n('dialog.publish.success.multiple', count) : i18n('dialog.publish.success.single', name);
}
