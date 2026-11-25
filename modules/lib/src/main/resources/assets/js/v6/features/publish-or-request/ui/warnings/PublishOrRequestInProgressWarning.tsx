// Warning shown when some of the items to publish are still in progress,
// i.e. not marked as ready yet.

import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { StatusBarEntry } from '../../../../shared/ui/dialogs/status-bar/StatusBarEntry';
import { StatusIcon } from '../../../../shared/ui/icons/StatusIcon';
import { $publishOrRequestDialog } from '../../model/publishOrRequestDialog.store';

const PUBLISH_OR_REQUEST_IN_PROGRESS_WARNING_NAME = 'PublishOrRequestInProgressWarning';

export const PublishOrRequestInProgressWarning = (): ReactElement => {
    const { inProgressIds } = useStore($publishOrRequestDialog, { keys: ['inProgressIds'] });
    const text = useI18n('dialog.statusBar.error.inProgress.text');

    return (
        <StatusBarEntry data-component={PUBLISH_OR_REQUEST_IN_PROGRESS_WARNING_NAME} className="bg-surface-warn">
            <StatusIcon className="size-6" status="in-progress" />
            <span className="text-sm font-semibold">
                {text} ({inProgressIds.length})
            </span>
        </StatusBarEntry>
    );
};

PublishOrRequestInProgressWarning.displayName = PUBLISH_OR_REQUEST_IN_PROGRESS_WARNING_NAME;
