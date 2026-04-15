import {Tooltip} from '@enonic/ui';
import {FileQuestionMarkIcon} from 'lucide-react';
import {type ReactElement} from 'react';
import type {ContentSummary} from '../../../../../app/content/ContentSummary';
import {useI18n} from '../../../hooks/useI18n';
import {calcContentState} from '../../../utils/cms/content/workflow';
import {calcTreePublishStatus} from '../../../utils/cms/content/status';
import {WorkflowContentIcon} from '../../icons/WorkflowContentIcon';
import {StatusBadge} from '../../status/StatusBadge';

export type MediaSelectorItemViewProps = {
    /** The content to display */
    content: ContentSummary;
    /** Whether to hide the status */
    hideStatus?: boolean;
};

const MEDIA_SELECTOR_ITEM_VIEW = 'MediaSelectorItemView';

// Gets an image content and render its image within a squared box, with its name and path to the side of the box.
// The squared box adjusts its size to be 36% of the element's width. For that, add @container class to the element you want to use as reference for the box size.
export const MediaSelectorItemView = ({content, hideStatus = false}: MediaSelectorItemViewProps): ReactElement => {
    const contentNotAvailableLabel = useI18n('text.content.not.found');

    // Content without a path is considered removed (deleted or archived)
    const isRemoved = !content.getPath();

    const contentId = content.getId();
    const displayName = content.getDisplayName() || content.getType()?.getLocalName();
    const subName = content.getPath() ? content.getPath().toString() : '';
    const statusHidden = hideStatus || !!content.getPublishTime();
    const status = statusHidden ? null : calcContentState(content);

    if (isRemoved) {
        return (
            <div data-component={MEDIA_SELECTOR_ITEM_VIEW} className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0">
                    <FileQuestionMarkIcon size={24} absoluteStrokeWidth className="text-error" />
                </div>
                <div className="min-w-0 w-full">
                    <span className="font-semibold text-base block whitespace-nowrap overflow-hidden text-ellipsis">{contentId}</span>
                    <span className="text-sm text-error block whitespace-nowrap overflow-hidden text-ellipsis">
                        {contentNotAvailableLabel}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div data-component={MEDIA_SELECTOR_ITEM_VIEW} className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0">
                <WorkflowContentIcon
                    status={status}
                    contentType={content.getType().toString()}
                    url={content.getIconUrl()}
                />
            </div>
            <div className="min-w-0 w-full">
                <span className="font-semibold text-base block whitespace-nowrap overflow-hidden text-ellipsis">{displayName}</span>
                <Tooltip delay={300} value={subName}>
                    <span
                        dir="rtl"
                        className="text-subtle text-sm block whitespace-nowrap overflow-hidden text-ellipsis text-left group-data-[tone=inverse]:text-alt"
                    >
                        <bdi>{subName}</bdi>
                    </span>
                </Tooltip>
            </div>

            {!hideStatus && <StatusBadge status={calcTreePublishStatus(content)} />}
        </div>
    );
};

MediaSelectorItemView.displayName = MEDIA_SELECTOR_ITEM_VIEW;
