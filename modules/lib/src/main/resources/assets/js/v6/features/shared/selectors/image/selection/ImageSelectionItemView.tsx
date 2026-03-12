import {type ReactElement} from 'react';
import {ContentIconUrlResolver} from '../../../../../../app/content/ContentIconUrlResolver';
import {type ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';

export type ImageSelectionItemViewProps = {
    /** The content to display */
    content: ContentSummaryAndCompareStatus;
};

const IMAGE_SELECTION_ITEM_VIEW_NAME = 'ImageSelectionItemView';

// Gets an image content and render its image within a squared box, with its name and path to the side of the box.
// The squared box adjusts its size based on the parent's size. For that, add @container to the parent's class.
export const ImageSelectionItemView = ({content}: ImageSelectionItemViewProps): ReactElement => {
    const displayName = content.getDisplayName() || content.getType()?.getLocalName();
    const subName = content.getPath() ? content.getPath().toString() : '';
    const iconUrl = new ContentIconUrlResolver().setContent(content.getContentSummary()).resolve() + '&size=270';

    return (
        <div className="flex items-center gap-2.5 min-w-0">
            <div className="aspect-square w-[36cqw] max-w-[270px] border border-bdr-subtle group-data-[tone=inverse]:border-alt  flex items-center justify-center shrink-0">
                <img src={iconUrl} alt={displayName} className="object-contain object-center max-w-full max-h-full" />
            </div>
            <div className="min-w-0">
                <span className="font-semibold text-base block whitespace-nowrap overflow-hidden text-ellipsis">{displayName}</span>
                <span className="text-subtle text-sm block whitespace-nowrap overflow-hidden text-ellipsis group-data-[tone=inverse]:text-alt">
                    {subName}
                </span>
            </div>
        </div>
    );
};

ImageSelectionItemView.displayName = IMAGE_SELECTION_ITEM_VIEW_NAME;
