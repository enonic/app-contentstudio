// Warning shown when the user has no permission to publish some of the items.
// Exclude unticks them, when they all can be.

import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { StatusBarEntry } from '../../../../shared/ui/dialogs/status-bar/StatusBarEntry';
import { StatusBarEntryButton } from '../../../../shared/ui/dialogs/status-bar/StatusBarEntryButton';
import { StatusIcon } from '../../../../shared/ui/icons/StatusIcon';
import { excludePublishOrRequestNotPublishable } from '../../model/commands/checks';
import {
    $isPublishOrRequestNotPublishableExcludable,
    $publishOrRequestDialog,
} from '../../model/publishOrRequestDialog.store';

const PUBLISH_OR_REQUEST_PERMISSIONS_WARNING_NAME = 'PublishOrRequestPermissionsWarning';

export const PublishOrRequestPermissionsWarning = (): ReactElement => {
    const { notPublishableIds } = useStore($publishOrRequestDialog, { keys: ['notPublishableIds'] });
    const isExcludable = useStore($isPublishOrRequestNotPublishableExcludable);
    const text = useI18n('dialog.statusBar.error.noPermissions.text');
    const excludeLabel = useI18n('action.exclude');

    return (
        <StatusBarEntry data-component={PUBLISH_OR_REQUEST_PERMISSIONS_WARNING_NAME} className="bg-surface-error">
            <StatusIcon className="size-6" status="invalid" />
            <span className="text-sm font-semibold">
                {text} ({notPublishableIds.length})
            </span>
            {isExcludable && (
                <StatusBarEntryButton
                    className="[--color-ring-offset:var(--color-surface-error)]"
                    onClick={excludePublishOrRequestNotPublishable}
                >
                    {excludeLabel}
                </StatusBarEntryButton>
            )}
        </StatusBarEntry>
    );
};

PublishOrRequestPermissionsWarning.displayName = PUBLISH_OR_REQUEST_PERMISSIONS_WARNING_NAME;
