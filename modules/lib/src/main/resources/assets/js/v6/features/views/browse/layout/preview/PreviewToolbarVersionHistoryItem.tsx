import {Button, Toolbar} from '@enonic/ui';
import {History} from 'lucide-react';
import type {ReactElement} from 'react';
import type {ContentSummary} from '../../../../../../app/content/ContentSummary';
import {InspectEvent} from '../../../../../../app/event/InspectEvent';
import {InternalExtensionType} from '../../../../../../app/view/context/ExtensionView';
import {useI18n} from '../../../../hooks/useI18n';
import {calcSecondaryStatus, calcTreePublishStatus, createSecondaryStatusKey} from '../../../../utils/cms/content/status';

type PreviewToolbarVersionHistoryItemProps = {
    contentSummary: ContentSummary;
};

export function PreviewToolbarVersionHistoryItem({
    contentSummary,
}: PreviewToolbarVersionHistoryItemProps): ReactElement {
    const ariaLabel = useI18n('wcag.preview.toolbar.versionHistory.label');
    const publishedLabel = useI18n('status.published');

    const secondaryStatus = calcSecondaryStatus(calcTreePublishStatus(contentSummary), contentSummary);
    const secondaryStatusLabel = useI18n(secondaryStatus ? createSecondaryStatusKey(secondaryStatus) : '');
    const buttonLabel = secondaryStatus ? secondaryStatusLabel : publishedLabel;

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
