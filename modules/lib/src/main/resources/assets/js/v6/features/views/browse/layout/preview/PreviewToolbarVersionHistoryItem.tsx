import {Button, Toolbar} from '@enonic/ui';
import {History} from 'lucide-react';
import type {ReactElement} from 'react';
import type {ContentSummary} from '../../../../../../app/content/ContentSummary';
import {InspectEvent} from '../../../../../../app/event/InspectEvent';
import {InternalExtensionType} from '../../../../../../app/view/context/ExtensionView';
import {useI18n} from '../../../../hooks/useI18n';
import {calcSecondaryStatus, calcTreePublishStatus} from '../../../../utils/cms/content/status';

type PreviewToolbarVersionHistoryItemProps = {
    contentSummary: ContentSummary;
};

export function PreviewToolbarVersionHistoryItem({
    contentSummary,
}: PreviewToolbarVersionHistoryItemProps): ReactElement {
    const ariaLabel = useI18n('wcag.preview.toolbar.versionHistory.label');
    const versionHistoryLabel = useI18n('field.preview.toolbar.versionHistory.label');
    const modifiedLabel = useI18n('status.modified');

    const isModified = calcSecondaryStatus(calcTreePublishStatus(contentSummary), contentSummary) === 'modified';
    const buttonLabel = isModified ? modifiedLabel : versionHistoryLabel;

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
