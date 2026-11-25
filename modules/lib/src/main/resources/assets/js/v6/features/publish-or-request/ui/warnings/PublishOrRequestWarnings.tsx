// The warnings of the publish or request dialog's first step.
// Decides which one shows; each warning lives in its own file in this folder.

import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { $isPublishOrRequestSelectionSynced, $publishOrRequestDialog } from '../../model/publishOrRequestDialog.store';
import { PublishOrRequestApplyWarning } from './PublishOrRequestApplyWarning';
import { PublishOrRequestFailedWarning } from './PublishOrRequestFailedWarning';
import { PublishOrRequestInProgressWarning } from './PublishOrRequestInProgressWarning';

const PUBLISH_OR_REQUEST_WARNINGS_NAME = 'PublishOrRequestWarnings';

export const PublishOrRequestWarnings = (): ReactElement | null => {
    const { failed, inProgressIds } = useStore($publishOrRequestDialog, { keys: ['failed', 'inProgressIds'] });
    const isSelectionSynced = useStore($isPublishOrRequestSelectionSynced);

    if (failed) return <PublishOrRequestFailedWarning />;
    if (!isSelectionSynced) return <PublishOrRequestApplyWarning />;
    if (inProgressIds.length > 0) return <PublishOrRequestInProgressWarning />;

    return null;
};

PublishOrRequestWarnings.displayName = PUBLISH_OR_REQUEST_WARNINGS_NAME;
