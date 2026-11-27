// Warning shown when some of the items to publish are invalid.
// Exclude unticks them, when they all can be; otherwise they have to be fixed first.

import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { StatusBarEntry } from '../../../../shared/ui/dialogs/status-bar/StatusBarEntry';
import { StatusBarEntryButton } from '../../../../shared/ui/dialogs/status-bar/StatusBarEntryButton';
import { StatusIcon } from '../../../../shared/ui/icons/StatusIcon';
import { excludePublishOrRequestInvalid } from '../../model/commands/checks';
import {
    $isPublishOrRequestInvalidExcludable,
    $publishOrRequestDialog,
} from '../../model/publishOrRequestDialog.store';

const PUBLISH_OR_REQUEST_INVALID_WARNING_NAME = 'PublishOrRequestInvalidWarning';

export const PublishOrRequestInvalidWarning = (): ReactElement => {
    const { invalidIds } = useStore($publishOrRequestDialog, { keys: ['invalidIds'] });
    const isExcludable = useStore($isPublishOrRequestInvalidExcludable);
    const text = useI18n('dialog.statusBar.error.invalid.text');
    const excludeLabel = useI18n('action.exclude');

    return (
        <StatusBarEntry data-component={PUBLISH_OR_REQUEST_INVALID_WARNING_NAME} className="bg-surface-error">
            <StatusIcon className="size-6" status="invalid" />
            <span className="text-sm font-semibold">
                {text} ({invalidIds.length})
            </span>
            {isExcludable && (
                <StatusBarEntryButton
                    className="[--color-ring-offset:var(--color-surface-error)]"
                    onClick={excludePublishOrRequestInvalid}
                >
                    {excludeLabel}
                </StatusBarEntryButton>
            )}
        </StatusBarEntry>
    );
};

PublishOrRequestInvalidWarning.displayName = PUBLISH_OR_REQUEST_INVALID_WARNING_NAME;
