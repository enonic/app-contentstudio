// Entry shown when nothing stands in the way: the selection is applied, every check passes
// and there is something to publish. Not a warning, but it takes the same place.

import { type ReactElement } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { StatusBarEntry } from '../../../../shared/ui/dialogs/status-bar/StatusBarEntry';
import { StatusIcon } from '../../../../shared/ui/icons/StatusIcon';

const PUBLISH_OR_REQUEST_READY_ENTRY_NAME = 'PublishOrRequestReadyEntry';

export const PublishOrRequestReadyEntry = (): ReactElement => {
    const text = useI18n('dialog.statusBar.error.ready.text');

    return (
        <StatusBarEntry data-component={PUBLISH_OR_REQUEST_READY_ENTRY_NAME} className="bg-surface-success">
            <StatusIcon className="size-6" status="ready" />
            <span className="text-sm font-semibold">{text}</span>
        </StatusBarEntry>
    );
};

PublishOrRequestReadyEntry.displayName = PUBLISH_OR_REQUEST_READY_ENTRY_NAME;
