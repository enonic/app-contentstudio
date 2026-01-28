import {ContentId} from '../../../../../app/content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {PublishRequestItem} from '../../../../../app/issue/PublishRequestItem';
import {hasContentIdInIds} from './ids';

export const getItemIds = (items: ContentSummaryAndCompareStatus[]): ContentId[] => {
    return items.map(item => item.getContentId());
};

export const dedupeItems = (items: ContentSummaryAndCompareStatus[]): ContentSummaryAndCompareStatus[] => {
    const deduped = new Map<string, ContentSummaryAndCompareStatus>();
    items.forEach(item => deduped.set(item.getContentId().toString(), item));
    return Array.from(deduped.values());
};

export const buildItems = (
    items: ContentSummaryAndCompareStatus[],
    excludedChildrenIds: ContentId[],
): PublishRequestItem[] => {
    return items.map(item =>
        PublishRequestItem
            .create()
            .setId(item.getContentId())
            .setIncludeChildren(!hasContentIdInIds(item.getContentId(), excludedChildrenIds))
            .build()
    );
};
