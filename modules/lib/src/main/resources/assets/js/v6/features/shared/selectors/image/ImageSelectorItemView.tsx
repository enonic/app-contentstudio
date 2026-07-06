import { Tooltip } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import { buildImagePreviewUrl } from '../../../../shared/lib/url/images';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { $activeProject } from '../../../../entities/project';
import { calcTreePublishStatus } from '../../../../shared/lib/cms/content/status';
import { StatusBadge } from '../../status/StatusBadge';

export type ImageSelectorItemViewProps = {
    /** The content to display */
    content: ContentSummary;
    /** Whether to hide the status */
    hideStatus?: boolean;
};

const IMAGE_SELECTOR_ITEM_VIEW = 'ImageSelectorItemView';

// Gets an image content and renders its image within a box, with its name and path to the side of the box.
// The box width is 36% of the element's width (capped at 240px) and its height follows the image's aspect ratio,
// clamped to the box width so vertical images stay within a square. For that, add @container class to the element you want to use as reference for the box size.
export const ImageSelectorItemView = ({ content, hideStatus = false }: ImageSelectorItemViewProps): ReactElement => {
    const imageNotAvailableLabel = useI18n('text.image.notavailable');
    const activeProject = useStore($activeProject);

    // Content without a path is considered removed (deleted or archived)
    const isRemoved = !content.getPath();

    const contentId = content.getId();

    if (isRemoved) {
        return (
            <div data-component={IMAGE_SELECTOR_ITEM_VIEW} className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-[36cqw] max-w-[240px] aspect-square flex items-center justify-center shrink-0 border border-error">
                    <span className="text-sm text-error text-center m-1">{imageNotAvailableLabel}</span>
                </div>
                <div className="min-w-0">
                    <span className="font-semibold text-base block whitespace-nowrap overflow-hidden text-ellipsis">
                        {contentId}
                    </span>
                </div>
            </div>
        );
    }

    const displayName = content.getDisplayName() || content.getType()?.getLocalName();
    const subName = content.getPath() ? content.getPath().toString() : '';
    const iconUrl = buildImagePreviewUrl({
        contentId: content.getContentId().toString(),
        projectName: activeProject?.getName(),
        timestamp: content.getModifiedTime() ?? undefined,
        size: 480,
        crop: false,
    });

    return (
        <div data-component={IMAGE_SELECTOR_ITEM_VIEW} className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-[36cqw] max-w-[240px] self-stretch flex items-center justify-center shrink-0">
                <img
                    src={iconUrl}
                    alt={displayName}
                    className="object-contain object-center w-full max-h-[min(36cqw,240px)]"
                />
            </div>

            <div className="min-w-0">
                <span className="font-semibold text-base block whitespace-nowrap overflow-hidden text-ellipsis">
                    {displayName}
                </span>
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
