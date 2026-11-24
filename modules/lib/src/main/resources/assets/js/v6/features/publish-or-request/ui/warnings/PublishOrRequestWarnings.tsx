// The warnings of the publish or request dialog's first step.
// Decides which ones show; each warning lives in its own file in this folder.

import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { $isPublishOrRequestSelectionSynced } from '../../model/publishOrRequestDialog.store';
import { PublishOrRequestApplyWarning } from './PublishOrRequestApplyWarning';

const PUBLISH_OR_REQUEST_WARNINGS_NAME = 'PublishOrRequestWarnings';

export const PublishOrRequestWarnings = (): ReactElement | null => {
    const isSelectionSynced = useStore($isPublishOrRequestSelectionSynced);

    if (isSelectionSynced) return null;

    return <PublishOrRequestApplyWarning />;
};

PublishOrRequestWarnings.displayName = PUBLISH_OR_REQUEST_WARNINGS_NAME;
