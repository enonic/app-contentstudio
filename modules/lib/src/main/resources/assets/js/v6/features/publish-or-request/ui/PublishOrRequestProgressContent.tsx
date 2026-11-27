// What the publish or request dialog shows while a publish runs: the progress of its task.
// Takes the place of the steps; closing is off until the task ends.

import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { useTaskProgress } from '../../../entities/task/useTaskProgress';
import { useAnimatedEllipsis } from '../../../shared/lib/hooks/useAnimatedEllipsis';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { ProgressDialogContent } from '../../../shared/ui/dialogs/ProgressDialogContent';
import { $publishOrRequestDialog, $publishOrRequestPublishableCount } from '../model/publishOrRequestDialog.store';

const PUBLISH_OR_REQUEST_PROGRESS_CONTENT_NAME = 'PublishOrRequestProgressContent';

export const PublishOrRequestProgressContent = (): ReactElement => {
    const { taskId } = useStore($publishOrRequestDialog, { keys: ['taskId'] });
    const publishableCount = useStore($publishOrRequestPublishableCount);

    // Without a phase the server is still resolving what to publish, and there is nothing to count.
    const { progress, phase, phaseTotal } = useTaskProgress(taskId);
    const isResolving = phase == null;
    const total = phaseTotal ?? Math.max(1, publishableCount);

    const title = useI18n('dialog.publish');
    const resolvingDescription = useAnimatedEllipsis(useI18n('dialog.statusBar.loading'), isResolving);
    const publishingDescription = useI18n('dialog.publish.beingPublished', total);

    return (
        <ProgressDialogContent
            data-component={PUBLISH_OR_REQUEST_PROGRESS_CONTENT_NAME}
            title={title}
            description={isResolving ? resolvingDescription : publishingDescription}
            progress={isResolving ? undefined : progress}
        />
    );
};

PublishOrRequestProgressContent.displayName = PUBLISH_OR_REQUEST_PROGRESS_CONTENT_NAME;
