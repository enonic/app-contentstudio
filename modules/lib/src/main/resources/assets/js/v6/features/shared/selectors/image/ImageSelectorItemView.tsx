import {Tooltip} from '@enonic/ui';
import {type ReactElement} from 'react';
import type {ContentSummary} from '../../../../../app/content/ContentSummary';
import {ContentIconUrlResolver} from '../../../../../app/content/ContentIconUrlResolver';
import {useI18n} from '../../../hooks/useI18n';
import {calcTreePublishStatus} from '../../../utils/cms/content/status';
import {StatusBadge} from '../../status/StatusBadge';

export type ImageSelectorItemViewProps = {
    /** The content to display */
    content: ContentSummary;
    /** Whether to hide the status */
    hideStatus?: boolean;
};

const IMAGE_SELECTOR_ITEM_VIEW = 'ImageSelectorItemView';

// Gets an image content and render its image within a squared box, with its name and path to the side of the box.
// The squared box adjusts its size to be 36% of the element's width. For that, add @container class to the element you want to use as reference for the box size.
export const ImageSelectorItemView = ({content, hideStatus = false}: ImageSelectorItemViewProps): ReactElement => {
    const imageNotAvailableLabel = useI18n('text.image.notavailable');

    // Content without a path is considered removed (deleted or archived)
    const isRemoved = !content.getPath();

    const contentId = content.getId();
    const displayName = content.getDisplayName() || content.getType()?.getLocalName();
    const subName = content.getPath() ? content.getPath().toString() : '';
    const iconUrl = new ContentIconUrlResolver().setContent(content).resolve() + '&size=240';

    if (isRemoved) {
        return (
            <div data-component={IMAGE_SELECTOR_ITEM_VIEW} className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-[36cqw] max-w-[240px] flex items-center justify-center shrink-0">
                    <span className="text-sm text-error text-center m-1">{imageNotAvailableLabel}</span>
                </div>
                <div className="min-w-0">
                    <span className="font-semibold text-base block whitespace-nowrap overflow-hidden text-ellipsis">{contentId}</span>
                </div>
            </div>
        );
    }

    return (
        <div data-component={IMAGE_SELECTOR_ITEM_VIEW} className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-[36cqw] max-w-[240px] flex items-center justify-center shrink-0">
                <img src={iconUrl} alt={displayName} className="object-contain object-center w-full max-h-[240px]" />
            </div>

            <div className="min-w-0">
                <span className="font-semibold text-base block whitespace-nowrap overflow-hidden text-ellipsis">{displayName}</span>
                <Tooltip delay={300} value={subName}>
                    <span
                        dir="rtl"
                        className="text-subtle text-sm block whitespace-nowrap overflow-hidden text-ellipsis text-left group-data-[tone=inverse]:text-alt"
                    >
                        <bdi>{subName}</bdi>
                    </span>
                </Tooltip>

                {!hideStatus && <StatusBadge status={calcTreePublishStatus(content)} />}
            </div>
        </div>
    );
};

ImageSelectorItemView.displayName = IMAGE_SELECTOR_ITEM_VIEW;
