// The warnings of the publish or request dialog's first step.
// Decides which one shows; each warning lives in its own file in this folder.

import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { $isPublishOrRequestSelectionSynced, $publishOrRequestDialog } from '../../model/publishOrRequestDialog.store';
import { PublishOrRequestApplyWarning } from './PublishOrRequestApplyWarning';
import { PublishOrRequestFailedWarning } from './PublishOrRequestFailedWarning';

const PUBLISH_OR_REQUEST_WARNINGS_NAME = 'PublishOrRequestWarnings';

export const PublishOrRequestWarnings = (): ReactElement | null => {
    const { failed } = useStore($publishOrRequestDialog, { keys: ['failed'] });
    const isSelectionSynced = useStore($isPublishOrRequestSelectionSynced);

    if (failed) return <PublishOrRequestFailedWarning />;
    if (!isSelectionSynced) return <PublishOrRequestApplyWarning />;

    return null;
};

PublishOrRequestWarnings.displayName = PUBLISH_OR_REQUEST_WARNINGS_NAME;
