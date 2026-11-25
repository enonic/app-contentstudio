// The warnings of the publish or request dialog's first step.
// Decides which ones show; each warning lives in its own file in this folder.

import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { $isPublishOrRequestSelectionSynced, $publishOrRequestDialog } from '../../model/publishOrRequestDialog.store';
import { PublishOrRequestApplyWarning } from './PublishOrRequestApplyWarning';
import { PublishOrRequestFailedWarning } from './PublishOrRequestFailedWarning';
import { PublishOrRequestInProgressWarning } from './PublishOrRequestInProgressWarning';
import { PublishOrRequestInvalidWarning } from './PublishOrRequestInvalidWarning';
import { PublishOrRequestPermissionsWarning } from './PublishOrRequestPermissionsWarning';

const PUBLISH_OR_REQUEST_WARNINGS_NAME = 'PublishOrRequestWarnings';

export const PublishOrRequestWarnings = (): ReactElement | null => {
    const { failed, inProgressIds, invalidIds, notPublishableIds } = useStore($publishOrRequestDialog, {
        keys: ['failed', 'inProgressIds', 'invalidIds', 'notPublishableIds'],
    });
    const isSelectionSynced = useStore($isPublishOrRequestSelectionSynced);

    const hasInProgress = inProgressIds.length > 0;
    const hasInvalid = invalidIds.length > 0;
    const hasNotPublishable = notPublishableIds.length > 0;

    if (failed) return <PublishOrRequestFailedWarning />;
    if (!isSelectionSynced) return <PublishOrRequestApplyWarning />;
    if (!hasInProgress && !hasInvalid && !hasNotPublishable) return null;

    // The checks are about different items, so they show together.
    return (
        <div data-component={PUBLISH_OR_REQUEST_WARNINGS_NAME} className="flex flex-col gap-2.5">
            {hasInProgress && <PublishOrRequestInProgressWarning />}
            {hasInvalid && <PublishOrRequestInvalidWarning />}
            {hasNotPublishable && <PublishOrRequestPermissionsWarning />}
        </div>
    );
};

PublishOrRequestWarnings.displayName = PUBLISH_OR_REQUEST_WARNINGS_NAME;
