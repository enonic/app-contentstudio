// Warning shown while the dependency selection has changes that are not applied yet.
// Apply resolves the dependencies again with them; Cancel drops them.

import { type ReactElement } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { StatusBarEntry } from '../../../../shared/ui/dialogs/status-bar/StatusBarEntry';
import { StatusBarEntryButton } from '../../../../shared/ui/dialogs/status-bar/StatusBarEntryButton';
import { StatusIcon } from '../../../../shared/ui/icons/StatusIcon';
import { applyPublishOrRequestSelection, cancelPublishOrRequestSelection } from '../../model/commands/selection';

const PUBLISH_OR_REQUEST_APPLY_WARNING_NAME = 'PublishOrRequestApplyWarning';

const BUTTON_CLASS_NAME = '[--color-ring-offset:var(--color-surface-info)]';

export const PublishOrRequestApplyWarning = (): ReactElement => {
    const text = useI18n('dialog.state.editing');
    const applyLabel = useI18n('action.apply');
    const cancelLabel = useI18n('action.cancel');

    return (
        <StatusBarEntry data-component={PUBLISH_OR_REQUEST_APPLY_WARNING_NAME} className="bg-surface-info">
            <StatusIcon className="size-6" status="info" />
            <span className="text-sm font-semibold">{text}</span>
            <StatusBarEntryButton className={BUTTON_CLASS_NAME} onClick={applyPublishOrRequestSelection}>
                {applyLabel}
            </StatusBarEntryButton>
            <StatusBarEntryButton className={BUTTON_CLASS_NAME} onClick={cancelPublishOrRequestSelection}>
                {cancelLabel}
            </StatusBarEntryButton>
        </StatusBarEntry>
    );
};

PublishOrRequestApplyWarning.displayName = PUBLISH_OR_REQUEST_APPLY_WARNING_NAME;
