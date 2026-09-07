import { Button, Toolbar } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { History } from 'lucide-react';
import type { ReactElement } from 'react';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { PublishStatus } from '../../../../app/publish/PublishStatus';
import { $currentItem } from '../../../entities/content';
import { openContextWidget } from '../../context-panel/openContextWidget';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import {
    calcSecondaryStatus,
    calcTreePublishStatus,
    createSecondaryStatusKey,
} from '../../../shared/lib/cms/content/status';
import { VERSIONS_WIDGET_NAME } from '../../../shared/lib/widget/versions/versions';

type PreviewToolbarVersionHistoryItemProps = {
    contentSummary: ContentSummary;
    mobile?: boolean;
    showStatus?: boolean;
};

export function PreviewToolbarVersionHistoryItem({
    contentSummary,
    mobile = false,
    showStatus = false,
}: PreviewToolbarVersionHistoryItemProps): ReactElement {
    const ariaLabel = useI18n('wcag.preview.toolbar.versionHistory.label');

    const publishStatus = calcTreePublishStatus(contentSummary);
    const primaryStatusKey = publishStatus === PublishStatus.PENDING ? 'status.scheduled' : 'status.published';
    const primaryStatusLabel = useI18n(primaryStatusKey);

    const secondaryStatus = calcSecondaryStatus(publishStatus, contentSummary);
    const secondaryStatusKey = secondaryStatus ? createSecondaryStatusKey(secondaryStatus) : '';
    const secondaryStatusLabel = useI18n(secondaryStatusKey);

    const buttonLabel = secondaryStatus ? secondaryStatusLabel : primaryStatusLabel;

    const handleShowVersionHistory = () => {
        openContextWidget(VERSIONS_WIDGET_NAME);
    };

    return (
        <Toolbar.Item asChild>
            <Button
                size="sm"
                className={mobile ? 'min-w-9 shrink-0' : showStatus ? 'min-w-0 shrink' : 'min-w-9 @max-sm:p-0 shrink-0'}
                aria-label={ariaLabel}
                startIcon={History}
                startIconClassName={mobile ? 'size-5 shrink-0' : 'shrink-0'}
                onClick={handleShowVersionHistory}
            >
                <span className={mobile ? 'inline' : showStatus ? 'min-w-0 truncate' : 'hidden @sm:inline'}>
                    {buttonLabel}
                </span>
            </Button>
        </Toolbar.Item>
    );
}

PreviewToolbarVersionHistoryItem.displayName = 'PreviewToolbarVersionHistoryItem';

export function CurrentPreviewToolbarVersionHistoryItem(): ReactElement | null {
    const currentItem = useStore($currentItem);

    return currentItem ? <PreviewToolbarVersionHistoryItem contentSummary={currentItem} mobile /> : null;
}

CurrentPreviewToolbarVersionHistoryItem.displayName = 'CurrentPreviewToolbarVersionHistoryItem';
