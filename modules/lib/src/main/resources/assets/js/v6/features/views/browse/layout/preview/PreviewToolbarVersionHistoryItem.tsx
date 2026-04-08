import {Button, Toolbar} from '@enonic/ui';
import {History} from 'lucide-react';
import type {ReactElement} from 'react';
import {CompareStatus} from '../../../../../../app/content/CompareStatus';
import {InspectEvent} from '../../../../../../app/event/InspectEvent';
import {InternalExtensionType} from '../../../../../../app/view/context/ExtensionView';
import {useI18n} from '../../../../hooks/useI18n';

type PreviewToolbarVersionHistoryItemProps = {
    compareStatus: CompareStatus;
    isMovedAndModified: boolean;
};

export function PreviewToolbarVersionHistoryItem({
    compareStatus,
    isMovedAndModified,
}: PreviewToolbarVersionHistoryItemProps): ReactElement {
    const ariaLabel = useI18n('wcag.preview.toolbar.versionHistory.label');
    const versionHistoryLabel = useI18n('field.preview.toolbar.versionHistory.label');
    const modifiedLabel = useI18n('status.modified');

    const buttonLabel = compareStatus === CompareStatus.NEWER || isMovedAndModified
        ? modifiedLabel
        : versionHistoryLabel;

    const handleShowVersionHistory = () => {
        InspectEvent.create()
            .setWidgetType(InternalExtensionType.HISTORY)
            .setShowExtension(true)
            .setShowPanel(true)
            .build()
            .fire();
    };

    return (
        <Toolbar.Item asChild>
            <Button
                size="sm"
                className="min-w-9 @max-sm:p-0 flex-shrink-0"
                aria-label={ariaLabel}
                startIcon={History}
                onClick={handleShowVersionHistory}
            >
                <span className="hidden @sm:inline">{buttonLabel}</span>
            </Button>
        </Toolbar.Item>
    );
}

PreviewToolbarVersionHistoryItem.displayName = 'PreviewToolbarVersionHistoryItem';
