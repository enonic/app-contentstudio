// Warning shown when some of the items to publish are still in progress,
// i.e. not marked as ready yet. Exclude unticks them, when they all can be.

import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { StatusBarEntry } from '../../../../shared/ui/dialogs/status-bar/StatusBarEntry';
import { StatusBarEntryButton } from '../../../../shared/ui/dialogs/status-bar/StatusBarEntryButton';
import { StatusIcon } from '../../../../shared/ui/icons/StatusIcon';
import { excludePublishOrRequestInProgress } from '../../model/commands/checks';
import {
    $isPublishOrRequestInProgressExcludable,
    $publishOrRequestDialog,
} from '../../model/publishOrRequestDialog.store';

const PUBLISH_OR_REQUEST_IN_PROGRESS_WARNING_NAME = 'PublishOrRequestInProgressWarning';

const BUTTON_CLASS_NAME = '[--color-ring-offset:var(--color-surface-warn)]';

export const PublishOrRequestInProgressWarning = (): ReactElement => {
    const { inProgressIds } = useStore($publishOrRequestDialog, { keys: ['inProgressIds'] });
    const isExcludable = useStore($isPublishOrRequestInProgressExcludable);
    const text = useI18n('dialog.statusBar.error.inProgress.text');
    const excludeLabel = useI18n('action.exclude');

    return (
        <StatusBarEntry data-component={PUBLISH_OR_REQUEST_IN_PROGRESS_WARNING_NAME} className="bg-surface-warn">
            <StatusIcon className="size-6" status="in-progress" />
            <span className="text-sm font-semibold">
                {text} ({inProgressIds.length})
            </span>
            {isExcludable && (
                <StatusBarEntryButton className={BUTTON_CLASS_NAME} onClick={excludePublishOrRequestInProgress}>
                    {excludeLabel}
                </StatusBarEntryButton>
            )}
        </StatusBarEntry>
    );
};

PublishOrRequestInProgressWarning.displayName = PUBLISH_OR_REQUEST_IN_PROGRESS_WARNING_NAME;
