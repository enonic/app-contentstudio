import {type ReactElement} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentIconUrlResolver} from '../../../../../../app/content/ContentIconUrlResolver';
import {StatusBadge} from '../../../status/StatusBadge';

export type ImageItemViewProps = {
    /** The content to display */
    content: ContentSummaryAndCompareStatus;
    /** Whether to hide the status */
    hideStatus?: boolean;
};

const IMAGE_ITEM_VIEW = 'ImageItemView';

// Gets an image content and render its image within a squared box, with its name and path to the side of the box.
// The squared box adjusts its size to be 36% of the element's width. For that, add @container class to the element you want to use as reference for the box size.
export const ImageItemView = ({content, hideStatus = false}: ImageItemViewProps): ReactElement => {
    const displayName = content.getDisplayName() || content.getType()?.getLocalName();
    const subName = content.getPath() ? content.getPath().toString() : '';
    const iconUrl = new ContentIconUrlResolver().setContent(content.getContentSummary()).resolve() + '&size=270';

    return (
        <div data-component={IMAGE_ITEM_VIEW} className="flex items-center gap-2.5 min-w-0">
            <div className="relative aspect-square w-[36cqw] max-w-[270px] border border-bdr-subtle group-data-[tone=inverse]:border-alt flex items-center justify-center shrink-0">
                <img src={iconUrl} alt={displayName} className="object-contain object-center max-w-full max-h-full" />
            </div>
            <div className="min-w-0">
                <span className="font-semibold text-base block whitespace-nowrap overflow-hidden text-ellipsis">{displayName}</span>
                <span className="text-subtle text-sm block whitespace-nowrap overflow-hidden text-ellipsis group-data-[tone=inverse]:text-alt">
                    {subName}
                </span>
            </div>
            {!hideStatus && <StatusBadge status={content.getPublishStatus()} />}
        </div>
    );
};

ImageItemView.displayName = IMAGE_ITEM_VIEW;
