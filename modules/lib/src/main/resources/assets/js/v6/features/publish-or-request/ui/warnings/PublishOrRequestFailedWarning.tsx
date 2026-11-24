// Warning shown when the dependencies could not be resolved.
// Retry runs the same load again, with the applied selection.

import { type ReactElement } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { StatusBarEntry } from '../../../../shared/ui/dialogs/status-bar/StatusBarEntry';
import { StatusBarEntryButton } from '../../../../shared/ui/dialogs/status-bar/StatusBarEntryButton';
import { StatusIcon } from '../../../../shared/ui/icons/StatusIcon';
import { loadPublishOrRequestDialogData } from '../../model/commands/load';

const PUBLISH_OR_REQUEST_FAILED_WARNING_NAME = 'PublishOrRequestFailedWarning';

export const PublishOrRequestFailedWarning = (): ReactElement => {
    const text = useI18n('dialog.statusBar.error.failed.text');
    const retryLabel = useI18n('action.retry');

    return (
        <StatusBarEntry data-component={PUBLISH_OR_REQUEST_FAILED_WARNING_NAME} className="bg-surface-error">
            <StatusIcon className="size-6" status="invalid" />
            <span className="text-sm font-semibold">{text}</span>
            <StatusBarEntryButton
                className="[--color-ring-offset:var(--color-surface-error)]"
                onClick={() => void loadPublishOrRequestDialogData()}
            >
                {retryLabel}
            </StatusBarEntryButton>
        </StatusBarEntry>
    );
};

PublishOrRequestFailedWarning.displayName = PUBLISH_OR_REQUEST_FAILED_WARNING_NAME;
