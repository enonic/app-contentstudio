// Warning shown when none of the items has anything to publish,
// e.g. when they are all online and unchanged, or the ones that are not were unticked.

import { type ReactElement } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { StatusBarEntry } from '../../../../shared/ui/dialogs/status-bar/StatusBarEntry';
import { StatusIcon } from '../../../../shared/ui/icons/StatusIcon';

const PUBLISH_OR_REQUEST_NOTHING_TO_PUBLISH_WARNING_NAME = 'PublishOrRequestNothingToPublishWarning';

export const PublishOrRequestNothingToPublishWarning = (): ReactElement => {
    const text = useI18n('dialog.publish.noItems');

    return (
        <StatusBarEntry data-component={PUBLISH_OR_REQUEST_NOTHING_TO_PUBLISH_WARNING_NAME} className="bg-surface-warn">
            <StatusIcon className="size-6" status="in-progress" />
            <span className="text-sm font-semibold">{text}</span>
        </StatusBarEntry>
    );
};

PublishOrRequestNothingToPublishWarning.displayName = PUBLISH_OR_REQUEST_NOTHING_TO_PUBLISH_WARNING_NAME;
